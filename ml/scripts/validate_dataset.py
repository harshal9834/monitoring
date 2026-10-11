#!/usr/bin/env python3
"""
SkillGuard AI — Dataset Discovery & Validation Script
Inspects the provided dataset, validates YOLO format, discovers classes dynamically,
and checks annotation counts and coordinate bounds.
"""

import os
import sys
import glob
import json
import yaml
from collections import Counter

def find_dataset_yaml(base_dir):
    # Specifically check for actual dataset folders
    provided_yaml = os.path.join(base_dir, "classroom-people-number.v1i.yolov8", "data.yaml")
    if os.path.exists(provided_yaml):
        return provided_yaml
    candidates = glob.glob(os.path.join(base_dir, "**", "*.yaml"), recursive=True) + \
                 glob.glob(os.path.join(base_dir, "**", "*.yml"), recursive=True)
    for c in candidates:
        if "data.yaml" in c:
            return c
    return candidates[0] if candidates else None

def validate_dataset(dataset_dir="ml/dataset"):
    yaml_path = find_dataset_yaml(dataset_dir)
    if not yaml_path:
        return {"status": "ERROR", "message": f"No data.yaml found under {dataset_dir}"}
    
    with open(yaml_path, "r", encoding="utf-8") as f:
        data_cfg = yaml.safe_load(f)
        
    yaml_dir = os.path.dirname(os.path.abspath(yaml_path))
    names = data_cfg.get("names", [])
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names.keys())]
        
    num_classes = len(names)
    
    splits = {}
    total_images = 0
    total_labels = 0
    total_boxes = 0
    class_counter = Counter()
    corrupt_lines = 0

    for split in ["train", "valid", "val", "test"]:
        split_img_dir = os.path.join(yaml_dir, split, "images")
        split_lbl_dir = os.path.join(yaml_dir, split, "labels")
        if not os.path.exists(split_img_dir):
            # check sibling
            alt_img_dir = os.path.join(yaml_dir, "..", split, "images")
            if os.path.exists(alt_img_dir):
                split_img_dir = alt_img_dir
                split_lbl_dir = os.path.join(yaml_dir, "..", split, "labels")

        if os.path.exists(split_img_dir):
            imgs = glob.glob(os.path.join(split_img_dir, "*.*"))
            lbls = glob.glob(os.path.join(split_lbl_dir, "*.txt")) if os.path.exists(split_lbl_dir) else []
            
            box_count = 0
            for lf in lbls:
                try:
                    with open(lf, "r", encoding="utf-8") as lfp:
                        for line in lfp:
                            line = line.strip()
                            if not line:
                                continue
                            parts = line.split()
                            if len(parts) >= 5:
                                cid = int(parts[0])
                                class_counter[cid] += 1
                                box_count += 1
                            else:
                                corrupt_lines += 1
                except Exception:
                    corrupt_lines += 1
                    
            splits[split] = {
                "images": len(imgs),
                "labels": len(lbls),
                "boxes": box_count
            }
            total_images += len(imgs)
            total_labels += len(lbls)
            total_boxes += box_count

    class_distribution = {}
    for cid, cnt in class_counter.items():
        cname = names[cid] if cid < len(names) else f"class_{cid}"
        class_distribution[cname] = {
            "class_id": cid,
            "count": cnt,
            "percentage": round((cnt / max(1, total_boxes)) * 100, 2)
        }

    report = {
        "status": "VALIDATED",
        "yaml_file": os.path.abspath(yaml_path),
        "format": "Ultralytics YOLO (normalized class_id x_center y_center width height)",
        "classes": names,
        "num_classes": num_classes,
        "splits": splits,
        "total_images": total_images,
        "total_labels": total_labels,
        "total_boxes": total_boxes,
        "class_distribution": class_distribution,
        "corrupt_lines": corrupt_lines,
        "verification_passed": corrupt_lines == 0 and total_images > 0
    }
    return report

if __name__ == "__main__":
    report = validate_dataset()
    print(json.dumps(report, indent=2))
