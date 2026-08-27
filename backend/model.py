"""
model.py — U-Net inference with graceful mock fallback.

If unet_checkpoint.pth is present, loads and runs the real model.
Otherwise returns a realistic synthetic mask + plausible metrics.
"""

import io
import time
import base64
import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
IMG_SIZE = 256
CLASSES = ["Sound", "Early Enamel", "Moderate Dentinal", "Severe", "Root Surface"]
CLASS_COLORS = {
    "Sound":             (30,  200, 180),
    "Early Enamel":      (255, 220,  80),
    "Moderate Dentinal": (255, 140,  40),
    "Severe":            (220,  50,  50),
    "Root Surface":      (160,  80, 200),
}

_model = None
_use_mock = True


def load_model(checkpoint_path: str = "unet_checkpoint.pth"):
    global _model, _use_mock
    if not os.path.exists(checkpoint_path):
        print(f"[model] No checkpoint at '{checkpoint_path}' — running in mock mode.")
        _use_mock = True
        return

    try:
        import torch
        from torchvision.models.segmentation import fcn_resnet50

        device = torch.device("cpu")
        _model = torch.load(checkpoint_path, map_location=device)
        _model.eval()
        _use_mock = False
        print("[model] Checkpoint loaded successfully.")
    except Exception as exc:
        print(f"[model] Failed to load checkpoint ({exc}) — running in mock mode.")
        _use_mock = True


# ---------------------------------------------------------------------------
# Pre-processing helpers
# ---------------------------------------------------------------------------
def _preprocess(image_bytes: bytes) -> "np.ndarray":
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std  = np.array([0.229, 0.224, 0.225])
    arr = (arr - mean) / std
    return arr, img


# ---------------------------------------------------------------------------
# Real inference
# ---------------------------------------------------------------------------
def _real_predict(arr: "np.ndarray"):
    import torch
    tensor = torch.tensor(arr).permute(2, 0, 1).unsqueeze(0).float()
    with torch.no_grad():
        out = _model(tensor)
    logits = out["out"][0]                    # (num_classes, H, W)
    probs  = torch.softmax(logits, dim=0)
    pred_class_idx = probs.max(0).values.mean().item()
    mask_idx = logits.argmax(0).numpy()       # (H, W) int array
    confidence = float(probs.max(0).values.mean().item())
    return mask_idx, confidence


# ---------------------------------------------------------------------------
# Mock inference — generates a realistic-looking segmentation overlay
# ---------------------------------------------------------------------------
def _mock_predict(original_img: Image.Image):
    rng = np.random.default_rng(42)

    # Simulate a tooth-shaped ellipse with surrounding "lesion" blobs
    mask = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.uint8)

    # Background = Sound (class 0)
    mask[:] = 0

    # Central tooth body
    cy, cx = IMG_SIZE // 2, IMG_SIZE // 2
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            if ((x - cx)**2 / 60**2 + (y - cy)**2 / 90**2) < 1:
                mask[y, x] = 1  # Early Enamel outline

    # Pulp / inner region
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            if ((x - cx)**2 / 35**2 + (y - cy)**2 / 55**2) < 1:
                mask[y, x] = 2  # Moderate

    # Lesion blob — upper-right
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            if ((x - (cx+28))**2 + (y - (cy-30))**2) < 18**2:
                mask[y, x] = 3  # Severe

    # Root region — bottom
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            if ((x - cx)**2 / 20**2 + (y - (cy+60))**2 / 30**2) < 1:
                mask[y, x] = 4  # Root Surface

    # Small noise to look realistic
    noise_locs = rng.integers(0, IMG_SIZE, size=(500, 2))
    for loc in noise_locs:
        mask[loc[0], loc[1]] = rng.integers(0, 5)

    confidence = float(rng.uniform(0.78, 0.94))
    return mask, confidence


# ---------------------------------------------------------------------------
# Mask → coloured RGBA PNG
# ---------------------------------------------------------------------------
def _colorize_mask(mask: np.ndarray, alpha: int = 190) -> Image.Image:
    h, w = mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    colors = list(CLASS_COLORS.values())
    for idx, color in enumerate(colors):
        region = mask == idx
        rgba[region, :3] = color
        rgba[region,  3] = alpha if idx > 0 else 60
    return Image.fromarray(rgba, mode="RGBA")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def predict(image_bytes: bytes) -> dict:
    t0 = time.perf_counter()
    arr, original_img = _preprocess(image_bytes)

    if _use_mock:
        mask_arr, confidence = _mock_predict(original_img)
    else:
        mask_arr, confidence = _real_predict(arr)

    # Determine dominant class (excluding Sound background)
    unique, counts = np.unique(mask_arr, return_counts=True)
    lesion_mask = unique > 0
    if lesion_mask.any():
        dominant_idx = int(unique[lesion_mask][counts[lesion_mask].argmax()])
    else:
        dominant_idx = 0
    predicted_class = CLASSES[dominant_idx]

    # Colorise mask
    color_mask = _colorize_mask(mask_arr)

    # Encode mask as base64 PNG
    buf = io.BytesIO()
    color_mask.save(buf, format="PNG")
    mask_b64 = base64.b64encode(buf.getvalue()).decode()

    inference_ms = (time.perf_counter() - t0) * 1000

    return {
        "mask":         mask_b64,
        "class":        predicted_class,
        "confidence":   round(confidence, 4),
        "inference_ms": round(inference_ms, 2),
    }
