from __future__ import annotations

import io
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

MODEL_ENV = "MODEL_PATH"
DEVICE_ENV = "MODEL_DEVICE"
CONF_ENV = "MODEL_CONFIDENCE"
IMGSZ_ENV = "MODEL_IMGSZ"


class ModelNotConfiguredError(RuntimeError):
    pass


@dataclass
class ModelState:
    model: Any | None = None
    model_path: Path | None = None
    error: str | None = None
    device: str | None = None
    imgsz: int = 640
    conf: float = 0.25


STATE = ModelState()


def _resolve_model_path(model_path: str | os.PathLike[str] | None = None) -> Path | None:
    raw = str(model_path or os.getenv(MODEL_ENV, "")).strip()
    if not raw:
        return None
    return Path(raw).expanduser().resolve()


def load_model(model_path: str | os.PathLike[str] | None = None, device: str | None = None) -> ModelState:
    resolved_path = _resolve_model_path(model_path)
    STATE.device = device or os.getenv(DEVICE_ENV) or None
    STATE.imgsz = int(os.getenv(IMGSZ_ENV, "640"))
    STATE.conf = float(os.getenv(CONF_ENV, "0.25"))

    if resolved_path is None:
        STATE.model = None
        STATE.model_path = None
        STATE.error = f"Model checkpoint not installed. Please configure {MODEL_ENV}."
        return STATE

    if not resolved_path.exists():
        STATE.model = None
        STATE.model_path = resolved_path
        STATE.error = f"Model checkpoint not found at {resolved_path}. Please configure {MODEL_ENV}."
        return STATE

    try:
        from ultralytics import YOLO

        STATE.model = YOLO(str(resolved_path))
        STATE.model_path = resolved_path
        STATE.error = None
        return STATE
    except Exception as exc:
        STATE.model = None
        STATE.model_path = resolved_path
        STATE.error = f"Failed to load model checkpoint at {resolved_path}: {exc}"
        return STATE


def require_model() -> Any:
    if STATE.model is None:
        if STATE.error:
            raise ModelNotConfiguredError(STATE.error)
        raise ModelNotConfiguredError(f"Model checkpoint not installed. Please configure {MODEL_ENV}.")
    return STATE.model


def _load_image(image_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def predict(image_bytes: bytes) -> dict[str, Any]:
    model = require_model()
    image = _load_image(image_bytes)
    width, height = image.size
    t0 = time.perf_counter()

    results = model.predict(
        source=image,
        imgsz=STATE.imgsz,
        conf=STATE.conf,
        device=STATE.device,
        verbose=False,
    )
    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    result = results[0]

    detections = []
    class_names = getattr(model, "names", {}) or {}

    def class_label(class_id: int) -> str:
        if isinstance(class_names, dict):
            return str(class_names.get(class_id, class_id))
        if isinstance(class_names, (list, tuple)) and 0 <= class_id < len(class_names):
            return str(class_names[class_id])
        return str(class_id)

    boxes = getattr(result, "boxes", None)
    if boxes is not None:
        xyxy = boxes.xyxy.cpu().tolist()
        confs = boxes.conf.cpu().tolist()
        class_ids = boxes.cls.cpu().tolist()
        for bbox, conf, class_id in zip(xyxy, confs, class_ids):
            class_id_int = int(class_id)
            detections.append(
                {
                    "class_id": class_id_int,
                    "class_name": class_label(class_id_int),
                    "confidence": round(float(conf), 4),
                    "bbox": [round(float(v), 2) for v in bbox],
                }
            )

    top_confidence = max((det["confidence"] for det in detections), default=0.0)
    top_class = detections[0]["class_name"] if detections else None

    return {
        "detections": detections,
        "top_class": top_class,
        "confidence": round(float(top_confidence), 4),
        "inference_ms": elapsed_ms,
        "image": {"width": width, "height": height},
        "model_path": str(STATE.model_path) if STATE.model_path else None,
    }
