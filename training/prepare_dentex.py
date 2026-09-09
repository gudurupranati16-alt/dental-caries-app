from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tif", ".tiff"}


def load_json(path: Path) -> Any | None:
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def is_coco(payload: Any) -> bool:
    return isinstance(payload, dict) and {"images", "annotations", "categories"}.issubset(payload.keys())


def is_dentex_disease(payload: Any) -> bool:
    """Return whether a payload has DENTEX's three-level diagnosis schema."""
    return isinstance(payload, dict) and {
        "images",
        "annotations",
        "categories_1",
        "categories_2",
        "categories_3",
    }.issubset(payload.keys())


def infer_split(path: Path) -> str:
    text = " / ".join([part.lower() for part in path.parts])
    if "train" in text:
        return "train"
    if "val" in text or "valid" in text:
        return "val"
    if "test" in text:
        return "test"
    return "train"


def normalize_label(category: dict[str, Any] | None, annotation: dict[str, Any]) -> str:
    if category and category.get("name"):
        return str(category["name"]).strip().replace(" ", "_")
    if annotation.get("category_name"):
        return str(annotation["category_name"]).strip().replace(" ", "_")
    quadrant = annotation.get("quadrant")
    enumeration = annotation.get("enumeration") or annotation.get("tooth")
    diagnosis = annotation.get("diagnosis") or annotation.get("label")
    if quadrant is not None and enumeration is not None and diagnosis is not None:
        return f"Q{quadrant}_N{enumeration}_{str(diagnosis).strip().replace(' ', '_')}"
    if diagnosis is not None:
        return str(diagnosis).strip().replace(" ", "_")
    raise ValueError("Could not infer a class label from annotation data.")


def dentex_disease_label(
    categories: dict[int, dict[int, dict[str, Any]]], annotation: dict[str, Any]
) -> str:
    """Build the documented Q<quadrant>_N<tooth>_<diagnosis> DENTEX label."""
    names = []
    for level in (1, 2, 3):
        category_id = annotation.get(f"category_id_{level}")
        category = categories[level].get(category_id)
        if category is None or category.get("name") is None:
            raise ValueError(f"Missing DENTEX category_id_{level}: {category_id!r}")
        names.append(str(category["name"]).strip().replace(" ", "_"))
    return f"Q{names[0]}_N{names[1]}_{names[2]}"


def find_image(root: Path, file_name: str) -> Path | None:
    direct = root / file_name
    if direct.exists():
        return direct
    basename = Path(file_name).name
    matches = list(root.rglob(basename))
    return matches[0] if matches else None


def find_annotation_image(json_path: Path, root: Path, file_name: str) -> Path | None:
    """Prefer the xray directory associated with the annotation file."""
    return find_image(json_path.parent / "xrays", file_name) or find_image(root, file_name)


def xywh_to_yolo(bbox: list[float], width: float, height: float) -> tuple[float, float, float, float]:
    x, y, w, h = bbox
    x_center = (x + w / 2.0) / width
    y_center = (y + h / 2.0) / height
    return x_center, y_center, w / width, h / height


def process_coco_json(json_path: Path, root: Path, output: Path, class_names: dict[str, int], split: str) -> None:
    payload = load_json(json_path)
    images = {str(img["id"]): img for img in payload["images"]}
    categories = {str(cat["id"]): cat for cat in payload["categories"] if isinstance(cat, dict)}
    anns_by_image: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for ann in payload["annotations"]:
        anns_by_image[str(ann["image_id"])].append(ann)

    images_dir = output / "images" / split
    labels_dir = output / "labels" / split
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    for image_id, image in images.items():
        src = find_annotation_image(json_path, root, str(image.get("file_name", "")))
        if src is None:
            continue
        dst = images_dir / Path(str(image["file_name"])).name
        if not dst.exists():
            shutil.copy2(src, dst)

        width = float(image.get("width") or 0)
        height = float(image.get("height") or 0)
        if not width or not height:
            continue

        label_lines = []
        for ann in anns_by_image.get(image_id, []):
            bbox = ann.get("bbox")
            if not bbox or len(bbox) != 4:
                continue
            category = categories.get(str(ann.get("category_id")))
            label = normalize_label(category, ann)
            class_index = class_names.setdefault(label, len(class_names))
            x, y, w, h = xywh_to_yolo([float(v) for v in bbox], width, height)
            label_lines.append(f"{class_index} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")

        if label_lines:
            (labels_dir / f"{Path(str(image['file_name'])).stem}.txt").write_text("\n".join(label_lines) + "\n", encoding="utf-8")


