# KAVACH-AI: System Architecture

## 1. High-Level Architecture Diagram

```
+--------------------------------------------------------------------------+
|                              INPUT SOURCES                               |
|   Uploaded Video Files   |   Direct RTSP CCTV Streams   |  Browser WebCam|
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                           VIDEO INPUT SERVICE                            |
|             Format Validator | Codec Extractor | Adaptive Sampler        |
|             (1 FPS / 5 FPS / 10 FPS / Adaptive Frame Sampling)           |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                         AI COMPUTER VISION ENGINE                        |
|       Ultralytics YOLOv8m (FP16 TensorRT / ONNX) + ByteTrack Tracker     |
|   Classes: person | computer | workbench | machine | chair | damaged     |
+------------------------------------+-------------------------------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
+----------------------------------+ +-------------------------------------+
|       ATTENDANCE ANALYTICS       | |       INFRASTRUCTURE ANALYTICS      |
| Estimated Headcount vs Logged    | | Approved Quota vs Detected Inventory|
| Variance % & Thresholds Check    | | Apparent Operability Classification |
+-----------------+----------------+ +------------------+------------------+
                  |                                     |
                  +------------------+------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                             COMPLIANCE ENGINE                            |
|         Dynamic Score: 40% Attendance + 35% Infra + 25% Action Cure      |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                               ALERT ENGINE                               |
|        Severity Tagging (Low, Med, High, Crit) + Snapshot Evidence       |
+------------------------------------+-------------------------------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
+----------------------------------+ +-------------------------------------+
|        GOVERNMENT PORTAL         | |        CENTRE ACTION PORTAL         |
|  - Real-time Multi-Centre Map    | |  - View Specific Violations         |
|  - Visual Snapshot Inspection    | |  - Upload OEM Repair Challans / Proof|
|  - Action Notice Issuance        | |  - Submit Trainee Attendance Rosters|
|  - Determination & Verification  | |  - Track Statutory Cure Deadlines   |
+-----------------+----------------+ +------------------+------------------+
                  |                                     |
                  +------------------+------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                          IMMUTABLE AUDIT TRAIL                           |
|        Full State Logging | Actor Role Signatures | Audit Integrity     |
+--------------------------------------------------------------------------+
```

## 2. Key Subsystems

### 2.1 Video Ingestion Subsystem
* Accepts MP4, AVI, MOV, WebM formats up to 500MB.
* Supports RTSP streams using TCP interleaving (`rtsp://host:port/path`).
* Implements browser capture using WebRTC `navigator.mediaDevices.getUserMedia`.

### 2.2 Edge & Low-Bandwidth Optimization
* Edge box runs local inference at 5 FPS.
* Under normal operating conditions, no raw video is streamed over WAN.
* Lightweight JSON heartbeat is transmitted (occupancy counts, timestamp, camera health).
* Upon discrepancy threshold breach (&gt;5% attendance mismatch or missing machinery), an encrypted keyframe snapshot is transmitted to the central cloud repository.
* Reduces bandwidth consumption by **98.4%** compared to continuous 1080p video streaming.

### 2.3 Role-Based Access Control (RBAC)
* **Government Admin**: Global master configuration, scoring weights, audit oversight.
* **Government Monitoring Officer**: Assigned centre supervision, alert validation, action issuance, verification approval/rejection.
* **Training Centre Admin**: Roster submission, explanation filing, repair invoice attachment, rectification confirmation.
* **Super Admin**: System governance and administrative override.
