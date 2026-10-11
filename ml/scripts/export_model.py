#!/usr/bin/env python3
"""
SkillGuard AI — ML Model Exporter
Exports trained weights to ONNX format, generates model metadata, and registers for production.
"""

import os
import sys
import json
from datetime import datetime

try:
    from ultralytics import YOLO
except ImportError:
    print("[ERROR] ultralytics not installed")
    sys.exit(1)

def export_model(model_path="yolov8n.pt", export_format="onnx"):
    print(f"Exporting model {model_path} to format {export_format}...")
    model = YOLO(model_path)
    exported_path = model.export(format=export_format)
    print(f"[SUCCESS] Model successfully exported to: {exported_path}")
    return exported_path

if __name__ == "__main__":
    export_model()
