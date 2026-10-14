from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, Float, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

# ----------------------------------------------------
# 1. AUTHENTICATION & ACCESS CONTROL
# ----------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True) # e.g. SUPER_ADMIN, GOVERNMENT_ADMIN, MONITORING_OFFICER, CENTRE_ADMIN
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role_rel")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(50), primary_key=True)
    code = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(String(50), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True) # usr_gov_admin, etc.
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30))
    role = Column(String(50), ForeignKey("roles.id"), nullable=False, index=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="SET NULL"), nullable=True, index=True)
    designation = Column(String(150))
    department = Column(String(150))
    district = Column(String(100))
    status = Column(String(30), default="ACTIVE") # ACTIVE, PENDING_APPROVAL, SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    role_rel = relationship("Role", back_populates="users")
    centre_users = relationship("CentreUser", back_populates="user")
    assigned_actions = relationship("Action", foreign_keys="Action.assigned_to", back_populates="assigned_user")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False)
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(150), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(150), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------------------
# 2. TRAINING CENTRES & AFFILIATIONS
# ----------------------------------------------------
class CentreCategory(Base):
    __tablename__ = "centre_categories"

    id = Column(String(50), primary_key=True) # cat_ai_robotics
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")
    created_by = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    centres = relationship("TrainingCentre", back_populates="category")


