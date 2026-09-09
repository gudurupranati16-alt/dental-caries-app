from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model import ModelNotConfiguredError, load_model, predict as run_predict

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
        "model_configured": bool(os.getenv("MODEL_PATH")),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload JPEG, PNG, or WEBP.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB.")

    try:
        result = run_predict(contents)
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

