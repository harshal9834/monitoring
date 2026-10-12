import os
import uuid
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database import get_db
from backend.models.models import (
    TrainingCentre, CentreUser, AttendanceSubmission, AttendanceAIResult,
    Alert, Action, ActionResponse, ActionTimeline, ApprovedAsset, Camera, Inspection, User, ComplianceScore, CentreBatch,
    Notification, Video, VideoJob, AuditLog
)
from backend.schemas.schemas import AttendanceSubmit, ActionResponseSubmit, DeletionRequest
from backend.services.auth_service import get_current_user, require_roles
from backend.services.cloudinary_service import format_cloudinary_video_url

router = APIRouter(prefix="/api/centre", tags=["Training Centre Portal"])

def get_centre_id_for_user(user: User, db: Session) -> str:
    centre_id = user.centre_id
    if not centre_id:
        cu = db.query(CentreUser).filter(CentreUser.user_id == user.id).first()
        if cu:
            centre_id = cu.centre_id
            user.centre_id = cu.centre_id
            db.commit()

    if not centre_id:
        raise HTTPException(
            status_code=403,
            detail="Submission is allowed only for registered and active training centres."
        )

    # Verify that the centre exists and is ACTIVE
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(
            status_code=403,
            detail="Submission is allowed only for registered and active training centres."
        )

    if centre.status in ["INACTIVE", "SUSPENDED", "DEACTIVATED"]:
        raise HTTPException(
            status_code=403,
            detail="This centre account is currently inactive. Please contact the administrator."
        )

    return centre.id

@router.get("/dashboard")
@router.get("/dashboard/summary")
def get_centre_dashboard_summary(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Assigned centre not found")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Check today's submission status
    today_sub = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.centre_id == centre_id,
        AttendanceSubmission.attendance_date == today_str,
        AttendanceSubmission.is_deleted == False
    ).first()

    # Most recent submission
    last_sub = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.centre_id == centre_id,
        AttendanceSubmission.is_deleted == False
    ).order_by(AttendanceSubmission.submitted_at.desc()).first()

    last_sub_data = None
    if last_sub:
        last_batch = db.query(CentreBatch).filter(CentreBatch.id == last_sub.batch_id).first()
        last_sub_data = {
            "id": last_sub.id,
            "date": last_sub.attendance_date,
            "batchCode": last_batch.batch_code if last_batch else "AI-102",
            "courseName": last_batch.course_name if last_batch else "Vocational Course",
            "trainerName": last_sub.instructor_name or "Trainer",
            "totalRegistered": last_sub.total_registered,
            "totalPresent": last_sub.total_present,
            "totalAbsent": last_sub.total_absent,
            "hasVideo": bool(last_sub.video_id),
            "status": "Submitted" if last_sub.status in ["SUBMITTED", "PENDING"] else last_sub.status,
            "submittedAt": last_sub.submitted_at.strftime("%Y-%m-%d %I:%M %p") if last_sub.submitted_at else today_str
        }

    # Available batches for form
    batches = db.query(CentreBatch).filter(CentreBatch.centre_id == centre_id).all()
    batches_data = [
        {
            "id": b.id,
            "batchCode": b.batch_code,
            "courseName": b.course_name,
            "sanctionedStrength": b.sanctioned_strength,
            "trainerName": b.instructor_name or "Dr. Neha Patwardhan"
        }
        for b in batches
    ]

    # Approved assets for dynamic infrastructure fields
    approved_assets = db.query(ApprovedAsset).filter(ApprovedAsset.centre_id == centre_id).all()
    assets_data = [
        {
            "id": a.asset_type_id,
            "name": a.asset_type.name if a.asset_type else a.asset_type_id.title(),
            "approvedQuantity": a.approved_quantity
        }
        for a in approved_assets
        if a.asset_type_id != "person" # person is handled by trainees
    ]

    unread_notifications = db.query(func.count(Notification.id)).filter(
        (Notification.user_id == current_user.id) | (Notification.entity_id == centre_id),
        Notification.is_read == False
    ).scalar() or 0

    # Dynamic Pending Notices and Overdue Actions calculation
    today_date = datetime.utcnow().date()
    all_centre_actions = db.query(Action).filter(Action.centre_id == centre_id).all()
    pending_notices = 0
    overdue_actions = 0
    for act in all_centre_actions:
        is_resolved = act.status in ["RESOLVED", "VERIFIED", "CANCELLED"]
        if not is_resolved:
            pending_notices += 1
            # Check overdue
            is_due_past = False
            if act.due_date:
                try:
                    # Due date could be YYYY-MM-DD or YYYY-MM-DD HH:MM AM/PM
                    clean_date_str = act.due_date.split(" ")[0]
                    due_d = datetime.strptime(clean_date_str, "%Y-%m-%d").date()
                    if due_d < today_date:
                        is_due_past = True
                except Exception:
                    pass
            if act.is_overdue or is_due_past:
                overdue_actions += 1

    return {
        "centreId": centre.id,
        "centreName": centre.name,
        "centreCode": centre.centre_code,
        "status": centre.status or "ACTIVE",
        "district": centre.district,
        "state": centre.state,
        "todaySubmissionStatus": "Submitted" if today_sub else "Pending Submission",
        "isSubmittedToday": bool(today_sub),
        "todaySubmissionId": today_sub.id if today_sub else None,
        "lastSubmission": last_sub_data,
        "batches": batches_data,
        "infrastructureAssets": assets_data,
        "unreadNotificationsCount": unread_notifications,
        "pendingNoticesCount": pending_notices,
        "overdueActionsCount": overdue_actions
    }