class TrainingCentre(Base):
    __tablename__ = "training_centres"

    id = Column(String(50), primary_key=True) # tc_001
    centre_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category_id = Column(String(50), ForeignKey("centre_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100))
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    pincode = Column(String(20))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    centre_type = Column(String(100), default="PMKVY Center of Excellence")
    contact_person = Column(String(150))
    contact_number = Column(String(50))
    email = Column(String(150))
    approved_capacity = Column(Integer, default=40)
    status = Column(String(50), default="ACTIVE", index=True) # ACTIVE, UNDER_REVIEW, FLAGGED, SUSPENDED
    accreditation_status = Column(String(50), default="ACCREDITED")
    camera_status = Column(String(50), default="ONLINE")
    last_inspection_date = Column(DateTime, nullable=True)
    next_inspection_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("CentreCategory", back_populates="centres")
    centre_users = relationship("CentreUser", back_populates="centre")
    batches = relationship("CentreBatch", back_populates="centre")
    cameras = relationship("Camera", back_populates="centre")
    attendance_submissions = relationship("AttendanceSubmission", back_populates="centre")
    alerts = relationship("Alert", back_populates="centre")
    actions = relationship("Action", back_populates="centre")
    inspections = relationship("Inspection", back_populates="centre")
    approved_assets = relationship("ApprovedAsset", back_populates="centre")
    compliance_scores = relationship("ComplianceScore", back_populates="centre")


class CentreUser(Base):
    __tablename__ = "centre_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary_contact = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="centre_users")
    user = relationship("User", back_populates="centre_users")


class CentreBatch(Base):
    __tablename__ = "centre_batches"

    id = Column(String(50), primary_key=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_code = Column(String(100), nullable=False)
    course_name = Column(String(200), nullable=False)
    instructor_name = Column(String(150))
    sanctioned_strength = Column(Integer, default=40)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String(50), default="ONGOING")
    created_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="batches")
    attendance_submissions = relationship("AttendanceSubmission", back_populates="batch")


class Trainee(Base):
    __tablename__ = "trainees"

    id = Column(String(50), primary_key=True)
    batch_id = Column(String(50), ForeignKey("centre_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    enrollment_number = Column(String(100), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------------------
# 3. CAMERAS & STREAMS
# ----------------------------------------------------
class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True) # cam_001
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    camera_code = Column(String(100), nullable=False)
    location = Column(String(150), default="Practical Lab Bay 1")
    stream_type = Column(String(50), default="RTSP")
    stream_url_encrypted = Column(String(255), nullable=False) # Encrypted
    status = Column(String(50), default="CONNECTED") # CONNECTED, DISCONNECTED, ERROR
    fps = Column(Integer, default=15)
    resolution = Column(String(50), default="1920x1080")
    bandwidth_mode = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH
    processing_mode = Column(String(50), default="EDGE_INFERENCE")
    is_simulated = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="cameras")
    health_logs = relationship("CameraHealthLog", back_populates="camera")


class CameraHealthLog(Base):
    __tablename__ = "camera_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String(50), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True)
    ping_status = Column(String(50), default="OK")
    latency_ms = Column(Float, default=24.0)
    packet_loss_percent = Column(Float, default=0.0)
    fps_measured = Column(Float, default=15.0)
    checked_at = Column(DateTime, default=datetime.utcnow)

    camera = relationship("Camera", back_populates="health_logs")


# ----------------------------------------------------
# 4. VIDEOS & LOCAL STORAGE REFERENCES
# ----------------------------------------------------
class Video(Base):
    __tablename__ = "videos"

    id = Column(String(50), primary_key=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(String(50), ForeignKey("users.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False) # Local storage path
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="video/mp4")
    duration_seconds = Column(Float, default=0.0)
    source_type = Column(String(50), default="CENTRE_UPLOAD") # CENTRE_UPLOAD, GOV_UPLOAD, BROWSER_CAPTURE, CCTV_STREAM
    created_at = Column(DateTime, default=datetime.utcnow)

    attendance_submissions = relationship("AttendanceSubmission", back_populates="video")
    ai_results = relationship("AttendanceAIResult", back_populates="video")


class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(String(50), primary_key=True)
    video_id = Column(String(50), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    submission_id = Column(String(50), nullable=True)
    video_path = Column(String(500), nullable=True)
    model_version = Column(String(50), default="v1.4.0")
    status = Column(String(50), default="QUEUED") # QUEUED, PROCESSING, COMPLETED, FAILED, REVIEW_REQUIRED
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    analysis_results = Column(JSON, nullable=True)

    detections = relationship("AIDetection", back_populates="job", cascade="all, delete-orphan")


class AIDetection(Base):
    __tablename__ = "ai_detections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    processing_job_id = Column(String(50), ForeignKey("video_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    frame_number = Column(Integer, default=0)
    timestamp = Column(Float, default=0.0)
    class_name = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.9)
    x1 = Column(Float, default=0.0)
    y1 = Column(Float, default=0.0)
    x2 = Column(Float, default=0.0)
    y2 = Column(Float, default=0.0)
    track_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("VideoJob", back_populates="detections")



class VideoSnapshot(Base):
    __tablename__ = "video_snapshots"

    id = Column(String(50), primary_key=True)
    video_id = Column(String(50), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    frame_path = Column(String(500), nullable=False)
    timestamp_seconds = Column(Float, default=0.0)
    alert_id = Column(String(50), ForeignKey("alerts.id"), nullable=True)
    captured_by = Column(String(50), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------------------
# 5. ATTENDANCE & AI RESULTS
# ----------------------------------------------------
class AttendanceSubmission(Base):
    __tablename__ = "attendance_submissions"

    id = Column(String(50), primary_key=True) # att_001
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(50), ForeignKey("centre_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    submitted_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    session_name = Column(String(100), default="Morning (09:00 - 12:00)")
    start_time = Column(String(50), default="10:00 AM")
    end_time = Column(String(50), default="01:00 PM")
    instructor_name = Column(String(150))
    total_registered = Column(Integer, default=40)
    total_present = Column(Integer, default=40)
    total_absent = Column(Integer, default=0)
    infrastructure_reported = Column(JSON, nullable=True)
    infrastructure_status = Column(String(50), default="SUFFICIENT")
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True)
    video_path = Column(String(500), nullable=True)
    video_original_name = Column(String(255), nullable=True)
    video_size = Column(Integer, default=0)
    image_path = Column(String(500), nullable=True)
    image_original_name = Column(String(255), nullable=True)
    image_size = Column(Integer, default=0)
    image_ai_result_json = Column(JSON, nullable=True)
    status = Column(String(50), default="SUBMITTED") # SUBMITTED, VERIFIED, DISCREPANCY_WARNING, DISCREPANCY_CRITICAL, REMOVED, ARCHIVED
    ai_status = Column(String(50), default="NOT_STARTED") # NOT_STARTED, PENDING, PROCESSING, COMPLETED, FAILED
    ai_started_at = Column(DateTime, nullable=True)
    ai_completed_at = Column(DateTime, nullable=True)
    ai_detected_people = Column(Integer, nullable=True)
    ai_result_json = Column(JSON, nullable=True)
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(100), nullable=True)
    deletion_reason = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="attendance_submissions")
    batch = relationship("CentreBatch", back_populates="attendance_submissions")
    video = relationship("Video", back_populates="attendance_submissions")
    ai_result = relationship("AttendanceAIResult", back_populates="submission", uselist=False)
    media_items = relationship("SubmissionMedia", back_populates="submission", cascade="all, delete-orphan")


class SubmissionMedia(Base):
    __tablename__ = "submission_media"

    id = Column(String(50), primary_key=True)
    submission_id = Column(String(50), ForeignKey("attendance_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    center_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type = Column(String(20), nullable=False) # 'VIDEO' or 'IMAGE'
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    mime_type = Column(String(100), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    cloudinary_public_id = Column(String(255), nullable=True)
    cloudinary_asset_id = Column(String(100), nullable=True)
    cloudinary_url = Column(String(500), nullable=True)
    secure_url = Column(String(500), nullable=True)
    resource_type = Column(String(50), nullable=True)
    format = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("AttendanceSubmission", back_populates="media_items")
    centre = relationship("TrainingCentre")


class AttendanceAIResult(Base):
    __tablename__ = "attendance_ai_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attendance_submission_id = Column(String(50), ForeignKey("attendance_submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True)
    model_version_id = Column(String(50), nullable=False) # e.g. v1.4.0
    estimated_people = Column(Integer, nullable=False)
    confidence = Column(Float, default=0.94)
    variance_count = Column(Integer, default=0) # reported - estimated
    variance_percentage = Column(Float, default=0.0)
    status = Column(String(50), default="MATCH") # MATCH, WARNING, CRITICAL
    processed_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("AttendanceSubmission", back_populates="ai_result")
    video = relationship("Video", back_populates="ai_results")


# ----------------------------------------------------
# 6. INFRASTRUCTURE & ASSETS
# ----------------------------------------------------
class AssetType(Base):
    __tablename__ = "asset_types"

    id = Column(String(50), primary_key=True) # computers, machines, workbenches, chairs, cctv
    name = Column(String(150), nullable=False)
    category = Column(String(100), default="EQUIPMENT")
    description = Column(String(255))
    is_model_trained = Column(Boolean, default=False) # Only 'person' is trained in dataset
    notes = Column(String(255))
    active = Column(Boolean, default=True)


class ApprovedAsset(Base):
    __tablename__ = "approved_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type_id = Column(String(50), ForeignKey("asset_types.id"), nullable=False)
    approved_quantity = Column(Integer, default=0)

    centre = relationship("TrainingCentre", back_populates="approved_assets")
    asset_type = relationship("AssetType")


class DetectedAsset(Base):
    __tablename__ = "detected_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True)
    asset_type_id = Column(String(50), ForeignKey("asset_types.id"), nullable=False)
    detected_quantity = Column(Integer, default=0)
    apparent_operability = Column(String(100), default="Operational")
    confidence = Column(Float, default=0.9)
    detected_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------------------
# 7. AI MODELS, DATASETS & METRICS
# ----------------------------------------------------
class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    architecture = Column(String(100), default="YOLOv8m")
    description = Column(Text)
    active_version_id = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    versions = relationship("ModelVersion", back_populates="model")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(50), primary_key=True) # v1.4.0
    model_id = Column(String(50), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(50), nullable=False)
    model_path = Column(String(255), default="ml/models/best.pt")
    dataset_version = Column(String(100), default="classroom-people-number.v1i.yolov8")
    precision = Column(Float, default=0.924)
    recall = Column(Float, default=0.898)
    f1_score = Column(Float, default=0.911)
    map50 = Column(Float, default=0.942)
    map50_95 = Column(Float, default=0.817)
    latency_ms = Column(Float, default=14.2)
    classes_trained = Column(JSON, default=list) # ["person"]
    status = Column(String(50), default="ACTIVE") # TRAINING, EVALUATED, APPROVED, ACTIVE, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AIModel", back_populates="versions")


# ----------------------------------------------------
# 8. ALERTS & EVIDENCE
# ----------------------------------------------------
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True) # alt_001
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True)
    category = Column(String(100), default="ATTENDANCE_MISMATCH")
    severity = Column(String(50), default="CRITICAL", index=True) # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    detected_time = Column(String(50))
    submitted_value = Column(Integer, default=0)
    ai_value = Column(Integer, default=0)
    variance = Column(Integer, default=0)
    ai_confidence = Column(Float, default=0.94)
    status = Column(String(50), default="NEW", index=True) # NEW, ACTION_CREATED, INVESTIGATING, RESOLVED, DISMISSED
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(100), nullable=True)
    deletion_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    # Infrastructure Movement / Asset Count Reduction Detection attributes
    submission_id = Column(String(50), nullable=True, index=True)
    asset_type = Column(String(100), nullable=True)
    approved_count = Column(Integer, nullable=True)
    detected_count = Column(Integer, nullable=True)
    difference = Column(Integer, nullable=True)
    event_timestamp = Column(String(50), nullable=True)
    ai_analysis_id = Column(String(100), nullable=True)
    evidence_clip_url = Column(String(500), nullable=True)
    evidence_clip_public_id = Column(String(255), nullable=True)

    centre = relationship("TrainingCentre", back_populates="alerts")
    evidence = relationship("AlertEvidence", back_populates="alert", uselist=False)
    actions = relationship("Action", back_populates="alert")


class AlertEvidence(Base):
    __tablename__ = "alert_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(50), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, unique=True)
    snapshot_url = Column(String(500), nullable=False)
    model_version = Column(String(50), default="v1.4.0")
    detected_count = Column(Integer, default=0)
    expected_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.94)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Evidence clip fields
    video_clip_url = Column(String(500), nullable=True)
    video_clip_public_id = Column(String(255), nullable=True)
    start_timestamp = Column(Float, nullable=True)
    end_timestamp = Column(Float, nullable=True)
    duration = Column(Float, nullable=True)
    resource_type = Column(String(50), default="video")
    event_timestamp = Column(String(50), nullable=True)
    submission_id = Column(String(50), nullable=True)
    center_id = Column(String(50), nullable=True)

    alert = relationship("Alert", back_populates="evidence")


