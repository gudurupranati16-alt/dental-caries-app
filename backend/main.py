from __future__ import annotations

import json
import os
import csv
import math
from pathlib import Path

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse

from model import (
    DEEPLABV3_PLUS,
    YOLO11N,
    ModelNotConfiguredError,
    STATE,
    load_model,
    predict as run_predict,
)

app = FastAPI(title="Dental Caries Detection API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_PATH = Path(os.getenv("EVAL_PATH", Path(__file__).with_name("results.json")))
APP_ROOT = Path(__file__).resolve().parent.parent
TRAINING_SUMMARIES = {
    YOLO11N: APP_ROOT / "docs" / "YOLO11n_training_summary.csv",
    DEEPLABV3_PLUS: APP_ROOT / "docs" / "DeepLabV3+_training_summary.csv",
}
DEEPLAB_CLASS_NAMES = {
    0: "Background",
    1: "Impacted",
    2: "Caries",
    3: "Periapical Lesion",
    4: "Deep Caries",
}
METRIC_LABELS = {
    "train/box_loss": "Training box loss",
    "train/cls_loss": "Training classification loss",
    "train/dfl_loss": "Training distribution focal loss",
    "metrics/precision(B)": "Precision",
    "metrics/recall(B)": "Recall",
    "metrics/mAP50(B)": "mAP@0.50",
    "metrics/mAP50-95(B)": "mAP@0.50:0.95",
    "val/box_loss": "Validation box loss",
    "val/cls_loss": "Validation classification loss",
    "val/dfl_loss": "Validation distribution focal loss",
    "F1": "F1 score",
    "train_loss": "Training loss",
    "val_loss": "Validation loss",
    "val_dice": "Validation Dice",
    "val_iou": "Validation IoU",
    "best_val_dice": "Best validation Dice so far",
}
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


def _metric_label(model_name: str, column: str) -> str:
    if column in METRIC_LABELS:
        return METRIC_LABELS[column]
    for metric_prefix, metric_label in (("dice_class_", "Dice"), ("iou_class_", "IoU")):
        if column.startswith(metric_prefix):
            class_id = int(column.removeprefix(metric_prefix))
            class_name = DEEPLAB_CLASS_NAMES.get(class_id)
            if class_name is None:
                raise ValueError(f"Unknown DeepLabv3+ class ID {class_id} in '{column}'.")
            return f"{metric_label} — {class_name}"
    if model_name == YOLO11N and column.startswith("lr/pg"):
        return f"Learning rate (parameter group {column.removeprefix('lr/pg')})"
    if column == "learning_rate":
        return "Learning rate"
    if column == "epoch_time_sec":
        return "Epoch time (seconds)"
    if column == "time":
        return "Elapsed training time (seconds)"
    return column.replace("_", " ").replace("/", " ").strip().title()


def _metric_goal(column: str) -> str:
    if "loss" in column:
        return "minimize"
    if any(token in column.lower() for token in ("precision", "recall", "map", "f1", "dice", "iou")):
        return "maximize"
    return "final"


def _read_training_summary(model_name: str, path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(f"{model_name} training summary not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as summary_file:
        reader = csv.DictReader(summary_file)
        if not reader.fieldnames or "epoch" not in reader.fieldnames:
            raise ValueError(f"{model_name} training summary must contain an 'epoch' column.")

        metric_columns = [
            column
            for column in reader.fieldnames
            if column != "epoch"
        ]
        rows = []
        previous_epoch = 0
        for row_number, row in enumerate(reader, start=2):
            try:
                epoch = int(row["epoch"])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"{model_name} training summary has an invalid epoch on row {row_number}.") from exc
            if epoch <= previous_epoch:
                raise ValueError(f"{model_name} training summary epochs must be strictly increasing.")
            previous_epoch = epoch

            values = {}
            for column in metric_columns:
                try:
                    value = float(row[column])
                except (TypeError, ValueError) as exc:
                    raise ValueError(
                        f"{model_name} training summary has an invalid '{column}' value on row {row_number}."
                    ) from exc
                if not math.isfinite(value):
                    raise ValueError(
                        f"{model_name} training summary has a non-finite '{column}' value on row {row_number}."
                    )
                values[column] = value
            rows.append({"epoch": epoch, **values})

    if not rows:
        raise ValueError(f"{model_name} training summary contains no epoch records.")

    metrics = []
    for column in metric_columns:
        goal = _metric_goal(column)
        best_row = (
            (min if goal == "minimize" else max)(rows, key=lambda item: item[column])
            if goal in {"minimize", "maximize"}
            else rows[-1]
        )
        metrics.append(
            {
                "id": column,
                "label": _metric_label(model_name, column),
                "goal": goal,
                "best_epoch": best_row["epoch"],
                "points": [{"epoch": row["epoch"], "value": row[column]} for row in rows],
            }
        )

    return {"epochs": [row["epoch"] for row in rows], "metrics": metrics}


@app.on_event("startup")
def startup_event() -> None:
    load_model()


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Dental Caries Detection API",
        "model_configured": bool(STATE.models),
        "models": {
            name: {
                "configured": name in STATE.models,
                "path": str(STATE.paths[name]) if name in STATE.paths else None,
                "error": STATE.errors.get(name),
            }
            for name in (YOLO11N, DEEPLABV3_PLUS)
        },
        "default_confidence": STATE.conf,
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: str = Form(default=YOLO11N),
    conf: float | None = Query(default=None, ge=0.01, le=1.0),
):
    if model not in (YOLO11N, DEEPLABV3_PLUS):
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported model '{model}'. Choose {YOLO11N} or {DEEPLABV3_PLUS}.",
        )
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload JPEG, PNG, or WEBP.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB.")

    try:
        result = run_predict(contents, model_name=model, conf=conf)
    except ModelNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    return JSONResponse(content=result)


@app.get("/metrics")
async def metrics():
    if not RESULTS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="No evaluation artifact found. Run training/evaluate.py after training a checkpoint.",
        )
    with RESULTS_PATH.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return JSONResponse(content=data)


@app.get("/training-metrics")
async def training_metrics():
    try:
        summaries = {
            model_name: _read_training_summary(model_name, path)
            for model_name, path in TRAINING_SUMMARIES.items()
        }
    except (OSError, csv.Error, ValueError) as exc:
        raise HTTPException(status_code=500, detail=f"Could not read training summaries: {exc}") from exc
    return JSONResponse(content=summaries)
