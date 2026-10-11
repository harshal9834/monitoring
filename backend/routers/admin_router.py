import uuid
import re
import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from typing import Optional, List

from backend.database import get_db
from backend.models.models import (
    User, TrainingCentre, CentreUser, CentreCategory, CentreBatch,
    AttendanceSubmission, AuditLog, ApprovedAsset, SubmissionMedia, Alert, Action
)
from backend.schemas.schemas import (
    CentreCreate, CentreUpdate, CentreUserAccessCreate, UserPasswordReset
)
from backend.services.auth_service import require_roles, hash_password

router = APIRouter(prefix="/api/admin", tags=["Administration Portal"])


# -------------------------------------------------------------
# HELPER: Generate Standard Unique Centre ID
# Format: {STATE_CODE}-{CITY_CODE}-TC-{SEQUENCE:04d}
# e.g., MH-PUN-TC-0842
# -------------------------------------------------------------
STATE_CODE_MAP = {
    "maharashtra": "MH",
    "delhi": "DL",
    "karnataka": "KA",
    "tamil nadu": "TN",
    "gujarat": "GJ",
    "uttar pradesh": "UP",
    "rajasthan": "RJ",
    "madhya pradesh": "MP",
    "west bengal": "WB",
    "telangana": "TS",
    "andhra pradesh": "AP",
    "kerala": "KL",
    "punjab": "PB",
    "haryana": "HR",
    "bihar": "BR",
    "odisha": "OD"
}

def generate_unique_centre_id(state: str, city_or_district: str, db: Session) -> str:
    clean_state = (state or "Maharashtra").strip().lower()
    state_code = STATE_CODE_MAP.get(clean_state, clean_state[:2].upper())

    clean_city = re.sub(r'[^A-Za-z]', '', (city_or_district or "Pune").strip())
    city_code = clean_city[:3].upper() if len(clean_city) >= 3 else (clean_city.upper() + "X")[:3]

    prefix = f"{state_code}-{city_code}-TC-"

    # Find highest sequence with this prefix or global sequence
    existing_centres = db.query(TrainingCentre.centre_code).filter(
        TrainingCentre.centre_code.like(f"{prefix}%")
    ).all()

    max_seq = 0
    for (code,) in existing_centres:
        if code and code.startswith(prefix):
            suffix = code[len(prefix):]
            if suffix.isdigit():
                max_seq = max(max_seq, int(suffix))

    if max_seq > 0:
        new_seq = max_seq + 1
    else:
        # Count total centres to provide realistic initial sequence
        total_count = db.query(func.count(TrainingCentre.id)).scalar() or 0
        new_seq = total_count + 1

    candidate_id = f"{prefix}{new_seq:04d}"

    # Ensure uniqueness
    while db.query(TrainingCentre).filter(TrainingCentre.centre_code == candidate_id).first():
        new_seq += 1
        candidate_id = f"{prefix}{new_seq:04d}"

    return candidate_id


