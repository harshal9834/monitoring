import os
import sys
import shutil
import bcrypt
from datetime import datetime
from dotenv import load_dotenv

# Ensure the root directory is on the python search path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

load_dotenv(os.path.join(root_dir, ".env"))

from backend.database import SessionLocal, engine, Base
from backend.models.models import (
    Role, Permission, RolePermission, User, TrainingCentre, CentreUser,
    AttendanceSubmission, Video, VideoJob, VideoSnapshot, AIDetection,
    AttendanceAIResult, Alert, AlertEvidence, Action, ActionTimeline,
    ActionResponse, ActionVerification, AuditLog, Notification,
    Camera, CameraHealthLog, CentreBatch, Trainee, AssetType,
    ApprovedAsset, DetectedAsset, ComplianceRule, ComplianceScore,
    SystemSetting, ModelVersion, AIModel, Inspection, EmailVerification,
    PasswordReset, Session as UserSession
)

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def reset_database():
    print("=" * 70)
    print("SKILLGUARD AI - PRISTINE DATABASE RESET & BOOTSTRAP INITIALIZATION")
    print("=" * 70)

    admin_name = os.getenv("BOOTSTRAP_ADMIN_NAME", "Super Administrator")
    admin_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "superadmin@skillguard.gov.in")
    admin_username = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "superadmin")
    admin_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "SuperAdmin@2026")

    print(f"[*] Target Administrator: {admin_email} (Username: {admin_username})")
    print("[*] Connecting to MySQL database...")

    db = SessionLocal()

    try:
        # Step 1: Wipe all table contents respecting foreign keys
        print("[*] Purging all existing application tables...")
        from sqlalchemy import text
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(text(f"TRUNCATE TABLE `{table.name}`;"))
            print(f"    - Truncated table `{table.name}`")
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.commit()
        print("[OK] All tables cleanly truncated.")

        # Step 2: Seed Statutory Roles
        print("[*] Seeding required statutory system roles...")
        statutory_roles = [
            Role(
                id="SUPER_ADMIN",
                name="Super Administrator",
                description="Root System Administrator & National Vigilance Commissioner"
            ),
            Role(
                id="GOVERNMENT_ADMIN",
                name="Government Administrator",
                description="Joint Directors & State Directorate Monitoring Heads"
            ),
            Role(
                id="MONITORING_OFFICER",
                name="Monitoring Officer",
                description="District & Field Monitoring Verification Officers"
            ),
            Role(
                id="CENTRE_ADMIN",
                name="Training Centre Administrator",
                description="Accredited Training Centre In-Charge & Operations Admin"
            )
        ]
        db.add_all(statutory_roles)
        db.flush()
        print(f"[OK] {len(statutory_roles)} statutory roles created.")

        # Step 3: Seed Single Bootstrap Super Administrator
        print(f"[*] Creating bootstrap Super Administrator ({admin_email})...")
        bootstrap_admin = User(
            id="usr_bootstrap_superadmin",
            name=admin_name,
            email=admin_email,
            username=admin_username,
            password_hash=hash_pw(admin_password),
            phone="+91 99999 00001",
            role="SUPER_ADMIN",
            centre_id=None,
            designation="National Vigilance Director",
            department="Ministry of Skill Development & Entrepreneurship",
            district="National HQ",
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(bootstrap_admin)
        db.flush()

        # Record bootstrap audit log entry
        audit_entry = AuditLog(
            id="audit_system_bootstrap_001",
            user_id=bootstrap_admin.id,
            user_name=bootstrap_admin.name,
            role=bootstrap_admin.role,
            action="SYSTEM_BOOTSTRAP",
            entity_type="SYSTEM",
            entity_id="ROOT",
            reason="Pristine system reset and administrator bootstrap",
            ip_address="127.0.0.1",
            created_at=datetime.utcnow()
        )
        db.add(audit_entry)
        db.commit()
        print("[OK] Bootstrap Super Administrator created successfully.")

        # Step 4: Clean file storage submissions & captures
        print("[*] Cleaning physical storage directories...")
        storage_base = os.path.join(root_dir, "storage")
        cleanup_targets = [
            os.path.join(storage_base, "captures"),
            os.path.join(storage_base, "evidence"),
            os.path.join(storage_base, "notices"),
            os.path.join(storage_base, "reports"),
            os.path.join(storage_base, "temp"),
            os.path.join(storage_base, "uploads"),
            os.path.join(storage_base, "videos", "submissions")
        ]

        for folder in cleanup_targets:
            if os.path.exists(folder):
                for item in os.listdir(folder):
                    item_path = os.path.join(folder, item)
                    try:
                        if os.path.isfile(item_path):
                            os.unlink(item_path)
                        elif os.path.isdir(item_path):
                            shutil.rmtree(item_path)
                    except Exception as e:
                        print(f"    - Warning: could not delete {item_path}: {e}")
                print(f"    - Cleared folder: {os.path.relpath(folder, root_dir)}")
            else:
                os.makedirs(folder, exist_ok=True)
                print(f"    - Created folder: {os.path.relpath(folder, root_dir)}")

        # Step 5: Verification check
        user_count = db.query(User).count()
        tc_count = db.query(TrainingCentre).count()
        sub_count = db.query(AttendanceSubmission).count()
        alert_count = db.query(Alert).count()
        notice_count = db.query(Action).count()

        print("=" * 70)
        print("VERIFICATION OF PRISTINE DATABASE STATE:")
        print(f"  - Total Users:            {user_count} (Only bootstrap admin: {admin_email})")
        print(f"  - Total Training Centres: {tc_count} (Pristine zero state)")
        print(f"  - Total Submissions:      {sub_count} (Pristine zero state)")
        print(f"  - Total Alerts/Issues:    {alert_count} (Pristine zero state)")
        print(f"  - Total Notices/Actions:  {notice_count} (Pristine zero state)")
        print("=" * 70)
        print("[SUCCESS] Database reset complete and ready for clean production testing.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database reset failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