def process_dentex_disease_json(
    json_path: Path, root: Path, output: Path, class_names: dict[str, int], split: str
) -> None:
    payload = load_json(json_path)
    images = {str(img["id"]): img for img in payload["images"]}
    categories = {
        level: {cat["id"]: cat for cat in payload[f"categories_{level}"] if isinstance(cat, dict)}
        for level in (1, 2, 3)
    }
    anns_by_image: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for ann in payload["annotations"]:
        anns_by_image[str(ann["image_id"])].append(ann)

    images_dir = output / "images" / split
    labels_dir = output / "labels" / split
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    for image_id, image in images.items():
        src = find_annotation_image(json_path, root, str(image.get("file_name", "")))
        if src is None:
            continue
        dst = images_dir / Path(str(image["file_name"])).name
        if not dst.exists():
            shutil.copy2(src, dst)

        width = float(image.get("width") or 0)
        height = float(image.get("height") or 0)
        if not width or not height:
            continue

        label_lines = []
        for ann in anns_by_image.get(image_id, []):
            bbox = ann.get("bbox")
            if not bbox or len(bbox) != 4:
                continue
            label = dentex_disease_label(categories, ann)
            class_index = class_names.setdefault(label, len(class_names))
            x, y, w, h = xywh_to_yolo([float(v) for v in bbox], width, height)
            label_lines.append(f"{class_index} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")

        if label_lines:
            (labels_dir / f"{Path(str(image['file_name'])).stem}.txt").write_text("\n".join(label_lines) + "\n", encoding="utf-8")


def build_data_yaml(output: Path, class_names: dict[str, int]) -> None:
    names = [name for name, _ in sorted(class_names.items(), key=lambda item: item[1])]
    yaml_text = "\n".join(
        [
            f"path: {output.as_posix()}",
            "train: images/train",
            "val: images/val",
            f"nc: {len(names)}",
            "names:",
        ]
        + [f"  {i}: {name}" for i, name in enumerate(names)]
    )
    (output / "data.yaml").write_text(yaml_text + "\n", encoding="utf-8")


def disease_class_names(paths: list[Path]) -> dict[str, int]:
    labels = set()
    for path in paths:
        payload = load_json(path)
        categories = {
            level: {cat["id"]: cat for cat in payload[f"categories_{level}"] if isinstance(cat, dict)}
            for level in (1, 2, 3)
        }
        labels.update(dentex_disease_label(categories, annotation) for annotation in payload["annotations"])
    return {label: index for index, label in enumerate(sorted(labels))}


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a DENTEX COCO-style dataset for YOLO training.")
    parser.add_argument("root", type=Path, help="Local DENTEX root directory")
    parser.add_argument("output", type=Path, help="Output directory for the prepared YOLO dataset")
    parser.add_argument("--copy-images", action="store_true", default=True, help="Copy images into the output dataset")
    parser.add_argument("--report", type=Path, help="Optional path for a conversion summary JSON file")
    args = parser.parse_args()

    root = args.root.expanduser().resolve()
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)

    coco_files = []
    disease_files = []
    for candidate in root.rglob("*.json"):
        payload = load_json(candidate)
        if is_dentex_disease(payload):
            disease_files.append(candidate)
        elif is_coco(payload):
            coco_files.append(candidate)
    selected_files = disease_files or coco_files
    if not selected_files:
        raise SystemExit("No COCO-style annotation JSON files were found. Inspect the dataset first and adjust the converter.")

    class_names = disease_class_names(disease_files) if disease_files else {}
    converted = []
    for json_path in selected_files:
        split = infer_split(json_path)
        if json_path in disease_files:
            process_dentex_disease_json(json_path, root, output, class_names, split)
        else:
            process_coco_json(json_path, root, output, class_names, split)
        converted.append({"json": str(json_path), "split": split})

    build_data_yaml(output, class_names)

    report = {
        "root": str(root),
        "output": str(output),
        "classes": [name for name, _ in sorted(class_names.items(), key=lambda item: item[1])],
        "annotation_files": converted,
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
