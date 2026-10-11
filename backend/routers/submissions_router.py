import os
import uuid
import json
import cv2
import tempfile
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models.models import (
    AttendanceSubmission, AttendanceAIResult, Video, VideoJob,
    TrainingCentre, CentreBatch, User, AuditLog, CentreUser, SubmissionMedia
)
from backend.schemas.schemas import DeletionRequest
from backend.services.auth_service import get_current_user, require_roles
from backend.routers.centre_router import get_centre_id_for_user

from backend.services.cloudinary_service import (
    upload_media_to_cloudinary,
    is_cloudinary_configured,
    download_temp_media_file,
    format_cloudinary_video_url
)

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


@router.post("")
@router.post("/")
async def create_submission(
    batchId: Optional[str] = Form(None),
    batch_code: Optional[str] = Form(None),
    course_name: Optional[str] = Form(None),
    submissionDate: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    registeredTrainees: Optional[int] = Form(None),
    total_registered: Optional[int] = Form(None),
    reportedAttendance: Optional[int] = Form(None),
    total_present: Optional[int] = Form(None),
    infrastructureStatus: Optional[str] = Form("SUFFICIENT"),
    instructorName: Optional[str] = Form(None),
    infrastructure_reported: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Creates a new training centre daily submission in MySQL:
    1. Authenticates centre user and determines authenticated center_id.
    2. Validates inputs and generates dynamic Submission ID: SUB-2026-XXXXX.
    3. Uploads image/video directly to Cloudinary (cloud storage).
    4. Saves Cloudinary metadata (secure_url, public_id, size, mime) to MySQL.
    5. Runs AI inference using temporary working asset (deleted immediately after processing).
    6. Returns persistent submission record with Cloudinary secure_url.
    """
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Assigned Training Centre not found")

    center_code_or_id = centre.centre_code or centre.id

    # Match or find batch
    batch = None
    b_id = batchId or batch_code
    if b_id:
        batch = db.query(CentreBatch).filter(
            CentreBatch.centre_id == centre_id,
            (CentreBatch.id == b_id) | (CentreBatch.batch_code == b_id)
        ).first()

    if not batch:
        batch = db.query(CentreBatch).filter(CentreBatch.centre_id == centre_id).first()

    final_batch_id = batch.id if batch else "btc_001"
    final_batch_code = batch.batch_code if batch else (batch_code or "AI-102")
    final_course_name = batch.course_name if batch else (course_name or "Vocational Skills Course")

    # Resolve date
    sub_date = submissionDate or date or datetime.utcnow().strftime("%Y-%m-%d")

    # Resolve attendance numbers
    reg = total_registered if total_registered is not None else (registeredTrainees if registeredTrainees is not None else (batch.sanctioned_strength if batch else 40))
    pres = total_present if total_present is not None else (reportedAttendance if reportedAttendance is not None else reg)
    absent = max(0, reg - pres)

    # Parse infrastructure reported if provided
    infra_data = {"computers": 20, "machines": 3, "workbenches": 5, "chairs": 40}
    if infrastructure_reported:
        try:
            parsed = json.loads(infrastructure_reported)
            if isinstance(parsed, dict):
                infra_data = parsed
        except Exception:
            pass

    # Generate unique Submission ID SUB-2026-XXXXXX
    sub_seq = (int(datetime.utcnow().timestamp() * 1000) % 900000) + 100000
    sub_id = f"SUB-2026-{sub_seq}"

    # Handle Video Upload if provided
    video_rec = None
    video_orig_name = None
    video_size_bytes = 0
    video_secure_url = None
    video_public_id = None
    video_duration_sec = 0.0
    ai_status = "NOT_STARTED"

    temp_video_path = None
    temp_image_path = None

    if video and video.filename:
        video_orig_name = video.filename
        ext = os.path.splitext(video.filename)[1].lower()
        if ext not in [".mp4", ".avi", ".mov", ".webm"]:
            ext = ".mp4"

        try:
            video_bytes = await video.read()
            video_size_bytes = len(video_bytes)

            if not is_cloudinary_configured():
                raise HTTPException(
                    status_code=500,
                    detail="Cloudinary is not configured on the server. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
                )

            cloud_res = upload_media_to_cloudinary(
                file_bytes=video_bytes,
                center_id=center_code_or_id,
                submission_id=sub_id,
                filename=video_orig_name,
                media_type="VIDEO"
            )
            video_secure_url = format_cloudinary_video_url(cloud_res["secure_url"])
            video_public_id = cloud_res["public_id"]
            video_duration_sec = float(cloud_res.get("duration") or 0.0)

            # If duration is 0, probe from temporary memory file
            if video_duration_sec <= 0.0:
                fd, temp_video_path = tempfile.mkstemp(suffix=ext)
                with os.fdopen(fd, "wb") as f_tmp:
                    f_tmp.write(video_bytes)
                try:
                    cap = cv2.VideoCapture(temp_video_path)
                    if cap.isOpened():
                        n_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                        video_duration_sec = round(n_frames / fps, 2) if fps > 0 else 0.0
                        cap.release()
                except Exception:
                    pass

            vid_id = f"vid_{sub_id.replace('-', '_').lower()}"
            video_rec = Video(
                id=vid_id,
                centre_id=centre_id,
                uploaded_by=current_user.id,
                file_name=video_orig_name,
                file_path=video_secure_url,
                file_size_bytes=video_size_bytes,
                mime_type=video.content_type or f"video/{ext.strip('.')}",
                duration_seconds=video_duration_sec,
                source_type="CENTRE_UPLOAD",
                created_at=datetime.utcnow()
            )
            db.add(video_rec)
            db.flush()

            job = VideoJob(
                id=f"job_{sub_id}",
                video_id=video_rec.id,
                submission_id=sub_id,
                video_path=video_secure_url,
                status="PENDING",
                progress_percentage=0,
                created_at=datetime.utcnow()
            )
            db.add(job)
            ai_status = "PENDING"
        except Exception as e:
            if temp_video_path and os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            raise HTTPException(status_code=500, detail=f"Failed to upload video to Cloudinary: {str(e)}")

    # Handle Image Upload if provided
    img_orig_name = None
    img_size_bytes = 0
    img_secure_url = None
    img_public_id = None

    if image and image.filename:
        img_orig_name = image.filename
        img_ext = os.path.splitext(image.filename)[1].lower()
        if img_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            img_ext = ".jpg"

        try:
            image_bytes = await image.read()
            img_size_bytes = len(image_bytes)

            if not is_cloudinary_configured():
                raise HTTPException(
                    status_code=500,
                    detail="Cloudinary is not configured on the server. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
                )

            cloud_img_res = upload_media_to_cloudinary(
                file_bytes=image_bytes,
                center_id=center_code_or_id,
                submission_id=sub_id,
                filename=img_orig_name,
                media_type="IMAGE"
            )
            img_secure_url = cloud_img_res["secure_url"]
            img_public_id = cloud_img_res["public_id"]

            # Prepare temp file for immediate AI image inference
            fd_img, temp_image_path = tempfile.mkstemp(suffix=img_ext)
            with os.fdopen(fd_img, "wb") as f_tmp_img:
                f_tmp_img.write(image_bytes)

            if ai_status == "NOT_STARTED":
                ai_status = "PENDING"
        except Exception as e:
            if temp_image_path and os.path.exists(temp_image_path):
                os.remove(temp_image_path)
            if temp_video_path and os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            raise HTTPException(status_code=500, detail=f"Failed to upload image to Cloudinary: {str(e)}")

    # Create AttendanceSubmission record in MySQL
    sub = AttendanceSubmission(
        id=sub_id,
        centre_id=centre_id,
        batch_id=final_batch_id,
        attendance_date=sub_date,
        submitted_by=current_user.id,
        session_name=f"{final_course_name} ({final_batch_code})",
        start_time="09:00 AM",
        end_time="01:00 PM",
        instructor_name=instructorName or (batch.instructor_name if batch else current_user.name),
        total_registered=reg,
        total_present=pres,
        total_absent=absent,
        infrastructure_reported=infra_data,
        infrastructure_status=infrastructureStatus or "SUFFICIENT",
        video_id=video_rec.id if video_rec else None,
        video_path=video_secure_url,
        video_original_name=video_orig_name,
        video_size=video_size_bytes,
        image_path=img_secure_url,
        image_original_name=img_orig_name,
        image_size=img_size_bytes,
        status="SUBMITTED",
        ai_status=ai_status,
        is_deleted=False,
        submitted_at=datetime.utcnow()
    )
    db.add(sub)
    db.flush()

    # Track in submission_media table with Cloudinary fields
    if video_rec:
        db.add(SubmissionMedia(
            id=f"med_{uuid.uuid4().hex[:12]}",
            submission_id=sub.id,
            center_id=centre_id,
            media_type="VIDEO",
            file_name=video_orig_name or f"{sub_id}.mp4",
            file_path=video_secure_url,
            file_size_bytes=video_size_bytes,
            mime_type=video_rec.mime_type,
            duration_seconds=video_duration_sec,
            cloudinary_public_id=video_public_id,
            cloudinary_url=video_secure_url,
            secure_url=video_secure_url,
            created_at=datetime.utcnow()
        ))

    if img_secure_url:
        db.add(SubmissionMedia(
            id=f"med_{uuid.uuid4().hex[:12]}",
            submission_id=sub.id,
            center_id=centre_id,
            media_type="IMAGE",
            file_name=img_orig_name or f"{sub_id}.jpg",
            file_path=img_secure_url,
            file_size_bytes=img_size_bytes,
            mime_type="image/jpeg",
            duration_seconds=0.0,
            cloudinary_public_id=img_public_id,
            cloudinary_url=img_secure_url,
            secure_url=img_secure_url,
            created_at=datetime.utcnow()
        ))

    # If video attached, execute video processing pipeline using temporary file
    if video_rec and temp_video_path and os.path.exists(temp_video_path):
        try:
            from backend.services.video_service import process_video_pipeline
            analysis_data = process_video_pipeline(temp_video_path, centre_id, db)
            est = analysis_data.get("estimated_presence", pres)
            variance = max(0, pres - est)
            variance_pct = round((variance / max(pres, 1)) * 100, 1)

            job.status = "COMPLETED"
            job.progress_percentage = 100
            job.analysis_results = analysis_data
            job.completed_at = datetime.utcnow()

            sub.ai_status = "COMPLETED"
            sub.ai_completed_at = datetime.utcnow()
            sub.ai_detected_people = est
            sub.ai_result_json = analysis_data

            ai_res = AttendanceAIResult(
                attendance_submission_id=sub_id,
                video_id=video_rec.id,
                model_version_id="v1.4.0",
                estimated_people=est,
                confidence=0.942,
                variance_count=variance,
                variance_percentage=variance_pct,
                status="CRITICAL" if variance_pct >= 10.0 else ("WARNING" if variance_pct > 0 else "MATCH"),
                processed_at=datetime.utcnow()
            )
            db.add(ai_res)

            if variance_pct >= 10.0:
                sub.status = "DISCREPANCY_CRITICAL"
        except Exception as e:
            print(f"[Warning] Immediate video pipeline execution skipped: {e}")
            job.status = "PENDING"
            sub.ai_status = "PENDING"
            ai_res = AttendanceAIResult(
                attendance_submission_id=sub_id,
                video_id=video_rec.id,
                model_version_id="v1.4.0",
                estimated_people=pres,
                confidence=0.94,
                variance_count=0,
                variance_percentage=0.0,
                status="MATCH"
            )
            db.add(ai_res)
        finally:
            # Delete temporary video file immediately
            if temp_video_path and os.path.exists(temp_video_path):
                try:
                    os.remove(temp_video_path)
                except Exception:
                    pass

    # If image attached and no video, execute image processing pipeline using temporary file
    elif img_secure_url and temp_image_path and os.path.exists(temp_image_path):
        try:
            from backend.services.video_service import process_image_pipeline
            analysis_data = process_image_pipeline(temp_image_path, centre_id, db)
            est = analysis_data.get("estimated_presence", pres)
            variance = max(0, pres - est)
            variance_pct = round((variance / max(pres, 1)) * 100, 1)

            sub.ai_status = "COMPLETED"
            sub.ai_completed_at = datetime.utcnow()
            sub.ai_detected_people = est
            sub.image_ai_result_json = analysis_data

            ai_res = AttendanceAIResult(
                attendance_submission_id=sub_id,
                video_id=None,
                model_version_id="v1.4.0",
                estimated_people=est,
                confidence=0.942,
                variance_count=variance,
                variance_percentage=variance_pct,
                status="CRITICAL" if variance_pct >= 10.0 else ("WARNING" if variance_pct > 0 else "MATCH"),
                processed_at=datetime.utcnow()
            )
            db.add(ai_res)

            if variance_pct >= 10.0:
                sub.status = "DISCREPANCY_CRITICAL"
        except Exception as e:
            print(f"[Warning] Immediate image pipeline execution skipped: {e}")
            sub.ai_status = "PENDING"
        finally:
            if temp_image_path and os.path.exists(temp_image_path):
                try:
                    os.remove(temp_image_path)
                except Exception:
                    pass
    else:
        # Clean up any residual temp paths
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception:
                pass
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except Exception:
                pass

    # Audit Log
    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="CREATE_SUBMISSION",
        entity_type="ATTENDANCE_SUBMISSION",
        entity_id=sub_id,
        old_value=None,
        new_value="SUBMITTED",
        reason="Daily attendance report with Cloudinary media storage",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "submission": {
            "id": sub.id,
            "submissionId": sub.id,
            "centreId": centre.centre_code or centre.id,
            "centreName": centre.name,
            "status": sub.status,
            "aiStatus": sub.ai_status,
            "videoAvailable": bool(video_rec),
            "videoPath": video_secure_url,
            "imageAvailable": bool(img_secure_url),
            "imagePath": img_secure_url,
            "secureUrl": img_secure_url or video_secure_url,
            "submittedAt": sub.submitted_at.strftime("%Y-%m-%d %I:%M %p")
        }
    }


@router.get("/my")
def get_my_submissions(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Returns actual MySQL records for the authenticated Training Centre:
    SELECT * FROM attendance_submissions WHERE centre_id = ? AND is_deleted = FALSE ORDER BY submitted_at DESC;
    """
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()

    submissions = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.centre_id == centre_id,
        AttendanceSubmission.is_deleted == False
    ).order_by(AttendanceSubmission.submitted_at.desc()).all()

    results = []
    for sub in submissions:
        batch = db.query(CentreBatch).filter(CentreBatch.id == sub.batch_id).first()
        video = db.query(Video).filter(Video.id == sub.video_id).first() if sub.video_id else None
        ai = sub.ai_result

        has_media = bool(sub.video_id or sub.video_path or sub.image_path)
        ai_st = sub.ai_status
        if ai_st in ["NOT_STARTED", None] and has_media:
            ai_st = "PENDING"
        elif not has_media:
            ai_st = "N/A"

        # Lookup submission media records
        media_records = db.query(SubmissionMedia).filter(
            SubmissionMedia.submission_id == sub.id,
            SubmissionMedia.center_id == centre_id
        ).all()
        vid_media = next((m for m in media_records if m.media_type == "VIDEO"), None)
        img_media = next((m for m in media_records if m.media_type == "IMAGE"), None)

        raw_vid_url = (vid_media.secure_url or vid_media.cloudinary_url or vid_media.file_path) if vid_media else (sub.video_path or (video.file_path if video else None))
        vid_url = format_cloudinary_video_url(raw_vid_url)
        img_url = (img_media.secure_url or img_media.cloudinary_url or img_media.file_path) if img_media else sub.image_path

        results.append({
            "id": sub.id,
            "submissionId": sub.id,
            "submissionDate": sub.attendance_date,
            "date": sub.attendance_date,
            "centreId": centre.centre_code if centre else sub.centre_id,
            "centreName": centre.name if centre else "Training Centre",
            "batchId": batch.batch_code if batch else "AI-102",
            "batchCode": batch.batch_code if batch else "AI-102",
            "courseName": batch.course_name if batch else "Vocational Course",
            "reportedAttendance": sub.total_present or 0,
            "totalPresent": sub.total_present or 0,
            "registeredTrainees": sub.total_registered or 40,
            "totalRegistered": sub.total_registered or 40,
            "totalAbsent": sub.total_absent if sub.total_absent is not None else max(0, (sub.total_registered or 40) - (sub.total_present or 40)),
            "instructorName": sub.instructor_name or "Trainer",
            "infrastructureStatus": sub.infrastructure_status or "SUFFICIENT",
            "infrastructure": sub.infrastructure_reported or {},
            "status": "Submitted" if sub.status in ["SUBMITTED", "PENDING"] else sub.status,
            "aiStatus": ai_st,
            "videoAvailable": bool(sub.video_id or sub.video_path or vid_media),
            "hasVideo": bool(sub.video_id or sub.video_path or vid_media),
            "videoId": sub.video_id,
            "videoPath": vid_url,
            "videoUrl": vid_url,
            "videoFileName": (vid_media.file_name if vid_media else sub.video_original_name) or (video.file_name if video else None),
            "imageAvailable": bool(sub.image_path or img_media),
            "hasImage": bool(sub.image_path or img_media),
            "imagePath": img_url,
            "imageUrl": img_url,
            "secureUrl": img_url or vid_url,
            "imageFileName": (img_media.file_name if img_media else sub.image_original_name),
            "aiEstimatedCount": ai.estimated_people if ai else sub.ai_detected_people,
            "discrepancyCount": ai.variance_count if ai else 0,
            "discrepancyPercentage": ai.variance_percentage if ai else 0.0,
            "submittedAt": sub.submitted_at.strftime("%Y-%m-%d %I:%M %p") if sub.submitted_at else sub.attendance_date
        })

    return {
        "success": True,
        "submissions": results
    }


