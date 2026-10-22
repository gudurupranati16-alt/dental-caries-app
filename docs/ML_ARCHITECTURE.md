# ML Architecture

The application exposes two independently loaded models through the same upload interface:

- **YOLO11n** performs object detection using the Ultralytics `.pt` checkpoint.
- **DeepLabv3+** performs semantic segmentation using the five-class PyTorch state dict.

## Trained class mapping

YOLO11n class IDs are 0: Impacted, 1: Caries, 2: Periapical Lesion, and 3: Deep Caries. DeepLabv3+ reserves channel 0 for background and maps channels 1–4 to the same classes in that order. The DeepLab mapping is confirmed by the training notebook's disease-category order and mask-generation code.

## Checkpoint locations

By default the backend loads:

- `models/YOLO11n_best_checkpoint.pt` for YOLO11n
- `models/DeepLabV3+_best_checkpoint.pt.pth` for DeepLabv3+

Both default paths are relative to the repository root. To assign custom paths, set `YOLO_MODEL_PATH` for YOLO11n and/or `DEEPLAB_MODEL_PATH` for DeepLabv3+ before starting the backend. For example, in PowerShell:

```powershell
$env:YOLO_MODEL_PATH = "C:\models\my-yolo-checkpoint.pt"
$env:DEEPLAB_MODEL_PATH = "C:\models\my-deeplab-checkpoint.pth"
python -m uvicorn backend.main:app --reload
```

Each variable is optional and can be used independently. `MODEL_DEVICE`, `MODEL_CONFIDENCE`, and `MODEL_IMGSZ` configure device, confidence cutoff, and inference input size.

## Inference contract

`POST /predict` accepts an image file and a `model` form field whose value is `YOLO11n` or `DeepLabv3+`. YOLO11n returns bounding-box detections and confidence values. DeepLabv3+ is segmentation-only and returns a transparent PNG segmentation overlay encoded as base64, with no detection boxes or detection list. Both responses include inference time, original image dimensions, and the selected checkpoint path.

The backend does not generate simulated diagnoses. If the selected checkpoint cannot be loaded, `/predict` returns an explicit service error.

## Training graphs

`GET /training-metrics` reads the epoch summaries from `docs/YOLO11n_training_summary.csv` and `docs/DeepLabV3+_training_summary.csv`. Every recorded numeric column except `epoch` is exposed as a selectable series. The frontend plots each metric separately and also provides two model-specific multi-select menus for combined graphs. Best score/loss epochs and final epochs for other series are marked on the charts.