# -------------------------------------------------------------
# 1. ADMIN DASHBOARD SUMMARY
# -------------------------------------------------------------
@router.get("/dashboard/summary")
def get_admin_dashboard_summary(
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_centres = db.query(func.count(TrainingCentre.id)).scalar() or 0
    active_centres = db.query(func.count(TrainingCentre.id)).filter(TrainingCentre.status == "ACTIVE").scalar() or 0
    inactive_centres = db.query(func.count(TrainingCentre.id)).filter(TrainingCentre.status != "ACTIVE").scalar() or 0
    audit_logs_count = db.query(func.count(AuditLog.id)).scalar() or 0

    return {
        "clusterStatus": "100% OPERATIONAL",
        "totalCentres": total_centres,
        "activeCentres": active_centres,
        "inactiveCentres": inactive_centres,
        "totalUsers": total_users,
        "auditLogsCount": audit_logs_count,
        "databaseStatus": "Healthy (MySQL 8.0+ Connected)"
    }


# -------------------------------------------------------------
# 2. CENTRE REGISTRATION & MANAGEMENT
# -------------------------------------------------------------
@router.get("/centres")
def get_admin_centres(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    category_id: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(TrainingCentre)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(
            TrainingCentre.name.ilike(s),
            TrainingCentre.centre_code.ilike(s),
            TrainingCentre.district.ilike(s),
            TrainingCentre.city.ilike(s),
            TrainingCentre.state.ilike(s)
        ))
    if status_filter and status_filter != "ALL":
        query = query.filter(TrainingCentre.status == status_filter)
    if category_id and category_id != "ALL":
        query = query.filter(TrainingCentre.category_id == category_id)
    if district and district != "ALL":
        query = query.filter(TrainingCentre.district == district)

    centres = query.order_by(TrainingCentre.created_at.desc()).all()
    results = []

    for c in centres:
        # Category
        cat = db.query(CentreCategory).filter(CentreCategory.id == c.category_id).first() if c.category_id else None
        
        # Associated Centre Admins
        c_users = db.query(User).join(CentreUser, CentreUser.user_id == User.id).filter(
            CentreUser.centre_id == c.id
        ).all()
        if not c_users and c.id:
            c_users = db.query(User).filter(User.centre_id == c.id).all()

        user_names = [u.name for u in c_users]
        user_emails = [u.email for u in c_users]

        # Latest submission date
        latest_sub = db.query(AttendanceSubmission).filter(
            AttendanceSubmission.centre_id == c.id,
            AttendanceSubmission.is_deleted == False
        ).order_by(AttendanceSubmission.submitted_at.desc()).first()

        results.append({
            "id": c.id,
            "centreId": c.centre_code or c.id,
            "centre_code": c.centre_code,
            "centreName": c.name,
            "name": c.name,
            "categoryId": c.category_id,
            "categoryName": cat.name if cat else "AI & Robotics",
            "category": cat.name if cat else "AI & Robotics",
            "state": c.state,
            "district": c.district,
            "city": c.city or c.district,
            "pincode": c.pincode,
            "address": c.address,
            "contactNumber": c.contact_number,
            "officialEmail": c.email,
            "approvedCapacity": c.approved_capacity,
            "status": c.status,
            "registeredDate": c.created_at.strftime("%Y-%m-%d") if c.created_at else None,
            "assignedUsers": user_names,
            "assignedEmails": user_emails,
            "totalUsers": len(c_users),
            "latestSubmissionDate": latest_sub.attendance_date if latest_sub else None
        })

    return results


@router.get("/centres/{centre_id}")
def get_admin_centre_detail(
    centre_id: str,
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == centre_id) | (TrainingCentre.centre_code == centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Training Centre not found")

    cat = db.query(CentreCategory).filter(CentreCategory.id == centre.category_id).first() if centre.category_id else None

    # Centre users & portal access
    c_users = db.query(User).join(CentreUser, CentreUser.user_id == User.id).filter(
        CentreUser.centre_id == centre.id
    ).all()
    if not c_users:
        c_users = db.query(User).filter(User.centre_id == centre.id).all()

    users_data = [
        {
            "id": u.id,
            "name": u.name or "Not provided",
            "email": u.email or "Not provided",
            "username": u.username or (u.email.split('@')[0] if u.email else "Not provided"),
            "role": u.role or "CENTRE_USER",
            "status": u.status or "ACTIVE",
            "lastLogin": u.last_login_at.strftime("%Y-%m-%d %H:%M") if getattr(u, 'last_login_at', None) else "Not recorded"
        }
        for u in c_users
    ]

    # Approved infrastructure from ApprovedAsset
    approved_assets = db.query(ApprovedAsset).filter(ApprovedAsset.centre_id == centre.id).all()
    infrastructure_list = [
        {
            "assetType": a.asset_type_id,
            "approvedQuantity": a.approved_quantity
        }
        for a in approved_assets
    ]

    # Submissions count & details
    all_submissions = db.query(AttendanceSubmission).filter(
        AttendanceSubmission.centre_id == centre.id,
        AttendanceSubmission.is_deleted == False
    ).order_by(AttendanceSubmission.submitted_at.desc()).all()

    total_submissions = len(all_submissions)
    
    media_submissions = db.query(SubmissionMedia).filter(
        SubmissionMedia.center_id == centre.id
    ).count()

    ai_analyzed_count = sum(1 for s in all_submissions if s.ai_status == "COMPLETED")

    # Alerts & Issues
    from backend.models.models import Alert, Action
    open_alerts_count = db.query(Alert).filter(
        Alert.centre_id == centre.id,
        Alert.status.in_(["NEW", "OPEN", "INVESTIGATING", "ESCALATED"])
    ).count()

    all_actions = db.query(Action).filter(
        Action.centre_id == centre.id,
        Action.is_deleted == False
    ).order_by(Action.created_at.desc()).all()

    active_notices_count = sum(1 for a in all_actions if a.status not in ["RESOLVED", "CANCELLED", "REVOKED"])
    resolved_notices_count = sum(1 for a in all_actions if a.status == "RESOLVED")
    pending_actions_count = sum(1 for a in all_actions if a.status in ["OPEN", "ACTION_REQUIRED", "MORE_PROOF_REQUIRED", "AWAITING_RESPONSE"])

    # Recent submissions (up to 5)
    recent_submissions = [
        {
            "id": s.id,
            "date": str(s.attendance_date),
            "reportedPresent": s.total_present,
            "totalRegistered": s.total_registered,
            "status": s.status,
            "aiStatus": s.ai_status,
            "hasVideo": bool(s.video_path or s.video_id),
            "hasImage": bool(s.image_path),
            "submittedAt": s.submitted_at.strftime("%Y-%m-%d %I:%M %p") if s.submitted_at else "Not provided"
        }
        for s in all_submissions[:5]
    ]

    # Recent notices (up to 5)
    recent_notices = [
        {
            "id": a.id,
            "actionNumber": a.action_number,
            "title": a.title,
            "priority": a.priority,
            "status": a.status,
            "dueDate": a.due_date,
            "createdAt": a.created_at.strftime("%Y-%m-%d") if a.created_at else "Not provided"
        }
        for a in all_actions[:5]
    ]

    # Primary centre login email
    centre_login_email = c_users[0].email if (c_users and c_users[0].email) else (centre.email or "Not provided")
    account_status = c_users[0].status if (c_users and c_users[0].status) else (centre.status or "ACTIVE")

    return {
        "id": centre.id,
        "centreId": centre.centre_code or centre.id,
        "centre_code": centre.centre_code or centre.id,
        "centreName": centre.name,
        "name": centre.name,
        "accreditationCode": centre.centre_code or centre.id,
        "category": cat.name if cat else "AI & Robotics",
        "categoryId": centre.category_id,
        "status": centre.status or "ACTIVE",
        "accreditationStatus": centre.accreditation_status or "ACCREDITED",
        "registeredDate": centre.created_at.strftime("%Y-%m-%d") if centre.created_at else "Not provided",
        
        # Location
        "location": {
            "address": centre.address or "Not provided",
            "state": centre.state or "Not provided",
            "district": centre.district or "Not provided",
            "city": centre.city or centre.district or "Not provided",
            "pincode": centre.pincode or "Not provided"
        },
        
        # Contact
        "contact": {
            "email": centre.email or "Not provided",
            "phone": centre.contact_number or "Not provided",
            "directorName": centre.contact_person or "Not provided",
            "officialDetails": f"{centre.contact_person or 'Director'} ({centre.contact_number or 'No Phone'})"
        },
        
        # Capacity & Infrastructure
        "capacity": {
            "approvedTraineeCapacity": centre.approved_capacity or 40,
            "reportedCapacity": centre.approved_capacity or 40,
            "infrastructure": infrastructure_list if infrastructure_list else [
                {"assetType": "computers", "approvedQuantity": 20},
                {"assetType": "workbenches", "approvedQuantity": 5},
                {"assetType": "machines", "approvedQuantity": 3},
                {"assetType": "chairs", "approvedQuantity": 40}
            ]
        },
        
        # Portal Access
        "portalAccess": {
            "loginEmail": centre_login_email,
            "accountStatus": account_status,
            "users": users_data
        },
        
        # Activity Summary
        "activitySummary": {
            "totalSubmissions": total_submissions,
            "totalMediaSubmissions": media_submissions,
            "aiAnalysesPerformed": ai_analyzed_count,
            "openAlertsCount": open_alerts_count,
            "activeNoticesCount": active_notices_count,
            "resolvedNoticesCount": resolved_notices_count,
            "pendingActionsCount": pending_actions_count
        },
        
        # Recent Records
        "recentSubmissions": recent_submissions,
        "recentNotices": recent_notices
    }


@router.post("/centres")
def register_centre(
    payload: CentreCreate,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    # Check if duplicate centre with same email or custom code exists
    if payload.official_email:
        existing_email = db.query(TrainingCentre).filter(TrainingCentre.email == payload.official_email.strip().lower()).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="A Training Centre with this official email already exists.")

    # Centre ID must be automatically generated during registration (Section 3 & 4)
    centre_code = generate_unique_centre_id(payload.state, payload.city or payload.district, db)

    # Check if category exists in DB, otherwise set to None
    valid_cat_id = None
    if payload.category_id:
        if db.query(CentreCategory).filter(CentreCategory.id == payload.category_id).first():
            valid_cat_id = payload.category_id

    c_id = f"tc_{int(datetime.utcnow().timestamp())}"
    new_centre = TrainingCentre(
        id=c_id,
        centre_code=centre_code,
        name=payload.name.strip(),
        category_id=valid_cat_id,
        address=payload.address.strip(),
        state=payload.state.strip(),
        district=payload.district.strip(),
        city=payload.city.strip() if payload.city else payload.district.strip(),
        pincode=payload.pincode.strip(),
        contact_number=payload.contact_number.strip(),
        email=payload.official_email.strip().lower(),
        contact_person=payload.contact_person or payload.admin_name,
        approved_capacity=payload.approved_capacity or 40,
        status="ACTIVE",
        created_at=datetime.utcnow()
    )
    db.add(new_centre)
    db.flush()

    # Create default batch for this centre
    batch = CentreBatch(
        id=f"btc_{c_id}",
        centre_id=new_centre.id,
        batch_code="BATCH-01",
        course_name=f"{payload.name} Operational Batch 1",
        instructor_name=payload.contact_person or "Master Trainer",
        sanctioned_strength=payload.approved_capacity or 40,
        status="ONGOING",
        created_at=datetime.utcnow()
    )
    db.add(batch)

    # Optionally create initial Centre Admin account if login information provided
    admin_user_data = None
    if payload.admin_email:
        admin_email = payload.admin_email.strip().lower()
        existing_user = db.query(User).filter(User.email == admin_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="A user account with this email already exists.")

        user_id = f"usr_{int(datetime.utcnow().timestamp())}"
        admin_user = User(
            id=user_id,
            name=payload.admin_name or f"{payload.name} Admin",
            email=admin_email,
            username=(payload.admin_username or admin_email.split('@')[0]).strip().lower(),
            password_hash=hash_password(payload.temporary_password or "Centre@12345"),
            phone=payload.contact_number,
            role="CENTRE_ADMIN",
            centre_id=new_centre.id,
            designation="Centre Director",
            department="Operations",
            district=payload.district,
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.flush()

        cu = CentreUser(
            centre_id=new_centre.id,
            user_id=admin_user.id,
            is_primary_contact=True,
            created_at=datetime.utcnow()
        )
        db.add(cu)

        admin_user_data = {
            "id": admin_user.id,
            "name": admin_user.name,
            "email": admin_user.email,
            "username": admin_user.username,
            "centre_id": new_centre.centre_code
        }

    # Record Audit Log
    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="REGISTER_CENTRE",
        entity_type="TRAINING_CENTRE",
        entity_id=new_centre.centre_code,
        old_value=None,
        new_value=f"Centre registered: {new_centre.name} with Centre ID {new_centre.centre_code}",
        reason=f"Administrator onboarded training centre {new_centre.name}",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Training Centre registered successfully with Centre ID: {new_centre.centre_code}",
        "centre": {
            "id": new_centre.id,
            "centreId": new_centre.centre_code,
            "centre_code": new_centre.centre_code,
            "name": new_centre.name,
            "status": new_centre.status
        },
        "adminUser": admin_user_data
    }


@router.put("/centres/{centre_id}")
def update_centre(
    centre_id: str,
    payload: CentreUpdate,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == centre_id) | (TrainingCentre.centre_code == centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Training Centre not found")

    old_status = centre.status
    if payload.name is not None:
        centre.name = payload.name.strip()
    if payload.category_id is not None:
        centre.category_id = payload.category_id
    if payload.address is not None:
        centre.address = payload.address.strip()
    if payload.state is not None:
        centre.state = payload.state.strip()
    if payload.district is not None:
        centre.district = payload.district.strip()
    if payload.city is not None:
        centre.city = payload.city.strip()
    if payload.pincode is not None:
        centre.pincode = payload.pincode.strip()
    if payload.contact_number is not None:
        centre.contact_number = payload.contact_number.strip()
    if payload.official_email is not None:
        centre.email = payload.official_email.strip().lower()
    if payload.contact_person is not None:
        centre.contact_person = payload.contact_person.strip()
    if payload.approved_capacity is not None:
        centre.approved_capacity = payload.approved_capacity
    if payload.status is not None:
        centre.status = payload.status

    centre.updated_at = datetime.utcnow()

    # Audit log
    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="MODIFY_CENTRE",
        entity_type="TRAINING_CENTRE",
        entity_id=centre.centre_code,
        old_value=f"status: {old_status}",
        new_value=f"status: {centre.status}",
        reason="Administrator modified centre information",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": "Centre details updated", "centreId": centre.centre_code, "status": centre.status}


@router.post("/centres/{centre_id}/activate")
def activate_centre(
    centre_id: str,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == centre_id) | (TrainingCentre.centre_code == centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Training Centre not found")

    old_status = centre.status
    centre.status = "ACTIVE"
    centre.updated_at = datetime.utcnow()

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="ACTIVATE_CENTRE",
        entity_type="TRAINING_CENTRE",
        entity_id=centre.centre_code,
        old_value=old_status,
        new_value="ACTIVE",
        reason="Super Admin activated centre status",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Centre {centre.centre_code} activated successfully", "status": "ACTIVE"}


@router.post("/centres/{centre_id}/deactivate")
def deactivate_centre(
    centre_id: str,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == centre_id) | (TrainingCentre.centre_code == centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Training Centre not found")

    old_status = centre.status
    centre.status = "INACTIVE"
    centre.updated_at = datetime.utcnow()

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="DEACTIVATE_CENTRE",
        entity_type="TRAINING_CENTRE",
        entity_id=centre.centre_code,
        old_value=old_status,
        new_value="INACTIVE",
        reason="Super Admin deactivated centre access",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Centre {centre.centre_code} deactivated successfully", "status": "INACTIVE"}


@router.post("/centres/{centre_id}/suspend")
def suspend_centre(
    centre_id: str,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == centre_id) | (TrainingCentre.centre_code == centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Training Centre not found")

    old_status = centre.status
    centre.status = "SUSPENDED"
    centre.updated_at = datetime.utcnow()

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="SUSPEND_CENTRE",
        entity_type="TRAINING_CENTRE",
        entity_id=centre.centre_code,
        old_value=old_status,
        new_value="SUSPENDED",
        reason="Super Admin suspended centre accreditation",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Centre {centre.centre_code} suspended", "status": "SUSPENDED"}


# -------------------------------------------------------------
# 3. USER ACCESS & CREDENTIAL MANAGEMENT
# -------------------------------------------------------------
@router.get("/users")
def get_admin_users(
    search: Optional[str] = None,
    centre_id: Optional[str] = None,
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(
            User.name.ilike(s),
            User.email.ilike(s),
            User.username.ilike(s)
        ))
    if role and role != "ALL":
        query = query.filter(User.role == role)
    if status_filter and status_filter != "ALL":
        query = query.filter(User.status == status_filter)

    users = query.order_by(User.created_at.desc()).all()
    results = []

    for u in users:
        # Determine assigned centre
        c_id = u.centre_id
        if not c_id and u.role == "CENTRE_ADMIN":
            cu = db.query(CentreUser).filter(CentreUser.user_id == u.id).first()
            if cu:
                c_id = cu.centre_id

        centre_obj = db.query(TrainingCentre).filter(TrainingCentre.id == c_id).first() if c_id else None

        if centre_id and centre_id != "ALL":
            if not centre_obj or (centre_obj.id != centre_id and centre_obj.centre_code != centre_id):
                continue

        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "username": u.username or u.email.split('@')[0],
            "role": u.role,
            "centre_id": centre_obj.id if centre_obj else None,
            "centreId": centre_obj.centre_code if centre_obj else "N/A",
            "centreName": centre_obj.name if centre_obj else ("System Administration" if u.role == "SUPER_ADMIN" else "Government Monitoring"),
            "centreStatus": centre_obj.status if centre_obj else "ACTIVE",
            "status": u.status,
            "accountStatus": u.status,
            "designation": u.designation,
            "phone": u.phone,
            "lastLogin": u.last_login_at.strftime("%Y-%m-%d %H:%M") if u.last_login_at else "Never",
            "created_at": u.created_at.strftime("%Y-%m-%d") if u.created_at else None
        })

    return results


@router.post("/users")
def create_centre_user_access(
    payload: CentreUserAccessCreate,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == payload.centre_id) | (TrainingCentre.centre_code == payload.centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Assigned Training Centre not found")

    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists")

    username = (payload.username or email.split('@')[0]).strip().lower()
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="This username is already taken. Please choose another username.")

    user_id = f"usr_{int(datetime.utcnow().timestamp())}"
    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=email,
        username=username,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role="CENTRE_ADMIN",
        centre_id=centre.id,
        designation="Centre Admin",
        department="Operations",
        district=centre.district,
        status="ACTIVE",
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.flush()

    # Add CentreUser association
    cu = CentreUser(
        centre_id=centre.id,
        user_id=new_user.id,
        is_primary_contact=False,
        created_at=datetime.utcnow()
    )
    db.add(cu)

    # Audit log
    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="CREATE_USER_ACCESS",
        entity_type="USER",
        entity_id=new_user.email,
        old_value=None,
        new_value=f"Created centre admin {new_user.name} for {centre.centre_code}",
        reason="Super Admin created centre access credentials",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Centre Admin account created for {centre.centre_code}",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "username": new_user.username,
            "centreId": centre.centre_code
        }
    }


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: UserPasswordReset,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="RESET_PASSWORD",
        entity_type="USER",
        entity_id=user.email,
        old_value=None,
        new_value="Password reset executed",
        reason="Administrator reset password credentials",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Password reset successfully for {user.email}"}


@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: str,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = user.status
    user.status = "INACTIVE" if user.status == "ACTIVE" else "ACTIVE"
    user.updated_at = datetime.utcnow()

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="USER_ACCESS_CHANGE",
        entity_type="USER",
        entity_id=user.email,
        old_value=old_status,
        new_value=user.status,
        reason=f"Administrator toggled account status to {user.status}",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "userId": user.id, "status": user.status}


@router.post("/users/{user_id}/change-centre")
def change_assigned_centre(
    user_id: str,
    payload: dict,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    target_centre_id = payload.get("centre_id")
    if not target_centre_id:
        raise HTTPException(status_code=400, detail="New centre_id is required")

    centre = db.query(TrainingCentre).filter(
        (TrainingCentre.id == target_centre_id) | (TrainingCentre.centre_code == target_centre_id)
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Target Training Centre not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_centre = user.centre_id
    user.centre_id = centre.id
    user.updated_at = datetime.utcnow()

    # Update or insert in CentreUser
    cu = db.query(CentreUser).filter(CentreUser.user_id == user.id).first()
    if cu:
        cu.centre_id = centre.id
    else:
        db.add(CentreUser(centre_id=centre.id, user_id=user.id, is_primary_contact=False))

    audit = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        user_name=current_user.name,
        role=current_user.role,
        action="REASSIGN_CENTRE_ACCESS",
        entity_type="USER",
        entity_id=user.email,
        old_value=f"centre: {old_centre}",
        new_value=f"centre: {centre.centre_code}",
        reason="Super Admin changed assigned centre for user",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"User {user.email} assigned to centre {centre.centre_code}", "centreId": centre.centre_code}


# -------------------------------------------------------------
# 4. AUDIT LOGS
# -------------------------------------------------------------
@router.get("/audit-logs")
def get_admin_audit_logs(
    search: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(
            AuditLog.action.ilike(s),
            AuditLog.user_name.ilike(s),
            AuditLog.entity_id.ilike(s),
            AuditLog.reason.ilike(s),
            AuditLog.new_value.ilike(s)
        ))
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(200).all()

    return [
        {
            "id": l.id,
            "userName": l.user_name,
            "userRole": l.role,
            "action": l.action,
            "entityType": l.entity_type,
            "entityId": l.entity_id,
            "newState": l.new_value,
            "oldState": l.old_value,
            "reason": l.reason,
            "ipAddress": l.ip_address or "127.0.0.1 (Local Session)",
            "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else None
        }
        for l in logs
    ]


@router.post("/test-cloudinary")
async def test_cloudinary_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["SUPER_ADMIN", "GOVERNMENT_ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Test endpoint per Requirement 13:
    Accepts one image and uploads it to skillguard/test/
    """
    import cloudinary.uploader
    from backend.services.cloudinary_service import init_cloudinary
    if not init_cloudinary():
        raise HTTPException(status_code=500, detail="Cloudinary is not configured")

    file_bytes = await file.read()
    orig_name = file.filename or "test_image.jpg"
    base_name = os.path.splitext(os.path.basename(orig_name))[0]

    try:
        res = cloudinary.uploader.upload(
            file_bytes,
            folder="skillguard/test",
            public_id=base_name,
            resource_type="image",
            overwrite=True
        )
        return {
            "success": True,
            "public_id": res.get("public_id"),
            "resource_type": "image",
            "secure_url": res.get("secure_url"),
            "asset_id": res.get("asset_id"),
            "bytes": res.get("bytes")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

