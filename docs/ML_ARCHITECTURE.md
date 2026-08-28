# ML Architecture Note

The current app started as a mock demo, but DENTEX is best treated as an object-detection problem, not a segmentation one. The official challenge materials describe hierarchical annotations and the desired output as bounding boxes for abnormal teeth with quadrant, enumeration, and diagnosis labels.

## What The App Expects
- The frontend originally expected `/predict` to return a base64 mask, class name, confidence, and inference time.
- The backend originally returned a synthetic mask when no checkpoint was present.
- That fallback is not scientifically valid for medical prediction, so it is being removed.

## Real Output Contract
- The real backend should return detection results, not a fake segmentation mask.
- Recommended response shape:

```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "Q4_N8_caries",
      "confidence": 0.93,
      "bbox": [x1, y1, x2, y2]
    }
  ],
  "confidence": 0.93,
  "inference_ms": 24.1,
  "image": { "width": 1024, "height": 512 }
}
```

## Implemented Baseline
- Training baseline: YOLO-style object detection.
- Task: abnormal tooth detection on the fully annotated DENTEX subset.
- Segmentation is not part of the production path because DENTEX provides bounding-box style supervision, not pixel masks.
- ResNet-50 is not used in the production path, but it could be added later as an optional classifier on detected crops.

## Notes
- If `MODEL_PATH` is missing, the backend must fail loudly with a clear error.
- Evaluation metrics must come from a real training run and a saved evaluation artifact.

