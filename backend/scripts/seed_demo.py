import os
import sys
from datetime import datetime, timedelta
import bcrypt
from dotenv import load_dotenv

# Ensure root directory is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

load_dotenv(os.path.join(root_dir, ".env"))

from backend.database import SessionLocal, Base
from backend.models.models import (
    Role, User, TrainingCentre, CentreCategory, CentreBatch,
    CentreUser, AssetType, ApprovedAsset, AuditLog
)

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_demo():
    print("=" * 70)
    print("SKILLGUARD AI - SEEDING DEVELOPMENT / DEMO DATA (MySQL 8.0+)")
    print("=" * 70)

    db = SessionLocal()

    try:
        # 1. Statutory Roles
        print("[*] Ensuring statutory roles exist...")
        roles_data = [
            ("SUPER_ADMIN", "Super Administrator", "National Vigilance Commissioners & Root Admins"),
            ("GOVERNMENT_ADMIN", "Government Administrator", "Joint Directors & State Directorate Heads"),
            ("MONITORING_OFFICER", "Monitoring Officer", "Field & District Monitoring Officers"),
            ("CENTRE_ADMIN", "Training Centre Administrator", "Accredited Centre Heads & Operations Directors")
        ]
        for r_id, r_name, r_desc in roles_data:
            existing_role = db.query(Role).filter(Role.id == r_id).first()
            if not existing_role:
                db.add(Role(id=r_id, name=r_name, description=r_desc))
        db.flush()

        # 2. Centre Category
        print("[*] Ensuring standard categories exist...")
        cat_id = "cat_ai_robotics"
        cat = db.query(CentreCategory).filter(CentreCategory.id == cat_id).first()
        if not cat:
            cat = CentreCategory(
                id=cat_id,
                name="AI & Robotics",
                description="Artificial Intelligence, Automation & Robotics Training",
                status="ACTIVE"
            )
            db.add(cat)
            db.flush()

        # 3. Demo Admin User (Section 2)
        # Email: admin@skillguard.ai | Password: Admin@12345 | Role: ADMIN (SUPER_ADMIN)
        print("[*] Seeding Demo Admin User (admin@skillguard.ai)...")
        demo_admin_email = "admin@skillguard.ai"
        admin_user = db.query(User).filter(User.email == demo_admin_email).first()
        if not admin_user:
            admin_user = User(
                id="usr_demo_admin",
                name="System Administrator",
                email=demo_admin_email,
                username="admin",
                password_hash=hash_pw("Admin@12345"),
                phone="+91 99999 11111",
                role="SUPER_ADMIN",
                centre_id=None,
                designation="National Vigilance Director",
                department="Ministry of Skill Development & Entrepreneurship",
                district="National HQ",
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
        else:
            admin_user.password_hash = hash_pw("Admin@12345")
            admin_user.role = "SUPER_ADMIN"
            admin_user.status = "ACTIVE"
        db.flush()

        # 4. Demo Government User (Section 2)
        # Email: government@skillguard.ai | Password: Gov@12345 | Role: GOVERNMENT (GOVERNMENT_ADMIN)
        print("[*] Seeding Demo Government User (government@skillguard.ai)...")
        demo_gov_email = "government@skillguard.ai"
        gov_user = db.query(User).filter(User.email == demo_gov_email).first()
        if not gov_user:
            gov_user = User(
                id="usr_demo_government",
                name="Dr. Alok Verma",
                email=demo_gov_email,
                username="government",
                password_hash=hash_pw("Gov@12345"),
                phone="+91 98110 54321",
                role="GOVERNMENT_ADMIN",
                centre_id=None,
                designation="State Monitoring Officer",
                department="State Directorate of Vocational Training",
                district="Pune",
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(gov_user)
        else:
            gov_user.password_hash = hash_pw("Gov@12345")
            gov_user.role = "GOVERNMENT_ADMIN"
            gov_user.status = "ACTIVE"
        db.flush()

        # 5. Demo Training Centre (Section 2 & 13)
        # Centre Name: Demo Skill Training Centre
        # Centre ID: DEMO-TC-0001
        # Category: AI & Robotics
        # Status: ACTIVE
        print("[*] Seeding Demo Training Centre (DEMO-TC-0001)...")
        demo_centre_code = "DEMO-TC-0001"
        centre = db.query(TrainingCentre).filter(TrainingCentre.centre_code == demo_centre_code).first()
        if not centre:
            centre = TrainingCentre(
                id="tc_demo_001",
                centre_code=demo_centre_code,
                name="Demo Skill Training Centre",
                category_id=cat.id,
                address="Survey No. 45, Hinjewadi IT Park Phase 1",
                city="Pune",
                district="Pune",
                state="Maharashtra",
                pincode="411057",
                contact_person="Ramesh Patil",
                contact_number="+91 98220 98765",
                email="centre@skillguard.ai",
                approved_capacity=40,
                status="ACTIVE",
                accreditation_status="ACCREDITED",
                camera_status="ONLINE",
                created_at=datetime.utcnow()
            )
            db.add(centre)
            db.flush()
        else:
            centre.name = "Demo Skill Training Centre"
            centre.status = "ACTIVE"
            centre.category_id = cat.id

        # Create / Ensure Batch for Demo Centre
        batch = db.query(CentreBatch).filter(CentreBatch.centre_id == centre.id).first()
        if not batch:
            batch = CentreBatch(
                id=f"btc_{centre.id}",
                centre_id=centre.id,
                batch_code="AI-101",
                course_name="Industrial Automation & Embedded Systems",
                instructor_name="Ramesh Patil",
                sanctioned_strength=40,
                status="ONGOING",
                created_at=datetime.utcnow()
            )
            db.add(batch)
            db.flush()

        # 6. Demo Centre Admin User (Section 2 & 13)
        # Email: centre@skillguard.ai | Password: Centre@12345 | Role: CENTRE (CENTRE_ADMIN)
        print("[*] Seeding Demo Centre Admin User (centre@skillguard.ai)...")
        demo_centre_email = "centre@skillguard.ai"
        centre_user = db.query(User).filter(User.email == demo_centre_email).first()
        if not centre_user:
            centre_user = User(
                id="usr_demo_centre_admin",
                name="Ramesh Patil",
                email=demo_centre_email,
                username="centre",
                password_hash=hash_pw("Centre@12345"),
                phone="+91 98220 98765",
                role="CENTRE_ADMIN",
                centre_id=centre.id,
                designation="Centre Director",
                department="Training Operations",
                district="Pune",
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(centre_user)
            db.flush()
        else:
            centre_user.password_hash = hash_pw("Centre@12345")
            centre_user.role = "CENTRE_ADMIN"
            centre_user.centre_id = centre.id
            centre_user.status = "ACTIVE"

        # Link CentreUser table
        cu = db.query(CentreUser).filter(
            CentreUser.centre_id == centre.id,
            CentreUser.user_id == centre_user.id
        ).first()
        if not cu:
            db.add(CentreUser(
                centre_id=centre.id,
                user_id=centre_user.id,
                is_primary_contact=True,
                created_at=datetime.utcnow()
            ))

        db.commit()

        print("=" * 70)
        print("DEMO CREDENTIALS SUCCESSFULLY SEEDED:")
        print("  1. Government Portal:")
        print("     Email:       government@skillguard.ai")
        print("     Password:    Gov@12345")
        print("     Role:        GOVERNMENT_ADMIN")
        print("  2. Training Centre Portal:")
        print("     Email:       centre@skillguard.ai")
        print("     Password:    Centre@12345")
        print("     Centre ID:   DEMO-TC-0001")
        print("     Centre Name: Demo Skill Training Centre")
        print("  3. Admin Portal:")
        print("     Email:       admin@skillguard.ai")
        print("     Password:    Admin@12345")
        print("     Role:        SUPER_ADMIN")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding demo data failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
