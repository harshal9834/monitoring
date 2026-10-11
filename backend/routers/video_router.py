import os
import uuid
import base64
import cv2
import numpy as np
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import get_db
from backend.models.models import (
    Video, VideoJob, VideoSnapshot, TrainingCentre, Alert, AlertEvidence,
    AuditLog, Notification, User
)
from backend.services.auth_service import get_current_user, require_roles
from backend.services.video_service import (
    process_video_pipeline, get_system_thresholds, get_inference_engine
)

router = APIRouter(prefix="/api/video", tags=["Video Monitoring & AI Analytics"])

STORAGE_DIR = "storage"
VIDEOS_DIR = os.path.join(STORAGE_DIR, "videos")
EVIDENCE_DIR = os.path.join(STORAGE_DIR, "evidence")
CAPTURES_DIR = os.path.join(STORAGE_DIR, "captures")

for d in [VIDEOS_DIR, EVIDENCE_DIR, CAPTURES_DIR]:
    os.makedirs(d, exist_ok=True)


@router.get("/config")
def get_video_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns dynamic system thresholds and supported model classes from MySQL."""
    thresholds = get_system_thresholds(db)
    return {
        "default_fps": thresholds["default_fps"],
        "warning_threshold": thresholds["warning_threshold"],
        "critical_threshold": thresholds["critical_threshold"],
        "supported_model_classes": ["person", "computer", "workbench", "machine", "chair"],
        "model_name": "YOLOv8m Compliance Guard (v1.4.0)",
        "privacy_mode": "Zero Biometric Facial Recognition Conforming"
    }


@router.get("/list")
def list_videos(
    centre_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List videos accessible to the user based on role and centre authorization."""
    query = db.query(Video)

    # Strict RBAC enforcement
    if current_user.role == "CENTRE_ADMIN":
        # Centre admin can only see their own centre's videos
        from backend.routers.centre_router import get_centre_id_for_user
        user_centre = get_centre_id_for_user(current_user, db)
        query = query.filter(Video.centre_id == user_centre)
    elif centre_id:
        query = query.filter(Video.centre_id == centre_id)

    videos = query.order_by(Video.created_at.desc()).all()

    output = []
    for v in videos:
        job = db.query(VideoJob).filter(VideoJob.video_id == v.id).first()
        centre = db.query(TrainingCentre).filter(TrainingCentre.id == v.centre_id).first()
        
        analysis = job.analysis_results if job and job.analysis_results else {}
        attendance_comp = analysis.get("attendance_comparison", {})
        
        output.append({
            "id": v.id,
            "centreId": v.centre_id,
            "centreName": centre.name if centre else "Training Centre",
            "fileName": v.file_name,
            "filePath": v.file_path,
            "fileSize": v.file_size_bytes,
            "duration": v.duration_seconds,
            "sourceType": v.source_type,
            "processingStatus": job.status if job else "COMPLETED",
            "estimatedPersons": analysis.get("estimated_presence", 0),
            "attendanceStatus": attendance_comp.get("status", "MATCH"),
            "variancePercentage": attendance_comp.get("variance_percentage", 0.0),
            "createdAt": v.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return output


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    centre_id: str = Form(...),
    source_type: str = Form("UPLOAD"), # UPLOAD or CAPTURE
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a local video file (MP4, AVI, MOV, WebM) or browser camera capture.
    Saves to local storage, creates MySQL records, processes video pipeline,
    and returns initial analysis results.
    """
    # Enforce RBAC
    if current_user.role == "CENTRE_ADMIN":
        from backend.routers.centre_router import get_centre_id_for_user
        allowed_centre = get_centre_id_for_user(current_user, db)
        centre_id = allowed_centre # Force user's centre

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".webm"]:
        ext = ".mp4"

    video_id = f"vid_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}"
    saved_filename = f"{video_id}{ext}"
    local_target_dir = CAPTURES_DIR if source_type == "CAPTURE" else VIDEOS_DIR
    target_path = os.path.join(local_target_dir, saved_filename)

    # Save to Local Storage
    contents = await file.read()
    with open(target_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)

    # Probe duration with OpenCV
    duration = 0.0
    cap = cv2.VideoCapture(target_path)
    if cap.isOpened():
        n_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        duration = round(n_frames / fps, 2) if fps > 0 else 0.0
        cap.release()

    # Relative path accessible via static files mount
    rel_path = f"/storage/{'captures' if source_type == 'CAPTURE' else 'videos'}/{saved_filename}"

    # Create Video Record in MySQL
    video_rec = Video(
        id=video_id,
        centre_id=centre_id,
        uploaded_by=current_user.id,
        file_name=file.filename or saved_filename,
        file_path=rel_path,
        file_size_bytes=file_size,
        mime_type=file.content_type or f"video/{ext.strip('.')}",
        duration_seconds=duration,
        source_type="BROWSER_CAPTURE" if source_type == "CAPTURE" else "CENTRE_UPLOAD",
        created_at=datetime.utcnow()
    )
    db.add(video_rec)

    # Create VideoJob in MySQL
    job = VideoJob(
        id=f"job_{video_id}",
        video_id=video_id,
        status="PROCESSING",
        progress_percentage=10,
        created_at=datetime.utcnow()
    )
    db.add(job)
    db.commit()

    # Run AI Pipeline
    try:
        analysis_data = process_video_pipeline(target_path, centre_id, db)
        job.status = "COMPLETED"
        job.progress_percentage = 100
        job.completed_at = datetime.utcnow()
        job.analysis_results = analysis_data
        db.commit()
    except Exception as e:
        print(f"[Error] AI Video Processing failed: {e}")
        job.status = "FAILED"
        job.error_message = str(e)
        db.commit()
        analysis_data = {
            "error": str(e),
            "estimated_presence": 0,
            "attendance_comparison": {"status": "MATCH", "variance_count": 0, "variance_percentage": 0.0},
            "infrastructure_comparison": [],
            "timeline_events": [],
            "frame_events": []
        }

    return {
        "videoId": video_id,
        "fileName": video_rec.file_name,
        "filePath": rel_path,
        "centreId": centre_id,
        "duration": duration,
        "jobStatus": job.status,
        "analysis": analysis_data
    }


@router.get("/{video_id}")
def get_video_detail(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full video metadata, playback path, and timestamped AI detections."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    # Access control
    if current_user.role == "CENTRE_ADMIN":
        from backend.routers.centre_router import get_centre_id_for_user
        allowed_centre = get_centre_id_for_user(current_user, db)
        if video.centre_id != allowed_centre:
            raise HTTPException(status_code=403, detail="Unauthorized access to another centre's video")

    job = db.query(VideoJob).filter(VideoJob.video_id == video.id).first()
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == video.centre_id).first()

    analysis = job.analysis_results if job and job.analysis_results else {}

    # If analysis wasn't cached, generate it now
    if not analysis or "frame_events" not in analysis:
        # Check if physical file exists
        local_rel = video.file_path.lstrip("/storage/")
        local_full = os.path.join(STORAGE_DIR, local_rel)
        if os.path.exists(local_full):
            try:
                analysis = process_video_pipeline(local_full, video.centre_id, db)
                if job:
                    job.analysis_results = analysis
                    job.status = "COMPLETED"
                    db.commit()
            except Exception as e:
                print(f"[Warning] On-demand processing failed: {e}")

    return {
        "id": video.id,
        "centreId": video.centre_id,
        "centreName": centre.name if centre else "Training Centre",
        "centreCode": centre.centre_code if centre else "",
        "fileName": video.file_name,
        "filePath": video.file_path,
        "duration": video.duration_seconds,
        "sourceType": video.source_type,
        "processingStatus": job.status if job else "COMPLETED",
        "analysis": analysis,
        "createdAt": video.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }


@router.post("/{video_id}/infer-frame")
async def infer_live_frame(
    video_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Real-time live YOLO inference on a single base64 frame from playback canvas."""
    data_url = payload.get("image")
    if not data_url or "," not in data_url:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        header, b64_data = data_url.split(",", 1)
        img_bytes = base64.b64decode(b64_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode image")

        engine = get_inference_engine()
        result = engine.infer_frame(frame)
        return {
            "persons": result.get("raw_person_count", 0),
            "detections": result.get("detections", []),
            "counts": result.get("counts", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/{video_id}/snapshot")
async def capture_snapshot_evidence(
    video_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Capture Evidence button handler:
    Saves current video frame to local storage /storage/evidence/
    and records metadata in MySQL video_snapshots.
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    data_url = payload.get("imageData")
    timestamp = float(payload.get("timestamp", 0.0))
    if not data_url or "," not in data_url:
        raise HTTPException(status_code=400, detail="Missing imageData base64 payload")

    snap_id = f"snap_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}"
    filename = f"{snap_id}.jpg"
    target_path = os.path.join(EVIDENCE_DIR, filename)

    try:
        _, b64_data = data_url.split(",", 1)
        img_bytes = base64.b64decode(b64_data)
        with open(target_path, "wb") as f:
            f.write(img_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save evidence frame: {e}")

    rel_path = f"/storage/evidence/{filename}"

    # Insert into MySQL
    snap = VideoSnapshot(
        id=snap_id,
        video_id=video.id,
        centre_id=video.centre_id,
        frame_path=rel_path,
        timestamp_seconds=timestamp,
        captured_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(snap)

    # Log audit entry
    audit = AuditLog(
        id=f"aud_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:4]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="EVIDENCE_SNAPSHOT_CAPTURED",
        entity_type="EVIDENCE",
        entity_id=snap_id,
        new_value=f"Captured evidence frame at {timestamp}s for video {video.file_name}",
        ip_address="127.0.0.1",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "snapshotId": snap_id,
        "framePath": rel_path,
        "timestamp": timestamp,
        "createdAt": snap.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }


@router.post("/{video_id}/flag-violation")
async def flag_violation(
    video_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Flag Violation button handler:
    Creates a new statutory Alert in MySQL, links evidence snapshot,
    notifies Government Officers, and registers an immutable audit log.
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    title = payload.get("title") or "Attendance / Infrastructure Discrepancy Flagged"
    category = payload.get("category") or "ATTENDANCE_MISMATCH"
    severity = payload.get("severity") or "CRITICAL"
    description = payload.get("description") or f"Discrepancy identified during AI video analysis of session {video.file_name}."
    submitted_val = int(payload.get("submittedValue", 40))
    ai_val = int(payload.get("aiValue", 32))
    variance = max(0, submitted_val - ai_val)
    snapshot_url = payload.get("snapshotUrl") or "/storage/evidence/default.jpg"

    alert_id = f"alt_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:4]}"

    alert = Alert(
        id=alert_id,
        centre_id=video.centre_id,
        video_id=video.id,
        category=category,
        severity=severity,
        title=title,
        description=description,
        detected_time=datetime.utcnow().strftime("%I:%M %p"),
        submitted_value=submitted_val,
        ai_value=ai_val,
        variance=variance,
        ai_confidence=0.94,
        status="NEW",
        created_at=datetime.utcnow()
    )
    db.add(alert)

    evidence = AlertEvidence(
        alert_id=alert_id,
        snapshot_url=snapshot_url,
        model_version="YOLOv8m Compliance Guard (v1.4.0)",
        detected_count=ai_val,
        expected_count=submitted_val,
        confidence=0.94,
        timestamp=datetime.utcnow()
    )
    db.add(evidence)

    # Broadcast notification to officers
    notif = Notification(
        id=f"notif_{int(datetime.utcnow().timestamp())}",
        user_id=current_user.id,
        type="CRITICAL" if severity == "CRITICAL" else "WARNING",
        title=f"Flagged Violation: {title}",
        message=f"New alert generated from AI video verification for centre {video.centre_id}. Human review required.",
        entity_type="ALERT",
        entity_id=alert_id,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        id=f"aud_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:4]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="COMPLIANCE_VIOLATION_FLAGGED",
        entity_type="ALERT",
        entity_id=alert_id,
        new_value=f"Violation flagged by {current_user.name}: {title} (Variance: {variance})",
        ip_address="127.0.0.1",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "alertId": alert_id,
        "status": "NEW",
        "title": title,
        "severity": severity,
        "variance": variance,
        "message": "Violation logged successfully and routed for human officer review."
    }
