# Dental Caries App

This repository contains a small web application plus training code for the DENTEX Challenge 2023 dataset.

## What This Project Does
- The frontend provides an interactive upload-and-review experience.
- The backend serves model inference.
- The `training/` folder contains scripts for inspecting, preparing, training, and evaluating a real detection baseline.

## Dataset
- DENTEX is an external dataset and is not included in this repository.
- Official record: https://zenodo.org/records/7812323
- Challenge repo: https://github.com/ibrahimethemhamamci/DENTEX
- DENTEX is released under CC BY-NC-SA 4.0. Please follow the attribution and license terms from the source.

## Current ML Scope
- The app supports two selectable inference models: YOLO11n object detection and DeepLabv3+ semantic segmentation.
- By default, YOLO11n loads `models/YOLO11n_best_checkpoint.pt` and DeepLabv3+ loads `models/DeepLabV3+_best_checkpoint.pt.pth`. Both paths are relative to the repository root.
- Model checkpoint files are excluded from Git; place the files in `models/` using these names, or assign custom paths with the environment variables below.
- YOLO11n class IDs map to 0: Impacted, 1: Caries, 2: Periapical Lesion, and 3: Deep Caries. DeepLabv3+ reserves output channel 0 for background and maps channels 1–4 to those classes in the same order.
- To use different checkpoint files, set `YOLO_MODEL_PATH` and/or `DEEPLAB_MODEL_PATH` before starting the backend. For example, in PowerShell:

  ```powershell
  $env:YOLO_MODEL_PATH = "C:\models\my-yolo-checkpoint.pt"
  $env:DEEPLAB_MODEL_PATH = "C:\models\my-deeplab-checkpoint.pth"
  python -m uvicorn backend.main:app --reload
  ```

  These variables are independent; set only the one you want to override. The backend reports an explicit error if a selected checkpoint cannot be loaded.

## Training And Evaluation
- Read [training/README.md](training/README.md) for download, preparation, training, and evaluation commands.
- The graphs read YOLO11n metrics from `docs/YOLO11n_training_summary.csv` and DeepLabv3+ metrics from `docs/DeepLabV3+_training_summary.csv`. Keep these files available to the backend; all logged columns other than the epoch are graphed, with individual graphs and cross-model metric selection in the frontend.
- The prepared dataset and run outputs should live outside the Git checkout or in ignored directories.

## Run The App
1. Start the backend; it loads the default YOLO11n and DeepLabv3+ checkpoints. Set the corresponding model-path environment variable to override either checkpoint.
2. Start the frontend with Vite.
3. Open `http://127.0.0.1:5173`.

## Limitations
- This is a research and educational prototype, not a clinical diagnostic device.
- Results are only meaningful after training on the official DENTEX data and evaluating the checkpoint on a held-out split.
