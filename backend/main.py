"""
main.py — FastAPI backend for Dental Caries Detection demo.
"""

import json
import os
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model import load_model, predict as run_predict

# ---------------------------------------------------------------------------
app = FastAPI(title="Dental Caries Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
load_model("unet_checkpoint.pth")

# ---------------------------------------------------------------------------
RESULTS_PATH = Path(__file__).parent / "results.json"

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB   = 10


@app.get("/")
async def root():
    return {"status": "ok", "service": "Dental Caries Detection API"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload JPEG or PNG."
        )

    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB."
        )

    try:
        result = run_predict(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    return JSONResponse(content=result)


@app.get("/metrics")
async def metrics():
    if not RESULTS_PATH.exists():
        raise HTTPException(status_code=404, detail="results.json not found.")
    with open(RESULTS_PATH, "r") as f:
        data = json.load(f)
    return JSONResponse(content=data)
