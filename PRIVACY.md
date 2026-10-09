# KAVACH-AI: Privacy-Preserving Architecture & Governance

## 1. Statutory Privacy Mandate

In strict compliance with the **Digital Personal Data Protection (DPDP) Act** and Ministry of Skill Development & Entrepreneurship regulations, KAVACH-AI is engineered with a **Zero-Biometric Architecture**:

1. **No Facial Recognition**: The computer vision models do not detect, extract, or store facial landmarks, embeddings, or biometric templates.
2. **Aggregate Headcount Presence**: Persons are localized strictly as anonymous geometric bounding boxes (`class: person`) to compute physical occupancy per room.
3. **No Student Profiling**: Individual students cannot be tracked across days or identified. No demographic inference (gender, age, ethnicity) is computed.

---

## 2. Low-Bandwidth Edge Processing

To safeguard data transmission and reduce vulnerability:
* Inference occurs locally at the training centre edge box or local gateway.
* Raw continuous video streams are **not** persisted or transmitted over WAN.
* The system transmits encrypted numerical metadata:
  ```json
  {
    "centre_id": "MH-PUN-TC-0842",
    "timestamp": "2026-10-09T10:45:12Z",
    "counts": { "person": 32, "computer": 18, "machine": 2 },
    "bandwidth_mode": "EDGE_LOW_BANDWIDTH"
  }
  ```
* Visual keyframe snapshots are uploaded **only** when an authorized discrepancy threshold is crossed (&gt;5% attendance difference or machinery shortfall) to provide evidentiary justification for human officers.

---

## 3. Human-In-The-Loop AI Safety

* AI outputs are always tagged as **"Estimated Presence"** and **"Potential Discrepancy"**.
* AI detections do not automatically levy fines, de-recognize centres, or block funding.
* All regulatory determinations require review, verification, and signature by an authorized Government Monitoring Officer.
