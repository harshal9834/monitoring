from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

# --- Auth Schemas ---
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    centre_id: Optional[str] = None
    password: str
    portal_type: str # government, centre, admin

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: str
    centre_code: Optional[str] = None
    centre_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    district: Optional[str] = None

# --- Training Centre Schemas ---
class CentreCreate(BaseModel):
    name: str
    code: Optional[str] = None
    category_id: Optional[str] = "cat_ai_robotics"
    address: str
    state: str
    district: str
    city: str
    pincode: str
    contact_number: str
    official_email: str
    contact_person: Optional[str] = None
    approved_capacity: int = 40
    approved_infrastructure: Optional[str] = None
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    admin_username: Optional[str] = None
    temporary_password: Optional[str] = None

class CentreUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    contact_number: Optional[str] = None
    official_email: Optional[str] = None
    contact_person: Optional[str] = None
    approved_capacity: Optional[int] = None
    status: Optional[str] = None

class CentreUserAccessCreate(BaseModel):
    centre_id: str
    name: str
    email: str
    username: Optional[str] = None
    password: str
    phone: Optional[str] = None

class UserPasswordReset(BaseModel):
    new_password: str

# --- Attendance Schemas ---
class AttendanceSubmit(BaseModel):
    centre_id: Optional[str] = None
    batch_code: Optional[str] = "AI-102"
    course_name: Optional[str] = "Vocational Course"
    date: str
    session_start: str = "09:00 AM"
    session_end: str = "01:00 PM"
    instructor_name: Optional[str] = "Trainer"
    reported_trainees: Optional[int] = 40
    total_registered: Optional[int] = 40
    total_present: Optional[int] = 40
    total_absent: Optional[int] = 0
    infrastructure_reported: Optional[Any] = None
    ai_estimated_count: Optional[int] = None
    video_id: Optional[str] = None

# --- Action & Notice Schemas ---
class ActionCreate(BaseModel):
    centre_id: str
    alert_id: Optional[str] = None
    title: str
    description: str
    priority: str = "HIGH"
    due_date: str

class NoticeCreate(BaseModel):
    centre_id: str
    issue_id: Optional[str] = None
    alert_id: Optional[str] = None
    notice_type: Optional[str] = "ATTENDANCE_DISCREPANCY_NOTICE"
    title: str
    description: str
    priority: Optional[str] = "HIGH"
    days_allowed: Optional[int] = 3
    required_action: Optional[str] = "Submit formal remediation explanation and evidence"
    deadline: Optional[str] = None
    assigned_officer: Optional[str] = None

class IssueReviewSubmit(BaseModel):
    action: str # CONFIRM_ISSUE, MARK_FALSE_POSITIVE, FALSE_POSITIVE, REQUIRES_VERIFICATION
    notes: Optional[str] = None
    remarks: Optional[str] = None
    recommended_action: Optional[str] = None
    severity: Optional[str] = "HIGH"

class ActionResponseSubmit(BaseModel):
    explanation: str
    proof_document_name: Optional[str] = None
    proof_photo_url: Optional[str] = None

class ActionVerificationSubmit(BaseModel):
    outcome: str # APPROVED, REJECTED, REINSPECTION_REQUESTED
    mandatory_remarks: str

# --- Alert Schemas ---
class AlertCreate(BaseModel):
    centre_id: str
    category: str
    severity: str
    title: str
    description: str
    submitted_value: int
    ai_value: int
    camera_id: Optional[str] = None
    snapshot_url: Optional[str] = None

# --- Inspection Schemas ---
class InspectionCreate(BaseModel):
    centre_id: str
    inspection_type: str
    reason: str
    assigned_officer: str
    scheduled_date: str
    notes: Optional[str] = None

class InspectionComplete(BaseModel):
    outcome: str
    findings: str

# --- System Settings Schema ---
class SystemSettingsUpdate(BaseModel):
    compliance_weight_attendance: Optional[int] = None
    compliance_weight_infrastructure: Optional[int] = None
    compliance_weight_actions: Optional[int] = None
    attendance_warning_threshold: Optional[int] = None
    attendance_critical_threshold: Optional[int] = None
    low_bandwidth_mode: Optional[bool] = None
    default_detection_fps: Optional[int] = None
    auto_escalation_days: Optional[int] = None

# --- Deletion / Removal Schemas ---
class DeletionRequest(BaseModel):
    reason: Optional[str] = "Removed by authorized user"
    notes: Optional[str] = None
