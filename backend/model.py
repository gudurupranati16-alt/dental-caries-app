from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.nn import functional as F

YOLO11N = "YOLO11n"
DEEPLABV3_PLUS = "DeepLabv3+"
MODEL_PATH_ENV = "YOLO_MODEL_PATH"
DEEPLAB_PATH_ENV = "DEEPLAB_MODEL_PATH"
DEVICE_ENV = "MODEL_DEVICE"
CONF_ENV = "MODEL_CONFIDENCE"
IMGSZ_ENV = "MODEL_IMGSZ"
CLASS_NAMES = (
    "Impacted",
    "Caries",
    "Periapical Lesion",
    "Deep Caries",
)
MASK_COLORS = (
    (45, 212, 191, 145),
    (56, 189, 248, 145),
    (245, 158, 11, 145),
    (239, 68, 68, 145),
)


class ModelNotConfiguredError(RuntimeError):
    pass


@dataclass
class ModelState:
    models: dict[str, Any] = field(default_factory=dict)
    paths: dict[str, Path] = field(default_factory=dict)
    errors: dict[str, str] = field(default_factory=dict)
    device: str = "cpu"
    imgsz: int = 640
    conf: float = 0.25


STATE = ModelState()


class ConvNormReLU(nn.Sequential):
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        *,
        padding: int = 0,
        dilation: int = 1,
    ) -> None:
        super().__init__(
            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size,
                padding=padding,
                dilation=dilation,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )


class NamedConvNormReLU(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int, padding: int) -> None:
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride=2, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)

    def forward(self, value: torch.Tensor) -> torch.Tensor:
        return F.relu(self.bn(self.conv(value)), inplace=True)


class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.shortcut = (
            nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels),
            )
            if stride != 1 or in_channels != out_channels
            else None
        )

    def forward(self, value: torch.Tensor) -> torch.Tensor:
        residual = value if self.shortcut is None else self.shortcut(value)
        value = F.relu(self.bn1(self.conv1(value)), inplace=True)
        value = self.bn2(self.conv2(value))
        return F.relu(value + residual, inplace=True)


class ResidualStage(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int) -> None:
        super().__init__()
        self.blocks = nn.Sequential(
            ResidualBlock(in_channels, out_channels, stride),
            ResidualBlock(out_channels, out_channels),
        )

    def forward(self, value: torch.Tensor) -> torch.Tensor:
        return self.blocks(value)


