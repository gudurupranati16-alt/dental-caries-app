import json
import shutil
from pathlib import Path

TRAIN_JSON = Path(r"C:\Users\farru\Downloads\training_data\training_data\quadrant-enumeration-disease\train_quadrant_enumeration_disease.json")
TRAIN_IMAGES = TRAIN_JSON.parent / "xrays"

VAL_JSON = Path(r"D:\dental caries detection data\validation_data (1)\validation_triple.json")
VAL_IMAGES = VAL_JSON.parent / "validation_data" / "quadrant_enumeration_disease" / "xrays"

OUTPUT = Path(r"D:\dental caries detection data\DENTEX_yolo_4class")

DISEASES = {
    0: "Impacted",
    1: "Caries",
    2: "Periapical_Lesion",
    3: "Deep_Caries",
}

DISEASE_IDS = {
    "Impacted": 0,
    "Caries": 1,
    "Periapical_Lesion": 2,
    "Deep_Caries": 3,
}


def convert(json_path, image_root, split):
    data = json.loads(json_path.read_text(encoding="utf-8"))
    images = {str(x["id"]): x for x in data["images"]}

    counts = {name: 0 for name in DISEASES.values()}
    converted = 0

    labels_by_image = {}
    for ann in data["annotations"]:
        disease_id = ann["category_id_3"]
        disease_name = DISEASES[disease_id]
        labels_by_image.setdefault(str(ann["image_id"]), []).append(ann)
        counts[disease_name] += 1

    image_out = OUTPUT / "images" / split
    label_out = OUTPUT / "labels" / split
    image_out.mkdir(parents=True, exist_ok=True)
    label_out.mkdir(parents=True, exist_ok=True)

    for image_id, image in images.items():
        filename = Path(image["file_name"]).name
        source = image_root / filename

        if not source.exists():
            matches = list(image_root.rglob(filename))
            if not matches:
                print(f"WARNING: missing image {filename}")
                continue
            source = matches[0]

        shutil.copy2(source, image_out / filename)

        width = float(image["width"])
        height = float(image["height"])

        lines = []
        for ann in labels_by_image.get(image_id, []):
            x, y, w, h = map(float, ann["bbox"])

            xc = (x + w / 2) / width
            yc = (y + h / 2) / height
            nw = w / width
            nh = h / height

            class_id = ann["category_id_3"]
            lines.append(f"{class_id} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

        if lines:
            (label_out / f"{Path(filename).stem}.txt").write_text(
                "\n".join(lines) + "\n",
                encoding="utf-8",
            )
            converted += len(lines)

    return len(images), converted, counts


OUTPUT.mkdir(parents=True, exist_ok=True)

train_images, train_annotations, train_counts = convert(
    TRAIN_JSON, TRAIN_IMAGES, "train"
)

val_images, val_annotations, val_counts = convert(
    VAL_JSON, VAL_IMAGES, "val"
)

yaml_text = f"""path: {OUTPUT.as_posix()}
train: images/train
val: images/val
nc: 4
names:
  0: Impacted
  1: Caries
  2: Periapical_Lesion
  3: Deep_Caries
"""

(OUTPUT / "data.yaml").write_text(yaml_text, encoding="utf-8")

report = {
    "classes": DISEASES,
    "train_images": train_images,
    "train_annotations": train_annotations,
    "train_counts": train_counts,
    "val_images": val_images,
    "val_annotations": val_annotations,
    "val_counts": val_counts,
}

(OUTPUT / "conversion-report.json").write_text(
    json.dumps(report, indent=2),
    encoding="utf-8",
)

print(json.dumps(report, indent=2))
print(f"\nCreated: {OUTPUT}")