@router.get("/submissions")
def get_centre_submissions(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    submissions = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.centre_id == centre_id,
        AttendanceSubmission.is_deleted == False
    ).order_by(AttendanceSubmission.submitted_at.desc()).all()

    results = []
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    for sub in submissions:
        batch = db.query(CentreBatch).filter(CentreBatch.id == sub.batch_id).first()
        ai = sub.ai_result
        video = db.query(Video).filter(Video.id == sub.video_id).first() if sub.video_id else None

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
            "centreId": sub.centre_id,
            "centreName": centre.name if centre else "My Centre",
            "centreCode": centre.centre_code if centre else "",
            "batchCode": batch.batch_code if batch else "AI-102",
            "courseName": batch.course_name if batch else "Vocational Course",
            "date": sub.attendance_date,
            "sessionStartTime": sub.start_time or "09:00 AM",
            "sessionEndTime": sub.end_time or "01:00 PM",
            "instructorName": sub.instructor_name or "Trainer",
            "totalRegistered": sub.total_registered or 40,
            "totalPresent": sub.total_present or 40,
            "totalAbsent": sub.total_absent if sub.total_absent is not None else max(0, (sub.total_registered or 40) - (sub.total_present or 40)),
            "infrastructure": sub.infrastructure_reported or {},
            "hasVideo": bool(sub.video_id or sub.video_path or vid_media),
            "videoId": sub.video_id,
            "videoFileName": (vid_media.file_name if vid_media else sub.video_original_name) or (video.file_name if video else None),
            "videoUrl": vid_url,
            "hasImage": bool(sub.image_path or img_media),
            "imageFileName": (img_media.file_name if img_media else sub.image_original_name),
            "imageUrl": img_url,
            "secureUrl": img_url or vid_url,
            "aiEstimatedCount": ai.estimated_people if ai else None,
            "discrepancyCount": ai.variance_count if ai else 0,
            "discrepancyPercentage": ai.variance_percentage if ai else 0.0,
            "aiStatus": ai.status if ai else ("PENDING" if (sub.video_id or vid_media or img_media) else "N/A"),
            "status": "Submitted" if sub.status in ["SUBMITTED", "PENDING"] else sub.status,
            "submittedAt": sub.submitted_at.strftime("%Y-%m-%d %I:%M %p") if sub.submitted_at else sub.attendance_date
        })
    return results