class AtrousSpatialPyramidPooling(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.branch1 = nn.Module()
        self.branch1.branch = ConvNormReLU(512, 256, 1)
        self.branch6 = nn.Module()
        self.branch6.branch = ConvNormReLU(512, 256, 3, padding=6, dilation=6)
        self.branch12 = nn.Module()
        self.branch12.branch = ConvNormReLU(512, 256, 3, padding=12, dilation=12)
        self.branch18 = nn.Module()
        self.branch18.branch = ConvNormReLU(512, 256, 3, padding=18, dilation=18)
        self.global_branch = nn.Module()
        self.global_branch.project = ConvNormReLU(512, 256, 1)
        self.project = ConvNormReLU(1280, 256, 1)

    def forward(self, value: torch.Tensor) -> torch.Tensor:
        size = value.shape[-2:]
        pooled = F.adaptive_avg_pool2d(value, 1)
        pooled = F.interpolate(
            self.global_branch.project(pooled), size=size, mode="bilinear", align_corners=False
        )
        branches = (
            self.branch1.branch(value),
            self.branch6.branch(value),
            self.branch12.branch(value),
            self.branch18.branch(value),
            pooled,
        )
        return self.project(torch.cat(branches, dim=1))


class DeepLabV3Plus(nn.Module):
    def __init__(self, num_classes: int = 5) -> None:
        super().__init__()
        self.stem = nn.Module()
        self.stem.initial_conv = NamedConvNormReLU(3, 64, 7, padding=3)
        self.stage1 = ResidualStage(64, 64, 1)
        self.stage2 = ResidualStage(64, 128, 2)
        self.stage3 = ResidualStage(128, 256, 2)
        self.stage4 = nn.Module()
        self.stage4.block1 = ResidualBlock(256, 512, 2)
        self.stage4.block2 = ResidualBlock(512, 512)
        self.aspp = AtrousSpatialPyramidPooling()
        self.low_level_projection = nn.Module()
        self.low_level_projection.projection = ConvNormReLU(64, 48, 1)
        self.decoder_fusion = nn.Module()
        self.decoder_fusion.fusion = ConvNormReLU(304, 256, 3, padding=1)
        self.segmentation_head = nn.Module()
        self.segmentation_head.classifier = nn.Conv2d(256, num_classes, 1)
        self.pool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

    def forward(self, value: torch.Tensor) -> torch.Tensor:
        input_size = value.shape[-2:]
        value = self.pool(self.stem.initial_conv(value))
        low_level = self.stage1(value)
        value = self.stage2(low_level)
        value = self.stage3(value)
        value = self.stage4.block1(value)
        value = self.stage4.block2(value)
        value = self.aspp(value)
        value = F.interpolate(value, size=low_level.shape[-2:], mode="bilinear", align_corners=False)
        value = torch.cat((value, self.low_level_projection.projection(low_level)), dim=1)
        value = self.decoder_fusion.fusion(value)
        value = self.segmentation_head.classifier(value)
        return F.interpolate(value, size=input_size, mode="bilinear", align_corners=False)


def _default_paths() -> dict[str, Path]:
    app_root = Path(__file__).resolve().parent.parent
    return {
        YOLO11N: Path(
            os.getenv(MODEL_PATH_ENV, app_root / "models" / "YOLO11n_best_checkpoint.pt")
        ).expanduser().resolve(),
        DEEPLABV3_PLUS: Path(
            os.getenv(
                DEEPLAB_PATH_ENV,
                app_root / "models" / "DeepLabV3+_best_checkpoint.pt.pth",
            )
        ).expanduser().resolve(),
    }


def load_model(device: str | None = None) -> ModelState:
    STATE.device = device or os.getenv(DEVICE_ENV) or ("cuda:0" if torch.cuda.is_available() else "cpu")
    STATE.imgsz = int(os.getenv(IMGSZ_ENV, "640"))
    STATE.conf = float(os.getenv(CONF_ENV, "0.25"))
    STATE.models.clear()
    STATE.paths.clear()
    STATE.errors.clear()

    paths = _default_paths()
    for model_name, model_path in paths.items():
        if not model_path.is_file():
            STATE.errors[model_name] = f"{model_name} checkpoint not found: {model_path}"
            continue

        try:
            if model_name == YOLO11N:
                from ultralytics import YOLO

                model = YOLO(str(model_path))
            else:
                model = DeepLabV3Plus()
                state_dict = torch.load(model_path, map_location="cpu", weights_only=True)
                if isinstance(state_dict, dict):
                    state_dict = state_dict.get("state_dict", state_dict.get("model_state_dict", state_dict))
                if not isinstance(state_dict, dict):
                    raise ValueError("Checkpoint does not contain a model state dictionary.")
                model.load_state_dict(state_dict, strict=True)
                torch_device = f"cuda:{STATE.device}" if STATE.device.isdigit() else STATE.device
                model.to(torch_device).eval()

            STATE.models[model_name] = model
            STATE.paths[model_name] = model_path
        except Exception as exc:
            STATE.errors[model_name] = f"Could not load {model_name} checkpoint '{model_path}': {exc}"
    return STATE


def _load_image(image_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def _predict_yolo(
    model: Any,
    image: Image.Image,
    threshold: float,
) -> list[dict[str, Any]]:
    results = model.predict(
        source=image,
        imgsz=STATE.imgsz,
        conf=threshold,
        device=STATE.device.split(":")[-1] if STATE.device.startswith("cuda") else STATE.device,
        verbose=False,
    )
    result = results[0]
    class_names = getattr(model, "names", {}) or {}
    boxes = getattr(result, "boxes", None)
    if boxes is None:
        return []

    detections = []
    for bbox, confidence, class_id in zip(
        boxes.xyxy.cpu().tolist(),
        boxes.conf.cpu().tolist(),
        boxes.cls.cpu().tolist(),
    ):
        class_id = int(class_id)
        if isinstance(class_names, dict):
            label = str(class_names.get(class_id, class_id))
        elif isinstance(class_names, (list, tuple)) and 0 <= class_id < len(class_names):
            label = str(class_names[class_id])
        else:
            label = str(class_id)
        detections.append(
            {
                "class_id": class_id,
                "class_name": label,
                "confidence": round(float(confidence), 4),
                "bbox": [round(float(value), 2) for value in bbox],
            }
        )
    return detections


def _predict_deeplab(
    model: DeepLabV3Plus,
    image: Image.Image,
    threshold: float,
) -> str:
    original_width, original_height = image.size
    resized = image.resize((STATE.imgsz, STATE.imgsz), Image.Resampling.BILINEAR)
    image_array = np.asarray(resized, dtype=np.float32) / 255.0
    image_array = (image_array - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array(
        [0.229, 0.224, 0.225], dtype=np.float32
    )
    torch_device = f"cuda:{STATE.device}" if STATE.device.isdigit() else STATE.device
    tensor = torch.from_numpy(image_array.transpose(2, 0, 1)).unsqueeze(0).to(torch_device)

    with torch.inference_mode():
        probabilities = torch.softmax(model(tensor), dim=1)[0]
        probabilities = F.interpolate(
            probabilities.unsqueeze(0),
            size=(original_height, original_width),
            mode="bilinear",
            align_corners=False,
        )[0]
        confidence_map, class_map = probabilities.max(dim=0)

    class_array = class_map.cpu().numpy()
    confidence_array = confidence_map.cpu().numpy()

    mask_pixels = np.zeros((original_height, original_width, 4), dtype=np.uint8)
    for class_id, color in enumerate(MASK_COLORS, start=1):
        selected = (class_array == class_id) & (confidence_array >= threshold)
        mask_pixels[selected] = color
    overlay = Image.fromarray(mask_pixels)
    buffer = io.BytesIO()
    overlay.save(buffer, format="PNG")
    encoded_mask = base64.b64encode(buffer.getvalue()).decode("ascii")
    return encoded_mask


def predict(
    image_bytes: bytes,
    model_name: str = YOLO11N,
    conf: float | None = None,
) -> dict[str, Any]:
    if model_name not in (YOLO11N, DEEPLABV3_PLUS):
        raise ValueError(f"Unsupported model '{model_name}'. Choose {YOLO11N} or {DEEPLABV3_PLUS}.")
    model = STATE.models.get(model_name)
    if model is None:
        message = STATE.errors.get(model_name, f"{model_name} model is not configured.")
        raise ModelNotConfiguredError(message)

    effective_conf = float(conf) if conf is not None else STATE.conf
    image = _load_image(image_bytes)
    width, height = image.size
    started = time.perf_counter()
    if model_name == YOLO11N:
        detections = _predict_yolo(model, image, effective_conf)
    else:
        segmentation_mask = _predict_deeplab(model, image, effective_conf)

    elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)
    response = {
        "model": model_name,
        "conf_threshold": round(effective_conf, 4),
        "inference_ms": elapsed_ms,
        "image": {"width": width, "height": height},
        "model_path": str(STATE.paths[model_name]),
    }
    if model_name == YOLO11N:
        response["detections"] = detections
        response["top_class"] = detections[0]["class_name"] if detections else None
        response["confidence"] = round(
            max((detection["confidence"] for detection in detections), default=0.0), 4
        )
    else:
        response["segmentation_mask"] = segmentation_mask
    return response