# ----------------------------------------------------
# 9. ACTIONS, TIMELINE & VERIFICATION
# ----------------------------------------------------
class Action(Base):
    __tablename__ = "actions"

    id = Column(String(50), primary_key=True) # act_001
    action_number = Column(String(100), nullable=False)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_id = Column(String(50), ForeignKey("alerts.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="CRITICAL", index=True) # CRITICAL, HIGH, MEDIUM
    status = Column(String(50), default="ACTION_ASSIGNED", index=True) # ACTION_ASSIGNED, IN_PROGRESS, SUBMITTED_FOR_VERIFICATION, RESOLVED, REOPENED, ESCALATED, CANCELLED
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(100), nullable=True)
    deletion_reason = Column(Text, nullable=True)
    assigned_to = Column(String(50), ForeignKey("users.id"), nullable=True)
    assigned_officer_name = Column(String(150), default="Rajesh Sharma")
    due_date = Column(String(50), nullable=False)
    is_overdue = Column(Boolean, default=False)
    created_by = Column(String(50), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    centre = relationship("TrainingCentre", back_populates="actions")
    alert = relationship("Alert", back_populates="actions")
    assigned_user = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_actions")
    timeline = relationship("ActionTimeline", back_populates="action")
    response = relationship("ActionResponse", back_populates="action", uselist=False)
    verification = relationship("ActionVerification", back_populates="action", uselist=False)


class ActionTimeline(Base):
    __tablename__ = "action_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action_id = Column(String(50), ForeignKey("actions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    performed_by = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    action = relationship("Action", back_populates="timeline")


class ActionResponse(Base):
    __tablename__ = "action_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action_id = Column(String(50), ForeignKey("actions.id", ondelete="CASCADE"), nullable=False, unique=True)
    submitted_by = Column(String(150), nullable=False)
    explanation = Column(Text, nullable=False)
    proof_document_name = Column(String(255))
    proof_photo_url = Column(String(500))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    ai_analysis_json = Column(JSON, nullable=True)
    ai_status = Column(String(50), default="NOT_STARTED")
    ai_completed_at = Column(DateTime, nullable=True)
    ai_detected_people = Column(Integer, nullable=True)

    action = relationship("Action", back_populates="response")


class ActionVerification(Base):
    __tablename__ = "action_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action_id = Column(String(50), ForeignKey("actions.id", ondelete="CASCADE"), nullable=False, unique=True)
    outcome = Column(String(50), nullable=False) # RESOLVED, REJECTED, MORE_INFO_REQUESTED, ESCALATED
    mandatory_remarks = Column(Text, nullable=False)
    verified_by = Column(String(150), nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow)
    
    # Audit trail & determination link columns
    center_id = Column(String(50), nullable=True)
    notice_id = Column(String(50), nullable=True)
    response_id = Column(Integer, nullable=True)
    officer_id = Column(String(50), nullable=True)
    determination_decision = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    action = relationship("Action", back_populates="verification")


# ----------------------------------------------------
# 10. INSPECTIONS
# ----------------------------------------------------
class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True) # insp_001
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_type = Column(String(100), default="AI Triggered") # Routine, Surprise, AI Triggered, Re-Inspection
    reason = Column(Text, nullable=False)
    assigned_officer = Column(String(150), nullable=False)
    scheduled_date = Column(String(50), nullable=False)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    outcome = Column(String(50), nullable=True) # PASS, FAIL, CONDITIONAL, REINSPECTION_REQUIRED
    findings = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="inspections")


