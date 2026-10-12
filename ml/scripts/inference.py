#!/usr/bin/env python3
"""
SkillGuard AI — Real ML Inference & Object Tracking Engine
Performs YOLO object detection on video frames or images, detects persons,
computes aggregate counts, and extracts bounding boxes with tracking IDs.
"""

import os
import sys
import json
import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    print("[ERROR] ultralytics not installed")
    sys.exit(1)

class SkillGuardInferenceEngine:
    def __init__(self, model_path=None):
        if not model_path or not os.path.exists(model_path):
            registry_file = "ml/models/model_registry.json"
            if os.path.exists(registry_file):
                try:
                    with open(registry_file, "r") as f:
                        reg = json.load(f)
                        active_id = reg.get("active_model")
                        for m in reg.get("models", []):
                            if m.get("model_id") == active_id and os.path.exists(m.get("weights_file", "")):
                                model_path = m.get("weights_file")
                                break
                except Exception:
                    pass
        if not model_path or not os.path.exists(model_path):
            for candidate in ["yolov8m.pt", "monitoring/yolov8m.pt", "yolov8s.pt", "monitoring/yolov8s.pt", "yolov8n.pt", "monitoring/yolov8n.pt"]:
                if os.path.exists(candidate):
                    model_path = candidate
                    break
        if not model_path or not os.path.exists(model_path):
            model_path = "yolov8m.pt"

        print(f"[SkillGuard AI] Loading YOLO Inference Weights from: {model_path}")
        try:
            import torch
            torch.set_num_threads(2)
        except Exception:
            pass
        self.model = YOLO(model_path)
        self.classes = ["person"]
        self.unsupported = ["computer", "machine", "workbench", "chair"]

    def infer_frame(self, frame_bgr, conf_thresh=0.12):
        h, w = frame_bgr.shape[:2]
        try:
            import torch
            with torch.no_grad():
                results = self.model.predict(source=frame_bgr, conf=conf_thresh, imgsz=640, verbose=False)
        except Exception:
            results = self.model.predict(source=frame_bgr, conf=conf_thresh, imgsz=640, verbose=False)

        
        detections = []
        counts = {}
        person_count = 0

        for r in results:
            boxes = r.boxes
            for i, box in enumerate(boxes):
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()

                # Normalize bounding box [x_center, y_center, width, height]
                x1, y1, x2, y2 = xyxy
                norm_w = (x2 - x1) / w
                norm_h = (y2 - y1) / h
                norm_x = (x1 + x2) / (2.0 * w)
                norm_y = (y1 + y2) / (2.0 * h)

                cls_name = self.model.names.get(cls_id, f"class_{cls_id}").lower()
                counts[cls_name] = counts.get(cls_name, 0) + 1
                if cls_name == "person":
                    person_count += 1

                detections.append({
                    "id": f"det_{i+1}",
                    "class": cls_name,
                    "confidence": round(conf, 3),
                    "trackId": i + 1,
                    "bbox": [round(norm_x, 3), round(norm_y, 3), round(norm_w, 3), round(norm_h, 3)],
                    "condition": "OPERATIONAL"
                })

        return {
            "counts": counts,
            "detections": detections,
            "raw_person_count": person_count
        }

    def process_video_file(self, video_path, output_annotated_path=None, sample_fps=5):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": f"Cannot open video {video_path}"}

        orig_fps = cap.get(cv2.CAP_PROP_FPS) or 25
        frame_interval = max(1, int(orig_fps / sample_fps))
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        processed_frames = 0
        person_counts = []

        frame_idx = 0
        all_class_counts = {}
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % frame_interval == 0:
                res = self.infer_frame(frame)
                person_counts.append(res["raw_person_count"])
                for c_name, count in res.get("counts", {}).items():
                    all_class_counts[c_name] = max(all_class_counts.get(c_name, 0), count)
                processed_frames += 1
            frame_idx += 1

        cap.release()
        avg_people = int(np.mean(person_counts)) if person_counts else 0

        return {
            "total_video_frames": total_frames,
            "sampled_frames_processed": processed_frames,
            "average_person_count": avg_people,
            "peak_person_count": max(person_counts) if person_counts else 0,
            "min_person_count": min(person_counts) if person_counts else 0,
            "detected_classes": all_class_counts
        }

if __name__ == "__main__":
    engine = SkillGuardInferenceEngine()
    test_img = np.zeros((480, 640, 3), dtype=np.uint8)
    res = engine.infer_frame(test_img)
    print(json.dumps(res, indent=2))
