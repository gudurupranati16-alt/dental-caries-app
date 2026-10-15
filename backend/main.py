from __future__ import annotations

import json
import os
from pathlib import Path

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse

from model import ModelNotConfiguredError, STATE, load_model, predict as run_predict

app = FastAPI(title="Dental Caries Detection API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_PATH = Path(os.getenv("EVAL_PATH", Path(__file__).with_name("results.json")))
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


@app.on_event("startup")
def startup_event() -> None:
    load_model()


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Dental Caries Detection API",
        "model_configured": bool(STATE.model is not None),
        "model_path": str(STATE.model_path) if STATE.model_path else None,
        "default_confidence": STATE.conf,
        "error": STATE.error,
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf: float | None = Query(default=None, ge=0.01, le=1.0),
    caries_only: bool | None = Query(default=None),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload JPEG, PNG, or WEBP.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB.")

    try:
        result = run_predict(contents, conf=conf, caries_only=caries_only)
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