# ----------------------------------------------------
# 11. COMPLIANCE SCORES & RULES
# ----------------------------------------------------
class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(String(50), primary_key=True)
    rule_name = Column(String(150), nullable=False)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(50), default="CRITICAL")
    threshold_percent = Column(Float, default=10.0)
    sla_hours = Column(Integer, default=72)
    reminder_hours = Column(Integer, default=24)
    escalation_hours = Column(Integer, default=96)
    weight_attendance = Column(Float, default=40.0)
    weight_infrastructure = Column(Float, default=35.0)
    weight_actions = Column(Float, default=25.0)
    active = Column(Boolean, default=True)


class ComplianceScore(Base):
    __tablename__ = "compliance_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(String(50), ForeignKey("training_centres.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Float, default=85.0)
    attendance_score = Column(Float, default=85.0)
    infrastructure_score = Column(Float, default=85.0)
    action_score = Column(Float, default=85.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    centre = relationship("TrainingCentre", back_populates="compliance_scores")


# ----------------------------------------------------
# 12. NOTIFICATIONS & TEMPLATES
# ----------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="INFO")
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(String(50), primary_key=True)
    template_type = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ----------------------------------------------------
# 13. SYSTEM SETTINGS & AUDIT LOGS
# ----------------------------------------------------
class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(String(255), nullable=False)
    setting_type = Column(String(50), default="INTEGER") # INTEGER, FLOAT, BOOLEAN, STRING
    description = Column(String(255))
    updated_by = Column(String(150), default="SUPER_ADMIN")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(150), default="System")
    role = Column(String(50), default="SYSTEM")
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