@router.get("/attendance")
def get_centre_attendance(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    return get_centre_submissions(current_user, db)

@router.post("/attendance/submissions")
@router.post("/daily-submission")
def submit_centre_daily_data(
    req: AttendanceSubmit,
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)

    # Batch matching
    batch = db.query(CentreBatch).filter(CentreBatch.centre_id == centre_id).first()
    if not batch:
        batch = CentreBatch(
            id=f"btc_{centre_id}",
            centre_id=centre_id,
            batch_code="AI-101",
            course_name="Industrial Automation & Embedded Systems",
            instructor_name=current_user.name or "Lead Trainer",
            sanctioned_strength=40,
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(batch)
        db.flush()
    batch_id = batch.id

    # Generate standard submission ID SUB-2026-XXXXX
    sub_seq = (int(datetime.utcnow().timestamp() * 1000) % 90000) + 10000
    sub_id = f"SUB-2026-{sub_seq}"

    # Auto-calculate and validate trainees
    reg = req.total_registered if req.total_registered is not None else (req.reported_trainees or 40)
    pres = req.total_present if req.total_present is not None else (req.reported_trainees or 40)
    absent = max(0, reg - pres)

    # Infrastructure dictionary
    infra_data = req.infrastructure_reported or {
        "computers": 20,
        "machines": 3,
        "workbenches": 5,
        "chairs": 40
    }

    sub = AttendanceSubmission(
        id=sub_id,
        centre_id=centre_id,
        batch_id=batch_id,
        attendance_date=req.date,
        submitted_by=current_user.id,
        session_name=f"{req.course_name} ({req.batch_code})",
        start_time=req.session_start,
        end_time=req.session_end,
        instructor_name=req.instructor_name or "Trainer",
        total_registered=reg,
        total_present=pres,
        total_absent=absent,
        infrastructure_reported=infra_data,
        video_id=req.video_id,
        status="SUBMITTED"
    )
    db.add(sub)
    db.flush()

    # If video attached, check AI analysis
    has_video = bool(req.video_id)
    ai_status = "Pending"
    if has_video:
        job = db.query(VideoJob).filter(VideoJob.video_id == req.video_id).first()
        est_headcount = pres
        if job and job.analysis_results:
            est_headcount = job.analysis_results.get("estimated_presence", pres)
        
        variance = max(0, pres - est_headcount)
        variance_pct = round((variance / pres) * 100, 1) if pres > 0 else 0.0

        ai_res = AttendanceAIResult(
            attendance_submission_id=sub_id,
            video_id=req.video_id,
            model_version_id="v1.4.0",
            estimated_people=est_headcount,
            confidence=0.942,
            variance_count=variance,
            variance_percentage=variance_pct,
            status="CRITICAL" if variance_pct > 10.0 else ("WARNING" if variance_pct > 5.0 else "MATCH")
        )
        db.add(ai_res)

    db.commit()

    return {
        "success": True,
        "submissionId": sub_id,
        "status": "Submitted",
        "videoStatus": "Uploaded" if has_video else "Not Uploaded",
        "aiProcessing": "Pending" if has_video else "N/A",
        "totalRegistered": reg,
        "totalPresent": pres,
        "totalAbsent": absent,
        "date": req.date,
        "submittedAt": datetime.utcnow().strftime("%Y-%m-%d %I:%M %p")
    }

@router.delete("/submissions/{submission_id}")
@router.post("/submissions/{submission_id}/remove")
def remove_centre_submission(
    submission_id: str,
    body: Optional[DeletionRequest] = None,
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    sub = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.id == submission_id,
        AttendanceSubmission.centre_id == centre_id
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="Submission record not found for your centre")

    reason = body.reason if (body and body.reason) else "Removed by Centre Administrator"

    # Check if AI analysis has already completed or alert was created
    ai_completed = sub.ai_result is not None
    job = db.query(VideoJob).filter(VideoJob.submission_id == sub.id).first()
    if not job and sub.video_id:
        job = db.query(VideoJob).filter(VideoJob.video_id == sub.video_id).first()

    # If pending job and no final compliance audit, remove uncompleted job and video file
    if sub.video_id and (not ai_completed or (job and job.status != "COMPLETED")):
        video = db.query(Video).filter(Video.id == sub.video_id).first()
        if video and video.file_path:
            try:
                local_rel = video.file_path.lstrip("/storage/").lstrip("storage/")
                local_full = os.path.join("storage", local_rel)
                if os.path.exists(local_full):
                    os.remove(local_full)
            except Exception:
                pass
        if job and job.status in ["PENDING", "FAILED"]:
            db.delete(job)

    # Soft delete the submission
    sub.is_deleted = True
    sub.status = "REMOVED"
    sub.deleted_at = datetime.utcnow()
    sub.deleted_by = f"{current_user.name} ({current_user.role})"
    sub.deletion_reason = reason

    # Create Audit Log in MySQL
    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    audit = AuditLog(
        id=audit_id,
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="REMOVE_SUBMISSION",
        entity_type="ATTENDANCE_SUBMISSION",
        entity_id=sub.id,
        old_value="ACTIVE",
        new_value="REMOVED",
        reason=reason,
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Submission {sub.id} successfully removed and archived.",
        "submissionId": sub.id
    }


def _format_notice(act: Action, db: Session, centre: Optional[TrainingCentre]):
    today_date = datetime.utcnow().date()
    is_overdue = act.is_overdue
    if not is_overdue and act.due_date:
        try:
            clean_date_str = act.due_date.split(" ")[0]
            due_d = datetime.strptime(clean_date_str, "%Y-%m-%d").date()
            if due_d < today_date and act.status not in ["RESOLVED", "VERIFIED", "CANCELLED"]:
                is_overdue = True
        except Exception:
            pass

    # Status mapping for Centre UX
    status_display = act.status
    if is_overdue and act.status not in ["RESOLVED", "VERIFIED"]:
        status_display = "OVERDUE"
    elif act.status in ["NOTICE_SENT", "NEW", "ACTION_ASSIGNED", "IN_PROGRESS"]:
        status_display = "ACTION_REQUIRED"
    elif act.status == "SUBMITTED_FOR_VERIFICATION":
        status_display = "PENDING_VERIFICATION"
    elif act.status in ["RESOLVED", "VERIFIED"]:
        status_display = "RESOLVED"

    # Timeline events
    timeline_events = []
    if act.timeline:
        for t in act.timeline:
            timeline_events.append({
                "id": t.id,
                "eventType": t.event_type,
                "description": t.description,
                "performedBy": t.performed_by,
                "createdAt": t.created_at.strftime("%Y-%m-%d %I:%M %p") if t.created_at else ""
            })

    # AI Analysis Summary (from alert if linked)
    ai_summary = None
    if act.alert:
        alt = act.alert
        # Format discrepancy information objectively
        variance_count = abs(alt.variance)
        ai_summary = {
            "alertId": alt.id,
            "category": alt.category,
            "severity": alt.severity,
            "aiConfidence": round((alt.ai_confidence or 0.94) * 100, 1),
            "reportedCount": alt.submitted_value,
            "aiDetectedCount": alt.ai_value,
            "varianceCount": variance_count,
            "discrepancyNote": "Potential variance identified during algorithmic automated scan. Centre explanation requested.",
            "detectedItems": [
                {
                    "class": "person",
                    "reported": alt.submitted_value,
                    "detected": alt.ai_value,
                    "variance": variance_count
                }
            ],
            "evidenceSnapshotUrl": alt.evidence.snapshot_url if alt.evidence else None
        }

    resp = act.response
    verif = act.verification

    return {
        "id": act.id,
        "noticeId": act.id,
        "noticeNumber": act.action_number,
        "actionNumber": act.action_number,
        "centreId": act.centre_id,
        "centreName": centre.name if centre else "My Centre",
        "title": act.title,
        "description": act.description,
        "instructions": act.description,
        "priority": act.priority,
        "status": status_display,
        "rawStatus": act.status,
        "assignedOfficerName": act.assigned_officer_name or "Government Monitoring Officer",
        "issuedDate": act.created_at.strftime("%Y-%m-%d") if act.created_at else datetime.utcnow().strftime("%Y-%m-%d"),
        "dueDate": act.due_date,
        "isOverdue": is_overdue,
        "aiSummary": ai_summary,
        "timeline": timeline_events,
        "response": {
            "submittedBy": resp.submitted_by,
            "explanation": resp.explanation,
            "proofDocumentName": resp.proof_document_name,
            "proofPhotoUrl": resp.proof_photo_url,
            "submittedAt": resp.submitted_at.strftime("%Y-%m-%d %I:%M %p") if resp.submitted_at else ""
        } if resp else None,
        "verification": {
            "outcome": verif.outcome,
            "mandatoryRemarks": verif.mandatory_remarks,
            "verifiedBy": verif.verified_by,
            "verifiedAt": verif.verified_at.strftime("%Y-%m-%d %I:%M %p") if verif.verified_at else ""
        } if verif else None
    }

@router.get("/notices")
@router.get("/actions")
def get_centre_notices(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    actions = db.query(Action).filter(Action.centre_id == centre_id).order_by(Action.created_at.desc()).all()
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    return [_format_notice(act, db, centre) for act in actions]

@router.get("/notices/{notice_id}")
def get_centre_notice_detail(
    notice_id: str,
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    action = db.query(Action).filter(Action.id == notice_id, Action.centre_id == centre_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Notice or Action item not found")
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    return _format_notice(action, db, centre)

@router.post("/notices/{notice_id}/response")
@router.post("/actions/{notice_id}/response")
def submit_centre_notice_response(
    notice_id: str,
    req: ActionResponseSubmit,
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    action = db.query(Action).filter(Action.id == notice_id, Action.centre_id == centre_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Notice item not found for your centre")

    if action.status in ["RESOLVED", "VERIFIED"]:
        raise HTTPException(status_code=400, detail="Notice has already been resolved.")

    # Remove existing response if any to allow resubmission
    existing_resp = db.query(ActionResponse).filter(ActionResponse.action_id == action.id).first()
    if existing_resp:
        db.delete(existing_resp)
        db.flush()

    resp = ActionResponse(
        action_id=action.id,
        submitted_by=f"{current_user.name} ({current_user.designation or 'Centre Admin'})",
        explanation=req.explanation,
        proof_document_name=req.proof_document_name or "Compliance_Explanation_Document.pdf",
        proof_photo_url=req.proof_photo_url
    )
    db.add(resp)
    action.status = "SUBMITTED_FOR_VERIFICATION"

    timeline = ActionTimeline(
        action_id=action.id,
        event_type="RESPONSE_SUBMITTED",
        description=f"Centre submitted explanation and supporting documentation: '{req.explanation[:90]}...'",
        performed_by=current_user.name
    )
    db.add(timeline)

    # Insert official Notification for Government Officers
    officers = db.query(User).filter(User.role.in_(["GOVERNMENT_ADMIN", "MONITORING_OFFICER"])).all()
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    c_name = centre.name if centre else "Training Centre"
    for off in officers:
        db.add(Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            user_id=off.id,
            type="RESPONSE_SUBMITTED",
            title=f"Response Received: {action.action_number}",
            message=f"{c_name} has submitted explanation & evidence for {action.action_number}.",
            entity_type="ACTION",
            entity_id=action.id,
            is_read=False
        ))

    db.commit()
    return {"success": True, "message": "Notice response submitted successfully for Government verification"}

@router.post("/notices/{notice_id}/upload-response")
async def upload_centre_notice_response_multipart(
    notice_id: str,
    explanation: str = Form(...),
    proof_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    action = db.query(Action).filter(Action.id == notice_id, Action.centre_id == centre_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Notice item not found for your centre")

    doc_name = None
    doc_url = None
    if proof_file and proof_file.filename:
        content = await proof_file.read()
        doc_name = proof_file.filename
        
        # Check media type
        ext = os.path.splitext(proof_file.filename)[1].lower()
        is_vid = ext in [".mp4", ".mov", ".avi", ".webm"]
        r_type = "VIDEO" if is_vid else "IMAGE"
        
        from backend.services.cloudinary_service import upload_media_to_cloudinary, is_cloudinary_configured
        if not is_cloudinary_configured():
            raise HTTPException(status_code=500, detail="Cloudinary storage is not configured.")
            
        cloud_res = upload_media_to_cloudinary(
            file_bytes=content,
            center_id=centre_id,
            submission_id=f"notices_{notice_id}",
            filename=proof_file.filename,
            media_type=r_type
        )
        doc_url = cloud_res["secure_url"]

    existing_resp = db.query(ActionResponse).filter(ActionResponse.action_id == action.id).first()
    if existing_resp:
        db.delete(existing_resp)
        db.flush()

    resp = ActionResponse(
        action_id=action.id,
        submitted_by=f"{current_user.name} ({current_user.designation or 'Centre Admin'})",
        explanation=explanation,
        proof_document_name=doc_name or "Explanation_Document.pdf",
        proof_photo_url=doc_url
    )
    db.add(resp)
    action.status = "SUBMITTED_FOR_VERIFICATION"

    timeline = ActionTimeline(
        action_id=action.id,
        event_type="RESPONSE_SUBMITTED",
        description=f"Centre uploaded formal response document: {doc_name or 'Response Document'}",
        performed_by=current_user.name
    )
    db.add(timeline)
    db.commit()

    return {"success": True, "message": "Document & explanation submitted successfully"}

@router.get("/alerts")
def get_centre_alerts(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    alerts = db.query(Alert).filter(Alert.centre_id == centre_id).order_by(Alert.created_at.desc()).all()
    results = []
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    for a in alerts:
        results.append({
            "id": a.id,
            "centreId": a.centre_id,
            "centreName": centre.name if centre else "My Centre",
            "category": a.category,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "detectedTime": a.detected_time or "10:00 AM",
            "aiConfidence": a.ai_confidence,
            "status": a.status,
            "submittedValue": a.submitted_value,
            "aiValue": a.ai_value,
            "variance": a.variance,
            "evidence": {
                "snapshotUrl": a.evidence.snapshot_url if a.evidence else "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
                "detectedCount": a.ai_value,
                "expectedCount": a.submitted_value,
                "confidence": a.ai_confidence,
                "modelVersion": a.evidence.model_version if a.evidence else "v1.4.0",
                "timestamp": a.created_at.isoformat()
            }
        })
    return results


@router.get("/infrastructure")
def get_centre_infrastructure(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    assets = db.query(ApprovedAsset).filter(ApprovedAsset.centre_id == centre_id).all()
    assets_dict = {a.asset_type_id: a.approved_quantity for a in assets}

    return {
        "centreId": centre.id if centre else centre_id,
        "centreName": centre.name if centre else "My Centre",
        "centreCode": centre.centre_code if centre else "",
        "approvedInventory": {
            "computers": assets_dict.get("computers", 20),
            "machines": assets_dict.get("machines", 3),
            "workbenches": assets_dict.get("workbenches", 5),
            "chairs": assets_dict.get("chairs", 40),
            "cctvCameras": assets_dict.get("cctv", 2)
        },
        "cameraStatus": centre.camera_status if centre else "ONLINE"
    }


@router.get("/inspections")
def get_centre_inspections(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    insps = db.query(Inspection).filter(Inspection.centre_id == centre_id).order_by(Inspection.scheduled_date.desc()).all()
    results = []
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    for i in insps:
        results.append({
            "id": i.id,
            "centreId": i.centre_id,
            "centreName": centre.name if centre else "My Centre",
            "inspectionType": i.inspection_type,
            "reason": i.reason,
            "assignedOfficer": i.assigned_officer,
            "scheduledDate": i.scheduled_date,
            "status": i.status,
            "outcome": i.outcome,
            "findings": i.findings
        })
    return results


@router.get("/reports")
def get_centre_reports(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    score = db.query(ComplianceScore).filter(ComplianceScore.centre_id == centre_id).first()
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.centre_id == centre_id, Alert.status != "RESOLVED").scalar() or 0
    pending_actions = db.query(func.count(Action.id)).filter(Action.centre_id == centre_id, Action.status != "RESOLVED").scalar() or 0

    return [{
        "id": f"rep_{centre_id}",
        "centreId": centre_id,
        "centreName": centre.name if centre else "My Centre",
        "centreCode": centre.centre_code if centre else "",
        "district": centre.district if centre else "",
        "state": centre.state if centre else "",
        "complianceScore": round(score.overall_score, 0) if score else 80,
        "attendanceRate": round(score.attendance_score, 0) if score else 80,
        "infrastructureRate": round(score.infrastructure_score, 0) if score else 85,
        "actionRate": round(score.action_score, 0) if score else 82,
        "status": "COMPLIANT" if (score and score.overall_score >= 85) else ("ATTENTION_REQUIRED" if (score and score.overall_score >= 70) else "CRITICAL"),
        "activeAlerts": active_alerts,
        "pendingActions": pending_actions,
        "generatedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    }]


@router.get("/profile")
def get_centre_profile(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    batches_count = db.query(func.count(CentreBatch.id)).filter(CentreBatch.centre_id == centre_id).scalar() or 0
    submissions_count = db.query(func.count(AttendanceSubmission.id)).filter(AttendanceSubmission.centre_id == centre_id).scalar() or 0

    return {
        "centreId": centre.id,
        "centreName": centre.name,
        "centreCode": centre.centre_code,
        "centreType": centre.centre_type,
        "address": centre.address,
        "district": centre.district,
        "state": centre.state,
        "contactPerson": centre.contact_person,
        "contactNumber": centre.contact_number,
        "email": centre.email,
        "approvedCapacity": centre.approved_capacity,
        "accreditationStatus": centre.accreditation_status,
        "status": centre.status,
        "batchesCount": batches_count,
        "submissionsCount": submissions_count,
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "designation": current_user.designation or "Centre Administrator",
            "department": current_user.department or "Operations"
        }
    }


@router.get("/notifications")
def get_centre_notifications(
    current_user: User = Depends(require_roles(["CENTRE_ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre_id = get_centre_id_for_user(current_user, db)
    notifs = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.entity_id == centre_id)
    ).order_by(Notification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.type,
            "severity": "CRITICAL" if n.type == "ALERT" else "INFO",
            "isRead": n.is_read,
            "createdAt": n.created_at.strftime("%Y-%m-%d %I:%M %p") if n.created_at else "Recently"
        }
        for n in notifs
    ]


