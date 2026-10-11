#!/usr/bin/env python3
"""
SkillGuard AI — Dataset Preparation & Standardizer
Verifies dataset directory layout, ensures valid YAML references with absolute paths,
and prepares training configurations.
"""

import os
import sys
import yaml
import json
from validate_dataset import validate_dataset

def prepare_dataset(base_dir="ml/dataset"):
    val_report = validate_dataset(base_dir)
    if not val_report.get("verification_passed"):
        print("[ERROR] Dataset validation failed:")
        print(json.dumps(val_report, indent=2))
        return False

    yaml_path = val_report["yaml_file"]
    dataset_dir = os.path.dirname(yaml_path)

    # Standardize data config with verified paths
    std_yaml = {
        "path": dataset_dir.replace("\\", "/"),
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
        "names": val_report["classes"],
        "nc": val_report["num_classes"],
        "metadata": {
            "source": "Provided Classroom Dataset (Roboflow CC BY 4.0)",
            "total_images": val_report["total_images"],
            "total_boxes": val_report["total_boxes"],
            "classes": val_report["classes"]
        }
    }

    target_cfg = os.path.join(dataset_dir, "skillguard_data.yaml")
    with open(target_cfg, "w", encoding="utf-8") as f:
        yaml.dump(std_yaml, f, sort_keys=False)

    print(f"[SUCCESS] Dataset standardized successfully at: {target_cfg}")
    print(f"Total verified images: {val_report['total_images']}")
    print(f"Total verified annotations: {val_report['total_boxes']}")
    print(f"Discovered classes: {val_report['classes']}")
    return target_cfg

if __name__ == "__main__":
    prepare_dataset()
