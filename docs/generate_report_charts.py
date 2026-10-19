import os
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import torch

output_dir = Path(r"c:\Users\MOHIT\OneDrive\Desktop\DENTAL\dental-caries-app\docs\charts")
output_dir.mkdir(parents=True, exist_ok=True)

# 1. Load exact checkpoint data
ckpt_path = Path(r"c:\Users\MOHIT\OneDrive\Desktop\DENTAL\dental-caries-app\models\best.pt")
ckpt = torch.load(ckpt_path, map_location='cpu')
res = ckpt.get('train_results', {})
epochs = list(range(1, 51))

# --- Chart 1: Training and Validation Loss Curves ---
plt.figure(figsize=(12, 6), dpi=300)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

plt.subplot(1, 3, 1)
plt.plot(epochs, res.get('train/box_loss', []), label='Train Box Loss', color='#2563eb', linewidth=2)
plt.plot(epochs, res.get('val/box_loss', []), label='Val Box Loss', color='#dc2626', linestyle='--', linewidth=2)
plt.title('Bounding Box Loss', fontsize=12, fontweight='bold')
plt.xlabel('Epoch', fontsize=10)
plt.ylabel('Loss', fontsize=10)
plt.legend(frameon=True)
plt.grid(True, linestyle=':', alpha=0.6)

plt.subplot(1, 3, 2)
plt.plot(epochs, res.get('train/cls_loss', []), label='Train Cls Loss', color='#059669', linewidth=2)
plt.plot(epochs, res.get('val/cls_loss', []), label='Val Cls Loss', color='#d97706', linestyle='--', linewidth=2)
plt.title('Classification Loss', fontsize=12, fontweight='bold')
plt.xlabel('Epoch', fontsize=10)
plt.ylabel('Loss', fontsize=10)
plt.legend(frameon=True)
plt.grid(True, linestyle=':', alpha=0.6)

plt.subplot(1, 3, 3)
plt.plot(epochs, res.get('train/dfl_loss', []), label='Train DFL Loss', color='#7c3aed', linewidth=2)
plt.plot(epochs, res.get('val/dfl_loss', []), label='Val DFL Loss', color='#db2777', linestyle='--', linewidth=2)
plt.title('Distribution Focal Loss (DFL)', fontsize=12, fontweight='bold')
plt.xlabel('Epoch', fontsize=10)
plt.ylabel('Loss', fontsize=10)
plt.legend(frameon=True)
plt.grid(True, linestyle=':', alpha=0.6)

plt.suptitle('Training & Validation Loss Convergence over 50 Epochs', fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig(output_dir / 'loss_curves.png', bbox_inches='tight')
plt.close()

# --- Chart 2: Accuracy, Precision, Recall, and mAP Curves ---
plt.figure(figsize=(10, 5), dpi=300)
plt.plot(epochs, res.get('metrics/precision(B)', []), label='Precision', color='#0284c7', linewidth=2)
plt.plot(epochs, res.get('metrics/recall(B)', []), label='Recall', color='#16a34a', linewidth=2)
plt.plot(epochs, res.get('metrics/mAP50(B)', []), label='mAP@0.50', color='#9333ea', linewidth=2.5)
plt.plot(epochs, res.get('metrics/mAP50-95(B)', []), label='mAP@0.50:0.95', color='#ea580c', linestyle='--', linewidth=2)
plt.title('Evaluation Metrics (Precision, Recall, mAP) Across 50 Epochs', fontsize=13, fontweight='bold')
plt.xlabel('Epoch', fontsize=11)
plt.ylabel('Metric Score', fontsize=11)
plt.ylim(0, 0.85)
plt.legend(frameon=True, loc='lower right')
plt.grid(True, linestyle=':', alpha=0.7)
plt.tight_layout()
plt.savefig(output_dir / 'accuracy_map_curves.png', bbox_inches='tight')
plt.close()

print('Both training and evaluation charts successfully created in docs/charts!')
