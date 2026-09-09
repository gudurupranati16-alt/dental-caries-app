from __future__ import annotations

import argparse
import json
import os
import random
from datetime import datetime
from pathlib import Path

import numpy as np


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        torch.use_deterministic_algorithms(False)
    except Exception:
        pass


def resolve_device(requested: str | None) -> str:
    if requested:
        return requested
    try:
        import torch

        return "0" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def main() -> int:
    parser = argparse.ArgumentParser(description="Train a YOLO baseline on prepared DENTEX data.")
    parser.add_argument("--data", required=True, type=Path, help="Path to data.yaml")
    parser.add_argument("--model", default="yolov8n.pt", help="Pretrained YOLO checkpoint to fine-tune")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--device", default=None, help="CUDA device id or cpu")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--project", type=Path, default=Path("training/runs"))
    parser.add_argument("--name", default=None)
    parser.add_argument("--patience", type=int, default=20)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    set_seed(args.seed)
    device = resolve_device(args.device)
    run_name = args.name or datetime.now().strftime("dentex-yolo-%Y%m%d-%H%M%S")
    project = args.project.expanduser().resolve()
    project.mkdir(parents=True, exist_ok=True)

    from ultralytics import YOLO

    model = YOLO(args.model)
    train_result = model.train(
        data=str(args.data.resolve()),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        seed=args.seed,
        deterministic=True,
        project=str(project),
        name=run_name,
        patience=args.patience,
        resume=args.resume,
        pretrained=True,
        workers=0,
        verbose=True,
    )

    save_dir = Path(getattr(train_result, "save_dir", project / run_name))
    best_pt = save_dir / "weights" / "best.pt"
    last_pt = save_dir / "weights" / "last.pt"
    config = {
        "data": str(args.data.resolve()),
        "model": args.model,
        "epochs": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "device": device,
        "seed": args.seed,
        "save_dir": str(save_dir),
        "best_checkpoint": str(best_pt) if best_pt.exists() else None,
        "last_checkpoint": str(last_pt) if last_pt.exists() else None,
    }
    (save_dir / "train_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    results_csv = save_dir / "results.csv"
    if results_csv.exists():
        config["results_csv"] = str(results_csv)
        (save_dir / "train_summary.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    print(json.dumps(config, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

