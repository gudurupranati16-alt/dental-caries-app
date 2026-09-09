from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tif", ".tiff"}


@dataclass
class JsonSummary:
    path: str
    kind: str
    top_level_keys: list[str]
    images: int | None = None
    annotations: int | None = None
    categories: list[str] | None = None
    bbox_annotations: int | None = None
    segmentation_annotations: int | None = None
    sample_relationships: list[dict[str, Any]] | None = None


def scan_tree(root: Path, max_depth: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    root = root.resolve()
    for path in sorted(root.rglob("*")):
        depth = len(path.relative_to(root).parts)
        if depth > max_depth:
            continue
        stat = path.stat()
        rows.append(
            {
                "path": str(path.relative_to(root)),
                "type": "dir" if path.is_dir() else "file",
                "size": stat.st_size if path.is_file() else None,
            }
        )
    return rows


def find_images(root: Path) -> list[Path]:
    return [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]


def safe_json_load(path: Path) -> Any | None:
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def summarize_json(path: Path) -> JsonSummary:
    payload = safe_json_load(path)
    if payload is None:
        return JsonSummary(path=str(path), kind="unreadable", top_level_keys=[])
    if isinstance(payload, dict) and {"images", "annotations", "categories"}.issubset(payload.keys()):
        images = payload.get("images", [])
        annotations = payload.get("annotations", [])
        categories = payload.get("categories", [])
        image_id_to_name = {str(img.get("id")): img.get("file_name") for img in images if isinstance(img, dict)}
        sample_relationships = []
        for ann in annotations[:10]:
            if isinstance(ann, dict):
                sample_relationships.append(
                    {
                        "image_id": ann.get("image_id"),
                        "image_file": image_id_to_name.get(str(ann.get("image_id"))),
                        "category_id": ann.get("category_id"),
                        "bbox": ann.get("bbox"),
                        "has_segmentation": "segmentation" in ann,
                    }
                )
        return JsonSummary(
            path=str(path),
            kind="coco",
            top_level_keys=sorted(payload.keys()),
            images=len(images),
            annotations=len(annotations),
            categories=[
                str(cat.get("name", cat.get("id")))
                for cat in categories
                if isinstance(cat, dict)
            ],
            bbox_annotations=sum(1 for ann in annotations if isinstance(ann, dict) and "bbox" in ann),
            segmentation_annotations=sum(1 for ann in annotations if isinstance(ann, dict) and "segmentation" in ann),
            sample_relationships=sample_relationships,
        )

    if isinstance(payload, list):
        sample_keys = sorted({key for item in payload[:5] if isinstance(item, dict) for key in item.keys()})
        return JsonSummary(
            path=str(path),
            kind="list",
            top_level_keys=sample_keys,
            images=None,
            annotations=len(payload),
        )

    if isinstance(payload, dict):
        return JsonSummary(
            path=str(path),
            kind="dict",
            top_level_keys=sorted(payload.keys()),
        )

    return JsonSummary(path=str(path), kind=type(payload).__name__, top_level_keys=[])


def collect_counts(root: Path) -> dict[str, Any]:
    images = find_images(root)
    dirs = [p for p in root.rglob("*") if p.is_dir()]
    annotations = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() == ".json" and safe_json_load(p) is not None]
    category_guess = Counter()
    for img in images:
        parent = img.parent.name
        if parent and parent != root.name:
            category_guess[parent] += 1
    return {
        "root": str(root.resolve()),
        "directories": len(dirs),
        "images": len(images),
        "annotation_files": len(annotations),
        "category_guess": dict(category_guess.most_common()),
        "json_summaries": [asdict(summarize_json(path)) for path in annotations],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect a local DENTEX dataset extract.")
    parser.add_argument("root", type=Path, help="Path to the local DENTEX directory")
    parser.add_argument("--max-depth", type=int, default=4, help="Maximum directory depth to show")
    parser.add_argument("--report-json", type=Path, help="Optional path to write the inspection report")
    args = parser.parse_args()

    root = args.root.expanduser().resolve()
    if not root.exists():
        raise SystemExit(f"Dataset root not found: {root}")

    report = {
        "tree": scan_tree(root, args.max_depth),
        "summary": collect_counts(root),
    }

    print(json.dumps(report, indent=2))
    if args.report_json:
        args.report_json.parent.mkdir(parents=True, exist_ok=True)
        args.report_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
