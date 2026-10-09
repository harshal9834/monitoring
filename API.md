# KAVACH-AI: REST API Specification

Base URL: `/api`

---

## 1. Authentication

### `POST /api/auth/login`
Authenticates an administrator or monitoring officer.

**Request Payload:**
```json
{
  "email": "alok.verma@msde.gov.in",
  "password": "secret_password"
}
```

**Response Payload:**
```json
{
  "status": "success",
  "token": "jwt_token_kavach_2026",
  "user": {
    "id": "usr_gov_admin",
    "name": "Dr. Alok Verma",
    "role": "gov_admin"
  }
}
```

---

## 2. Training Centres

### `GET /api/centres`
Returns all accredited training centres and their compliance scores.

### `GET /api/centres/:id`
Returns single centre master details, approved inventory, and inspection dates.

### `POST /api/centres`
Creates and registers a new accredited training centre.

---

## 3. Video Processing & Inference

### `POST /api/video/upload`
Uploads a video file for asynchronous batch processing.

**Response Payload:**
```json
{
  "success": true,
  "jobId": "job_1728456900",
  "message": "Video upload received. Asynchronous job queued."
}
```

### `POST /api/video/analyze`
Triggers AI computer vision inference on a connected CCTV RTSP stream or uploaded file.

**Request Payload:**
```json
{
  "centreId": "tc_001",
  "videoSource": "CCTV_STREAM",
  "samplingFps": 5
}
```

### `GET /api/video/jobs/:id`
Polls asynchronous processing status (`QUEUED`, `PROCESSING`, `COMPLETED`).

---

## 4. Alerts & Issue Management

### `GET /api/alerts`
Returns active AI-flagged compliance alerts.

### `POST /api/alerts/:id/confirm`
Confirms alert validity after human officer review.

### `POST /api/alerts/:id/false-positive`
Flags alert as a false positive with mandatory explanation.

---

## 5. Actions & Follow-up Lifecycle

### `POST /api/actions`
Issues a statutory corrective action notice to a centre.

### `POST /api/actions/:id/response`
Training centre submits clarification text and uploads repair invoice/photo proof.

### `POST /api/actions/:id/verify`
Monitoring officer approves or rejects resolution:
```json
{
  "decision": "APPROVED",
  "mandatoryRemarks": "OEM invoice verified with serial #BP-4401."
}
```

### `POST /api/actions/:id/escalate`
Escalates overdue action to District Monitoring Officer.

---

## 6. Audit & Machine Learning

* `GET /api/audit-logs` — Fetches immutable audit trail.
* `GET /api/ml/dataset-report` — Returns dataset statistics and class distribution.
* `GET /api/ml/metrics` — Returns YOLOv8m benchmark precision, recall, and mAP50 metrics.
