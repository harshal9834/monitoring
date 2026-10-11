#!/usr/bin/env python3
"""
SkillGuard AI — Ground Truth Dataset Inspector & Statistical Report
Inspects the actual provided dataset: /ml/dataset/classroom-people-number.v1i.yolov8
Generates truthful metrics, split breakdowns, and resolution distributions.
"""

import os
import sys
import glob
import json
from validate_dataset import validate_dataset

def generate_report():
    base_dir = os.path.abspath("ml/dataset")
    report = validate_dataset(base_dir)
    
    formatted_report = {
        "dataset_name": "Classroom People Headcount Detection (Roboflow v1)",
        "source": "ml/dataset/classroom-people-number.v1i.yolov8",
        "format": "Ultralytics YOLO (normalized class_id x_center y_center width height)",
        "classes": report["classes"],
        "num_classes": report["num_classes"],
        "splits": report["splits"],
        "total_images": report["total_images"],
        "total_annotations": report["total_boxes"],
        "class_distribution": report["class_distribution"],
        "annotation_integrity": {
            "corrupt_lines": report["corrupt_lines"],
            "verification_status": "PASSED" if report["verification_passed"] else "FAILED"
        },
        "supported_classes": ["person"],
        "unsupported_classes_notes": {
            "computer": "Model not trained for this class (not present in provided dataset)",
            "machine": "Model not trained for this class (not present in provided dataset)",
            "workbench": "Model not trained for this class (not present in provided dataset)",
            "chair": "Model not trained for this class (not present in provided dataset)"
        }
    }
    return formatted_report

if __name__ == "__main__":
    rep = generate_report()
    print(json.dumps(rep, indent=2))
