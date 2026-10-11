import os
import sys
from datetime import datetime
import bcrypt
from dotenv import load_dotenv

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

load_dotenv(os.path.join(root_dir, ".env"))

from backend.database import engine, SessionLocal, Base
from backend.models.models import (
    Role, User, TrainingCentre, CentreCategory, CentreBatch,
    CentreUser, AssetType, ApprovedAsset, AuditLog
)


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def init_db():
    print("=" * 70)
    print("SKILLGUARD AI - PRODUCTION DATABASE INITIALIZATION & SCHEMA SETUP")
    print("=" * 70)

    # 1. Create tables if not exist (non-destructive)
    print("[*] Creating database tables (IF NOT EXISTS)...")
    try:
        from backend.models import models
        Base.metadata.create_all(bind=engine)
        print("[+] Tables checked/created successfully.")
    except Exception as e:
        print(f"[!] Warning during table creation: {e}")
        print("    If tables already exist, continuing with data verification...")

    db = SessionLocal()

    try:
        # 2. Statutory Roles
        print("[*] Verifying statutory roles...")
        roles_data = [
            ("SUPER_ADMIN", "Super Administrator", "National Vigilance Commissioners & Root Admins"),
            ("GOVERNMENT_ADMIN", "Government Administrator", "Joint Directors & State Directorate Heads"),
            ("MONITORING_OFFICER", "Monitoring Officer", "Field & District Monitoring Officers"),
            ("CENTRE_ADMIN", "Training Centre Administrator", "Accredited Centre Heads & Operations Directors")
        ]
        for r_id, r_name, r_desc in roles_data:
            existing_role = db.query(Role).filter(Role.id == r_id).first()
            if not existing_role:
                db.add(Role(id=r_id, name=r_name, description=r_desc, created_at=datetime.utcnow()))
        db.commit()
        print("[+] Statutory roles verified.")

        # 3. Centre Categories
        categories_data = [
            ("cat_eng", "Automotive & Heavy Machinery", "CNC, Lathe, Fabrication, Assembly"),
            ("cat_it", "Information Technology & Electronics", "Hardware, Networking, Embedded, VLSI"),
            ("cat_textile", "Textile & Apparel Design", "Industrial Sewing, Quality Inspection, Pattern Making"),
            ("cat_health", "Healthcare & Paramedical", "Patient Care, Diagnostic Assistant, Emergency Aid")
        ]
        for c_id, c_name, c_desc in categories_data:
            existing_cat = db.query(CentreCategory).filter(CentreCategory.id == c_id).first()
            if not existing_cat:
                db.add(CentreCategory(id=c_id, name=c_name, description=c_desc))
        db.commit()

        # 4. Demo Training Centre
        tc_demo = db.query(TrainingCentre).filter(
            (TrainingCentre.id == "tc_demo_001") | (TrainingCentre.centre_code == "DEMO-TC-0001")
        ).first()
        if not tc_demo:
            tc_demo = TrainingCentre(
                id="tc_demo_001",
                centre_code="DEMO-TC-0001",
                name="Demo Skill Training Centre",
                category_id="cat_eng",
                address="Sector 42, Knowledge Park III",
                state="Maharashtra",
                district="Pune",
                city="Pune",
                pincode="411001",
                contact_person="Ramesh Patil (Director)",
                phone="+91-98220-11223",
                email="director@demo-training.org",
                approved_capacity=40,
                status="ACTIVE",
                risk_level="MEDIUM",
                created_at=datetime.utcnow()
            )
            db.add(tc_demo)
            db.commit()

        # 5. Core Users
        users_data = [
            {
                "id": "usr_demo_admin",
                "name": "Super Administrator (Vigilance)",
                "email": "admin@skillguard.ai",
                "password": hash_pw("Admin@12345"),
                "role": "SUPER_ADMIN",
                "centre_id": None,
                "designation": "Chief Vigilance Commissioner",
                "department": "National Skill Development Vigilance Directorate"
            },
            {
                "id": "usr_demo_government",
                "name": "Dr. Rajeshwar Sharma, IAS",
                "email": "government@skillguard.ai",
                "password": hash_pw("Gov@12345"),
                "role": "GOVERNMENT_ADMIN",
                "centre_id": None,
                "designation": "Joint Director & State Monitoring Head",
                "department": "Department of Skill Development & Entrepreneurship"
            },
            {
                "id": "usr_demo_centre_admin",
                "name": "Ramesh Patil",
                "email": "centre@skillguard.ai",
                "password": hash_pw("Centre@12345"),
                "role": "CENTRE_ADMIN",
                "centre_id": tc_demo.id,
                "designation": "Centre Operations Director",
                "department": "Vocational Training Operations"
            }
        ]

        for u in users_data:
            existing_user = db.query(User).filter(User.email == u["email"]).first()
            if not existing_user:
                new_u = User(
                    id=u["id"],
                    name=u["name"],
                    email=u["email"],
                    username=u["email"].split("@")[0],
                    password_hash=u["password"],
                    role=u["role"],
                    centre_id=u["centre_id"],
                    designation=u["designation"],
                    department=u["department"],
                    status="ACTIVE",
                    created_at=datetime.utcnow()
                )
                db.add(new_u)
                db.commit()
                if u["centre_id"]:
                    cu = CentreUser(
                        id=f"cu_{u['id']}",
                        centre_id=u["centre_id"],
                        user_id=u["id"],
                        role_in_centre="CENTRE_ADMIN",
                        created_at=datetime.utcnow()
                    )
                    db.add(cu)
                    db.commit()

        print("[+] Database verified and ready.")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"[!] Error during initialization: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
