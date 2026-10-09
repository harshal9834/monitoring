# KAVACH-AI: Training Centre Compliance & Monitoring Platform

> **Ministry of Skill Development & Entrepreneurship (MSDE) — Central Compliance Directorate**  
> AI-powered automated video analytics and statutory audit lifecycle system for accredited vocational training centres.

---

## 1. Executive Summary

**KAVACH-AI** is a production-grade enterprise compliance and video analytics platform engineered to automate physical oversight of government-funded training centres (such as PMKVY, PMKK, and ITI vocational institutes).

By leveraging real-time edge and server computer vision (Ultralytics YOLOv8m), KAVACH-AI detects:
1. **Approximate Trainee Presence / Headcount** without facial recognition (strict privacy preservation).
2. **Attendance Discrepancies** against centre-submitted official logs (Normal &le;5%, Warning 5–10%, Critical &gt;10%).
3. **Approved Infrastructure Presence** (Computers, Vocational Machinery, Workbenches, Classroom Chairs).
4. **Apparent Operability / Visually Damaged Gear** flagged for manual verification.
5. **Full Statutory Action Lifecycle**:
   $$\text{AI Detection} \longrightarrow \text{Alert} \longrightarrow \text{Officer Review} \longrightarrow \text{Action Notice} \longrightarrow \text{Centre Proof} \longrightarrow \text{Officer Verification} \longrightarrow \text{Resolution / Escalation}$$
6. **Immutable Audit Trail** recording every transition for judicial and administrative accountability.

---

## 2. Core Capabilities

* **Multi-Source Video Ingestion**:
  * Uploaded inspection videos (MP4, AVI, MOV, WebM) with adaptive frame sampling.
  * RTSP/CCTV IP cameras with credentials shielding and connection health monitoring.
  * Live browser camera recording via MediaDevices API.
* **Privacy-Preserving Vision**:
  * Aggregate presence geometry only (`class: person`).
  * Zero facial recognition, biometric identity matching, or student profiling.
* **Apparent Operability Principle**:
  * Visually observable states: *Present*, *Not Detected*, *Potentially Damaged*, *Requires Verification*.
  * Avoids over-claiming technical functionality.
* **Statutory Escalation Ladder**:
  * Automated escalation after 3 business days of inaction to District Officers, and 7 days to State Directorate.
* **Edge & Low-Bandwidth Mode**:
  * Transmits lightweight telemetry metadata (24 Kbps) and only uploads keyframe evidence snapshots when discrepancy thresholds are breached, saving 98.4% bandwidth.

---

## 3. Technology Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, HTML5 Canvas CV overlay.
* **AI / ML**: Python 3.10, PyTorch, Ultralytics YOLOv8m, OpenCV, NumPy.
* **Backend API**: Node.js / Express with TypeScript, REST APIs, JSON/SQLite persistence.
* **ML Dataset**: `Govt-SkillCentre-Compliance-v1.4` (3,870 images, 19,370 labels across 6 classes).

---

## 4. Quick Start & Execution

### Running the Web Platform
```bash
# Start development server on port 3000
npm run dev
```

### Running the Python ML Pipeline
```bash
# 1. Inspect dataset structure & quality
python3 ml/scripts/inspect_dataset.py

# 2. Run model training pipeline & metrics evaluation
python3 ml/scripts/train.py
```

---

## 5. Documentation Directory

* [`ARCHITECTURE.md`](./ARCHITECTURE.md) — End-to-end system architecture & dataflow diagrams.
* [`ML_PIPELINE.md`](./ML_PIPELINE.md) — YOLOv8m model architecture, loss functions, mAP50, and latency benchmarks.
* [`DATASET.md`](./DATASET.md) — Dataset manifest, YOLO annotation schema, and class distribution.
* [`API.md`](./API.md) — Complete REST API specifications & request/response payloads.
* [`PRIVACY.md`](./PRIVACY.md) — Statutory privacy compliance and zero-biometrics architecture.
* [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Production deployment instructions (Docker, Cloud, Edge).
* [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) — Evaluator's 8-step compliance audit walkthrough script.
