# Dental Caries Detection

## Project Summary

This project provides a web application for analyzing dental radiographs. The user uploads an image and chooses one of the two implemented models:

- **YOLO11n** — object detection using the Ultralytics checkpoint at `models/YOLO11n_best_checkpoint.pt`.
- **DeepLabv3+** — semantic segmentation using `models/DeepLabV3+_best_checkpoint.pt.pth`.

The frontend displays model output, an interactive confidence graph, individual training metric graphs for YOLO11n and DeepLabv3+, and a combined metric comparison chart. The backend is a FastAPI service, and the frontend is built with React and Vite.

## Trained Classes

Both checkpoints use the class order **Impacted**, **Caries**, **Periapical Lesion**, **Deep Caries**. DeepLabv3+ uses channel 0 for background and channels 1–4 for those classes, as confirmed by the notebook's mask-generation code.

## Inference

`POST /predict` accepts an image and a `model` form field (`YOLO11n` or `DeepLabv3+`). YOLO11n returns bounding-box detections and confidence values. DeepLabv3+ returns a transparent semantic segmentation overlay encoded as base64, without bounding-box detections. Both responses include inference time, image dimensions, and checkpoint path.

Model checkpoint locations can be overridden independently with `YOLO_MODEL_PATH` and `DEEPLAB_MODEL_PATH`. For example, set `$env:YOLO_MODEL_PATH = "C:\models\my-yolo-checkpoint.pt"` and `$env:DEEPLAB_MODEL_PATH = "C:\models\my-deeplab-checkpoint.pth"` in PowerShell before starting the backend. The backend reports a clear error if a requested checkpoint is missing or cannot be loaded; it does not generate substitute predictions.

## Training and Evaluation

The `training/` directory contains the DENTEX data preparation, YOLO11n training, and evaluation scripts, along with the DeepLabv3+ training notebook. The graph page reads every logged metric from `docs/YOLO11n_training_summary.csv` and `docs/DeepLabV3+_training_summary.csv` through `/training-metrics`. It displays an individual graph per metric and lets users combine metrics from either or both models. Epochs are model-specific; each selected series marks its best epoch for losses and score metrics, or its final epoch for other values.

See [the training guide](../training/README.md) for setup and commands.

## Limitations

This is a research and educational prototype, not a clinical diagnostic device. Model outputs require validation against suitable held-out data and review by qualified dental professionals before any clinical use.