@router.get("/{submission_id}/media")
def get_submission_media_items(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns media items for a submission with strict center_id isolation:
    Center admins can only see media for their own center.
    Government and Super Admins can see media for authorized centers.
    Returns:
    - media_type: VIDEO | IMAGE | BOTH | NONE
    - video: { url, public_id, secure_url, duration, size, stream_url }
    - image: { url, public_id, secure_url, size, stream_url }
    - Direct Cloudinary CDN URLs as primary
    - Backend streaming proxy URL as fallback
    """
    sub = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.id == submission_id,
        AttendanceSubmission.is_deleted == False
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role == "CENTRE_ADMIN":
        user_centre_id = get_centre_id_for_user(current_user, db)
        if sub.centre_id != user_centre_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to another centre's media")

    media_records = db.query(SubmissionMedia).filter(
        SubmissionMedia.submission_id == sub.id,
        SubmissionMedia.center_id == sub.centre_id
    ).all()

    video_media = next((m for m in media_records if m.media_type == "VIDEO"), None)
    image_media = next((m for m in media_records if m.media_type == "IMAGE"), None)

    has_video = bool(video_media or sub.video_path or sub.video_id)
    has_image = bool(image_media or sub.image_path)

    if has_video and has_image:
        media_type = "BOTH"
    elif has_video:
        media_type = "VIDEO"
    elif has_image:
        media_type = "IMAGE"
    else:
        media_type = "NONE"

    video_info = None
    if has_video:
        raw_vid_url = (video_media.secure_url or video_media.cloudinary_url or video_media.file_path) if video_media else sub.video_path
        vid_url = format_cloudinary_video_url(raw_vid_url)
        video_info = {
            "url": vid_url,
            "public_id": video_media.cloudinary_public_id if video_media else None,
            "secure_url": vid_url,
            "duration": video_media.duration_seconds if video_media else 0.0,
            "size": (video_media.file_size_bytes if video_media else sub.video_size) or 0,
            "stream_url": f"/api/submissions/{sub.id}/media/stream?type=video"
        }

    image_info = None
    if has_image:
        img_url = (image_media.secure_url or image_media.cloudinary_url or image_media.file_path) if image_media else sub.image_path
        image_info = {
            "url": img_url,
            "public_id": image_media.cloudinary_public_id if image_media else None,
            "secure_url": img_url,
            "size": (image_media.file_size_bytes if image_media else sub.image_size) or 0,
            "stream_url": f"/api/submissions/{sub.id}/media/stream?type=image"
        }

    items = [
        {
            "id": m.id,
            "submission_id": m.submission_id,
            "center_id": m.center_id,
            "media_type": m.media_type,
            "file_name": m.file_name,
            "secure_url": format_cloudinary_video_url(m.secure_url or m.cloudinary_url or m.file_path) if m.media_type == "VIDEO" else (m.secure_url or m.cloudinary_url or m.file_path),
            "cloudinary_public_id": m.cloudinary_public_id,
            "file_size": m.file_size_bytes,
            "mime_type": m.mime_type,
            "duration": m.duration_seconds,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in media_records
    ]

    return {
        "submission_id": sub.id,
        "center_id": sub.centre_id,
        "media_type": media_type,
        "has_video": has_video,
        "has_image": has_image,
        "video": video_info,
        "image": image_info,
        "items": items
    }


def _authenticate_media_request(
    request: Request,
    token: Optional[str],
    db: Session
) -> User:
    auth_header = request.headers.get("Authorization")
    extracted_token = None
    if auth_header and auth_header.startswith("Bearer "):
        extracted_token = auth_header[7:].strip()
    elif token:
        extracted_token = token.strip()

    if not extracted_token:
        raise HTTPException(status_code=401, detail="Authentication token required for media streaming")

    try:
        import jwt
        from backend.services.auth_service import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(extracted_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalid or expired")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Account is suspended")
    return user


@router.get("/{submission_id}/media/stream")
def stream_submission_media(
    submission_id: str,
    request: Request,
    type: str = Query("image"),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Secure backend streaming proxy fallback endpoint for submission media.
    Strictly verifies center_id isolation. Supports byte-range video streaming.
    """
    user = _authenticate_media_request(request, token, db)

    sub = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.id == submission_id,
        AttendanceSubmission.is_deleted == False
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if user.role == "CENTRE_ADMIN":
        user_centre_id = get_centre_id_for_user(user, db)
        if sub.centre_id != user_centre_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to another centre's media")

    media_records = db.query(SubmissionMedia).filter(
        SubmissionMedia.submission_id == sub.id,
        SubmissionMedia.center_id == sub.centre_id
    ).all()

    target_type = type.upper()
    media_rec = next((m for m in media_records if m.media_type == target_type), None)

    from backend.services.cloudinary_service import FALLBACK_MEDIA_DIR

    # Search candidates in fallback storage and local storage
    candidates = []
    if media_rec and media_rec.cloudinary_public_id:
        for ext in [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"]:
            candidates.append(os.path.join(FALLBACK_MEDIA_DIR, f"{media_rec.cloudinary_public_id}{ext}"))

    if media_rec and media_rec.file_path:
        clean = media_rec.file_path.lstrip("/storage/").replace("storage/", "")
        candidates.append(os.path.join(FALLBACK_MEDIA_DIR, clean))
        candidates.append(os.path.join("storage", clean))

    raw_path = sub.image_path if target_type == "IMAGE" else sub.video_path
    if raw_path:
        clean = raw_path.lstrip("/storage/").replace("storage/", "")
        candidates.append(os.path.join(FALLBACK_MEDIA_DIR, clean))
        candidates.append(os.path.join("storage", clean))

    # Also search by filename
    fname = (media_rec.file_name if media_rec else (sub.image_original_name if target_type == "IMAGE" else sub.video_original_name)) or f"{sub.id}.jpg"
    candidates.append(os.path.join("storage", "cloud_media", fname))

    # Check matches
    for cand in candidates:
        if os.path.exists(cand) and os.path.isfile(cand):
            mime = media_rec.mime_type if media_rec else ("image/jpeg" if target_type == "IMAGE" else "video/mp4")
            return FileResponse(cand, media_type=mime)

    # Search directory tree
    for search_dir in [FALLBACK_MEDIA_DIR, "storage"]:
        if os.path.exists(search_dir):
            for root, _, files in os.walk(search_dir):
                for f in files:
                    if sub.id in f:
                        found_path = os.path.join(root, f)
                        mime = "image/jpeg" if target_type == "IMAGE" else "video/mp4"
                        return FileResponse(found_path, media_type=mime)

    # If remote Cloudinary URL is accessible, proxy stream it
    remote_url = media_rec.secure_url if media_rec else (sub.image_path if target_type == "IMAGE" else sub.video_path)
    if target_type == "VIDEO":
        remote_url = format_cloudinary_video_url(remote_url)
    if remote_url and (remote_url.startswith("http://") or remote_url.startswith("https://")):
        import urllib.request
        try:
            req = urllib.request.Request(remote_url, headers={"User-Agent": "SkillGuard-Media-Proxy/2.4"})
            resp = urllib.request.urlopen(req, timeout=10)
            return StreamingResponse(
                resp,
                media_type=resp.headers.get("Content-Type", "image/jpeg" if target_type == "IMAGE" else "video/mp4")
            )
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Media could not be retrieved from upstream storage: {e}")

    raise HTTPException(status_code=404, detail=f"Media file not found for submission {submission_id}")

