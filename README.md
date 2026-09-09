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
- The scientifically defensible baseline in this repo is YOLO-style object detection for abnormal tooth bounding boxes.
- Segmentation is not treated as a production task unless a real pixel-level dataset is added later.
- If no checkpoint is configured, the backend returns an explicit error instead of a fake diagnosis.

## Training And Evaluation
- Read [training/README.md](training/README.md) for download, preparation, training, and evaluation commands.
- The prepared dataset and run outputs should live outside the Git checkout or in ignored directories.

## Run The App
1. Start the backend with `MODEL_PATH` pointing to a trained checkpoint.
2. Start the frontend with Vite.
3. Open `http://127.0.0.1:5173`.

## Limitations
- This is a research and educational prototype, not a clinical diagnostic device.
- Results are only meaningful after training on the official DENTEX data and evaluating the checkpoint on a held-out split.

