from __future__ import annotations

import argparse
import json
from pathlib import Path


def as_float(value):
    try:
        return float(value)
    except Exception:
        return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate a trained YOLO checkpoint on DENTEX.")
    parser.add_argument("--data", required=True, type=Path, help="Path to data.yaml")
    parser.add_argument("--model", required=True, type=Path, help="Path to best.pt")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default=None)
    parser.add_argument("--split", default="val")
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.7)
    parser.add_argument("--project", type=Path, default=Path("training/runs"))
    parser.add_argument("--name", default=None)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    from ultralytics import YOLO

    model = YOLO(str(args.model))
    metrics = model.val(
        data=str(args.data.resolve()),
        imgsz=args.imgsz,
        device=args.device,
        split=args.split,
        conf=args.conf,
        iou=args.iou,
        project=str(args.project.expanduser().resolve()),
        name=args.name,
        verbose=False,
        plots=False,
        save_json=True,
    )

    summary = {}
    box_metrics = getattr(metrics, "box", None)
    if box_metrics is not None:
        summary = {
            "precision": as_float(getattr(box_metrics, "mp", None)),
            "recall": as_float(getattr(box_metrics, "mr", None)),
            "map50": as_float(getattr(box_metrics, "map50", None)),
            "map50_95": as_float(getattr(box_metrics, "map", None)),
        }

    per_class = []
    class_names = getattr(metrics, "names", None) or {}
    maps = getattr(box_metrics, "maps", None)
    if maps is not None:
        for idx, score in enumerate(maps):
            class_name = class_names.get(idx, str(idx)) if isinstance(class_names, dict) else str(idx)
            per_class.append({"class_id": idx, "class_name": class_name, "map": as_float(score)})

    payload = {
        "split": args.split,
        "data": str(args.data.resolve()),
        "model": str(args.model.resolve()),
        "summary": summary,
        "per_class": per_class,
    }

    output = args.output
    if output is None:
        output = Path(metrics.save_dir) / "evaluation.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

