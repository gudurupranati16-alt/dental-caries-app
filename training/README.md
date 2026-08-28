# Training Guide

This repo uses the official DENTEX Challenge 2023 dataset from Zenodo:

- Zenodo record: https://zenodo.org/records/7812323
- Challenge repo: https://github.com/ibrahimethemhamamci/DENTEX

## 1. Download
- Download the dataset archives from Zenodo.
- Extract them outside this repository, for example `C:/datasets/DENTEX`.
- Do not commit the dataset into Git.

## 2. Inspect
```powershell
python training/inspect_dentex.py C:\datasets\DENTEX --report-json training\artifacts\dentex-inspection.json
```

## 3. Prepare
- The selected baseline is YOLO object detection because DENTEX provides bounding-box supervision for abnormal teeth.
- If the dataset extract is COCO-like, convert it to YOLO format:

```powershell
python training/prepare_dentex.py C:\datasets\DENTEX C:\datasets\DENTEX_yolo --report training\artifacts\dentex-prepare.json
```

- This creates `images/`, `labels/`, and `data.yaml` in the output folder.

## 4. Install Dependencies
```powershell
python -m pip install -r training/requirements.txt
```

## 5. Train
```powershell
python training/train_yolo.py --data C:\datasets\DENTEX_yolo\data.yaml --model yolov8n.pt --epochs 50 --imgsz 640 --batch 8
```

The best checkpoint is written inside `training/runs/.../weights/best.pt`.

## 6. Evaluate
```powershell
python training/evaluate.py --data C:\datasets\DENTEX_yolo\data.yaml --model training\runs\...\weights\best.pt
```

This writes a real evaluation JSON next to the run directory.

## 7. Backend Configuration
- Set the checkpoint path before starting the API:

```powershell
$env:MODEL_PATH = "C:\datasets\DENTEX_yolo\training\runs\...\weights\best.pt"
python -m uvicorn backend.main:app --reload
```

- If `MODEL_PATH` is missing, `/predict` returns a clear error instead of a fake diagnosis.

## 8. Run The App
- Backend:
```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Frontend:
```powershell
cd frontend
npm install
npm run dev
```

## 9. Reproducibility Notes
- The scripts are designed for local CUDA machines, Kaggle, and Colab.
- Use the same extracted dataset and checkpoint path when repeating an experiment.
- Training and evaluation outputs stay in ignored `training/runs/` and `training/artifacts/` directories.

