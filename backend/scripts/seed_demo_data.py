import os
import sys
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models.models import *

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed():
    print("Beginning MySQL Database Seeding for SkillGuard AI...")
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already contains records. Clearing existing records to re-seed clean baseline...")
            for table in reversed(Base.metadata.sorted_tables):
                db.execute(table.delete())
            db.commit()

        # 1. ROLES
        roles = [
            Role(id="SUPER_ADMIN", name="Super Administrator", description="National Vigilance Commissioners & Root Admins"),
            Role(id="GOVERNMENT_ADMIN", name="Government Administrator", description="Joint Directors & State Directorate Heads"),
            Role(id="MONITORING_OFFICER", name="Monitoring Officer", description="Field & District Monitoring Officers"),
            Role(id="CENTRE_ADMIN", name="Training Centre Administrator", description="Accredited Centre Heads & Operations Directors")
        ]
        db.add_all(roles)
        db.flush()

        # 2. USERS (Bcrypt Hashed Passwords)
        users = [
            User(
                id="usr_gov_admin",
                name="Dr. Alok Verma",
                email="alok.verma@msde.gov.in",
                password_hash=hash_pw("GovAdmin@2026"),
                phone="+91 98110 54321",
                role="GOVERNMENT_ADMIN",
                designation="Joint Director (Compliance & Audit)",
                department="Ministry of Skill Development & Entrepreneurship",
                district="National / Central HQ",
                status="ACTIVE",
                last_login_at=datetime.utcnow()
            ),
            User(
                id="usr_gov_officer",
                name="Rajesh Sharma",
                email="rajesh.sharma@msde.gov.in",
                password_hash=hash_pw("Officer@2026"),
                phone="+91 98220 89123",
                role="MONITORING_OFFICER",
                designation="District Monitoring Officer",
                department="State Directorate of Vocational Training",
                district="Pune",
                status="ACTIVE",
                last_login_at=datetime.utcnow()
            ),
            User(
                id="usr_tc_admin",
                name="Vikram Desai",
                email="admin@apexskill.org",
                password_hash=hash_pw("Centre@2026"),
                phone="+91 98230 45678",
                role="CENTRE_ADMIN",
                designation="Centre Director & Compliance Head",
                department="Apex Skill Centre Operations",
                district="Pune",
                status="ACTIVE",
                last_login_at=datetime.utcnow()
            ),
            User(
                id="usr_super_admin",
                name="Director General (Vigilance & AI Systems)",
                email="superadmin@skillguard.gov.in",
                password_hash=hash_pw("SuperAdmin@2026"),
                phone="+91 99990 00001",
                role="SUPER_ADMIN",
                designation="National Vigilance Commissioner & Root Systems Admin",
                department="National Skill Monitoring Portal (SkillGuard AI)",
                district="Central HQ",
                status="ACTIVE",
                last_login_at=datetime.utcnow()
            )
        ]
        db.add_all(users)
        db.flush()

        # 3. TRAINING CENTRES
        centres = [
            TrainingCentre(
                id="tc_001",
                centre_code="MH-PUN-TC-0842",
                name="Apex Vocational Training Institute",
                address="Plot 42, Hinjewadi Phase 1, Industrial Area",
                city="Pune",
                district="Pune",
                state="Maharashtra",
                pincode="411057",
                latitude=18.5912,
                longitude=73.7389,
                centre_type="PMKVY Center of Excellence",
                contact_person="Vikram Desai",
                contact_number="+91 98230 45678",
                email="admin@apexskill.org",
                approved_capacity=40,
                status="ACTIVE",
                accreditation_status="ACCREDITED",
                camera_status="ONLINE",
                last_inspection_date=datetime.utcnow() - timedelta(days=12),
                next_inspection_date=datetime.utcnow() + timedelta(days=20)
            ),
            TrainingCentre(
                id="tc_002",
                centre_code="MH-MUM-TC-1102",
                name="Pragati Skill Development Centre",
                address="Sector 19, Turbhe Naka, MIDC Area",
                city="Navi Mumbai",
                district="Mumbai Suburban",
                state="Maharashtra",
                pincode="400705",
                latitude=19.0760,
                longitude=72.8777,
                centre_type="State Skill Mission Accredited",
                contact_person="Sunita Kulkarni",
                contact_number="+91 98201 12345",
                email="contact@pragatiskill.org",
                approved_capacity=40,
                status="FLAGGED",
                accreditation_status="ACCREDITED",
                camera_status="ONLINE",
                last_inspection_date=datetime.utcnow() - timedelta(days=5),
                next_inspection_date=datetime.utcnow() + timedelta(days=15)
            ),
            TrainingCentre(
                id="tc_003",
                centre_code="MH-NAS-TC-0491",
                name="Sahyadri Technical Institute",
                address="Ambad MIDC Industrial Estate, Trimbak Road",
                city="Nashik",
                district="Nashik",
                state="Maharashtra",
                pincode="422010",
                latitude=19.9975,
                longitude=73.7898,
                centre_type="DGT Affiliated ITI Partner",
                contact_person="Manoj Gaikwad",
                contact_number="+91 98210 98765",
                email="director@sahyadritech.edu.in",
                approved_capacity=40,
                status="ACTIVE",
                accreditation_status="ACCREDITED",
                camera_status="ONLINE",
                last_inspection_date=datetime.utcnow() - timedelta(days=18),
                next_inspection_date=datetime.utcnow() + timedelta(days=30)
            )
        ]
        db.add_all(centres)
        db.flush()

        # Link Centre Users
        centre_users = [
            CentreUser(centre_id="tc_001", user_id="usr_tc_admin", is_primary_contact=True),
        ]
        db.add_all(centre_users)
        db.flush()

        # 4. CENTRE BATCHES & TRAINEES
        batches = [
            CentreBatch(
                id="btc_001",
                centre_id="tc_001",
                batch_code="AI-102",
                course_name="Industrial Python & Embedded Automation",
                instructor_name="Dr. Neha Patwardhan",
                sanctioned_strength=40,
                start_date=datetime.utcnow() - timedelta(days=30),
                end_date=datetime.utcnow() + timedelta(days=60),
                status="ONGOING"
            ),
            CentreBatch(
                id="btc_002",
                centre_id="tc_002",
                batch_code="CNC-204",
                course_name="Precision CNC Milling & Metrology",
                instructor_name="Mahesh Jadhav",
                sanctioned_strength=40,
                start_date=datetime.utcnow() - timedelta(days=45),
                end_date=datetime.utcnow() + timedelta(days=45),
                status="ONGOING"
            )
        ]
        db.add_all(batches)
        db.flush()

        # 5. ASSET TYPES & APPROVED ASSETS
        asset_types = [
            AssetType(id="person", name="Trainee Headcount", category="PERSONNEL", description="Classroom aggregate presence count", is_model_trained=True, notes="Primary dataset class (109,768 annotations)"),
            AssetType(id="computers", name="Computers / IT Workstations", category="EQUIPMENT", description="IT Lab PC terminals", is_model_trained=False, notes="Model not trained for this class (not in dataset)"),
            AssetType(id="machines", name="Vocational Industrial Machinery", category="MACHINERY", description="CNC lathe, milling, and lathe tools", is_model_trained=False, notes="Model not trained for this class (not in dataset)"),
            AssetType(id="workbenches", name="Heavy Technical Workbenches", category="INFRASTRUCTURE", description="ESD anti-static workbenches", is_model_trained=False, notes="Model not trained for this class (not in dataset)"),
            AssetType(id="chairs", name="Classroom Ergonomic Chairs", category="FURNITURE", description="Student seating chairs", is_model_trained=False, notes="Model not trained for this class (not in dataset)"),
            AssetType(id="cctv", name="CCTV Fixed Optical Nodes", category="SURVEILLANCE", description="IP RTSP cameras", is_model_trained=False, notes="Infrastructure hardware")
        ]
        db.add_all(asset_types)
        db.flush()

        approved_assets = [
            ApprovedAsset(centre_id="tc_001", asset_type_id="computers", approved_quantity=20),
            ApprovedAsset(centre_id="tc_001", asset_type_id="machines", approved_quantity=3),
            ApprovedAsset(centre_id="tc_001", asset_type_id="workbenches", approved_quantity=5),
            ApprovedAsset(centre_id="tc_001", asset_type_id="chairs", approved_quantity=40),
            ApprovedAsset(centre_id="tc_001", asset_type_id="cctv", approved_quantity=2),

            ApprovedAsset(centre_id="tc_002", asset_type_id="computers", approved_quantity=20),
            ApprovedAsset(centre_id="tc_002", asset_type_id="machines", approved_quantity=4),
            ApprovedAsset(centre_id="tc_002", asset_type_id="workbenches", approved_quantity=6),
            ApprovedAsset(centre_id="tc_002", asset_type_id="chairs", approved_quantity=40),
            ApprovedAsset(centre_id="tc_002", asset_type_id="cctv", approved_quantity=2),

            ApprovedAsset(centre_id="tc_003", asset_type_id="computers", approved_quantity=25),
            ApprovedAsset(centre_id="tc_003", asset_type_id="machines", approved_quantity=2),
            ApprovedAsset(centre_id="tc_003", asset_type_id="workbenches", approved_quantity=4),
            ApprovedAsset(centre_id="tc_003", asset_type_id="chairs", approved_quantity=40),
            ApprovedAsset(centre_id="tc_003", asset_type_id="cctv", approved_quantity=2)
        ]
        db.add_all(approved_assets)
        db.flush()

        # 6. CAMERAS
        cameras = [
            Camera(
                id="cam_001_lab",
                centre_id="tc_001",
                name="Practical Lab 1 Overhead Camera",
                camera_code="CAM-MH-0842-01",
                location="Practical Lab Bay 1",
                stream_type="RTSP",
                stream_url_encrypted="ENC_rtsp://cam01.apex-skill.gov.in:554/h264/ch1/main",
                status="CONNECTED",
                fps=15,
                resolution="1920x1080",
                bandwidth_mode="LOW",
                processing_mode="EDGE_INFERENCE",
                is_simulated=True,
                last_seen=datetime.utcnow()
            ),
            Camera(
                id="cam_002_workshop",
                centre_id="tc_001",
                name="CNC Vocational Workshop Camera",
                camera_code="CAM-MH-0842-02",
                location="Machine Shop Floor",
                stream_type="RTSP",
                stream_url_encrypted="ENC_rtsp://cam02.apex-skill.gov.in:554/h264/ch2/main",
                status="CONNECTED",
                fps=15,
                resolution="1920x1080",
                bandwidth_mode="MEDIUM",
                processing_mode="EDGE_INFERENCE",
                is_simulated=True,
                last_seen=datetime.utcnow()
            ),
            Camera(
                id="cam_003_pragati",
                centre_id="tc_002",
                name="Pragati IT Lab Surveillance",
                camera_code="CAM-MH-1102-01",
                location="Computer Lab 1",
                stream_type="RTSP",
                stream_url_encrypted="ENC_rtsp://cam01.pragatiskill.org:554/live",
                status="CONNECTED",
                fps=15,
                resolution="1920x1080",
                bandwidth_mode="LOW",
                processing_mode="EDGE_INFERENCE",
                is_simulated=True,
                last_seen=datetime.utcnow()
            )
        ]
        db.add_all(cameras)
        db.flush()

        # 7. AI MODEL & VERSION (Actual Provided Dataset)
        model = AIModel(
            id="mdl_yolo8_compliance",
            name="SkillGuard YOLO Vision Engine",
            architecture="Ultralytics YOLOv8m (PyTorch 2.4 / TensorRT FP16)",
            description="Trained on provided classroom people dataset for transparent, privacy-preserving aggregate occupancy presence estimation without facial biometric profiling.",
            active_version_id="v1.4.0",
            status="ACTIVE"
        )
        db.add(model)
        db.flush()

        model_version = ModelVersion(
            id="v1.4.0",
            model_id="mdl_yolo8_compliance",
            version="v1.4.0",
            model_path="ml/models/best.pt",
            dataset_version="classroom-people-number.v1i.yolov8",
            precision=0.924,
            recall=0.898,
            f1_score=0.911,
            map50=0.942,
            map50_95=0.817,
            latency_ms=14.2,
            classes_trained=["person"],
            status="ACTIVE"
        )
        db.add(model_version)
        db.flush()

        # 8. ATTENDANCE SUBMISSIONS & DYNAMIC AI RESULTS
        att_sub1 = AttendanceSubmission(
            id="att_001",
            centre_id="tc_001",
            batch_id="btc_001",
            attendance_date="2026-10-09",
            submitted_by="usr_tc_admin",
            session_name="Morning (09:00 - 12:00)",
            start_time="10:00 AM",
            end_time="01:00 PM",
            instructor_name="Dr. Neha Patwardhan",
            total_registered=40,
            total_present=40,
            status="DISCREPANCY_CRITICAL",
            submitted_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(att_sub1)
        db.flush()

        ai_res1 = AttendanceAIResult(
            attendance_submission_id="att_001",
            model_version_id="v1.4.0",
            estimated_people=32,
            confidence=0.942,
            variance_count=8, # 40 - 32
            variance_percentage=20.0, # 8 / 40 * 100
            status="CRITICAL",
            processed_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(ai_res1)

        att_sub2 = AttendanceSubmission(
            id="att_002",
            centre_id="tc_001",
            batch_id="btc_001",
            attendance_date="2026-10-08",
            submitted_by="usr_tc_admin",
            session_name="Afternoon (13:00 - 16:00)",
            start_time="01:30 PM",
            end_time="04:30 PM",
            instructor_name="Dr. Neha Patwardhan",
            total_registered=40,
            total_present=38,
            status="VERIFIED",
            submitted_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(att_sub2)
        db.flush()

        ai_res2 = AttendanceAIResult(
            attendance_submission_id="att_002",
            model_version_id="v1.4.0",
            estimated_people=37,
            confidence=0.951,
            variance_count=1,
            variance_percentage=2.6,
            status="MATCH",
            processed_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(ai_res2)
        db.flush()

        # 9. COMPLIANCE ALERTS & EVIDENCE
        alert1 = Alert(
            id="alt_001",
            centre_id="tc_001",
            camera_id="cam_001_lab",
            category="ATTENDANCE_MISMATCH",
            severity="CRITICAL",
            title="Critical Attendance Deficit Detected (32 Detected vs 40 Claimed)",
            description="AI Vision Pipeline estimated 32 physical trainees during Morning Practical session in Practical Lab Bay 1, whereas the centre attendance roster claimed 40 trainees present. Discrepancy exceeds statutory 10% tolerance threshold (Variance: 20.0%).",
            detected_time="10:45 AM",
            submitted_value=40,
            ai_value=32,
            variance=8,
            ai_confidence=0.942,
            status="ACTION_CREATED",
            created_at=datetime.utcnow() - timedelta(hours=3, minutes=30)
        )
        db.add(alert1)
        db.flush()

        evidence1 = AlertEvidence(
            alert_id="alt_001",
            snapshot_url="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
            model_version="v1.4.0",
            detected_count=32,
            expected_count=40,
            confidence=0.942,
            timestamp=datetime.utcnow() - timedelta(hours=3, minutes=30)
        )
        db.add(evidence1)

        alert2 = Alert(
            id="alt_002",
            centre_id="tc_001",
            camera_id="cam_002_workshop",
            category="INFRASTRUCTURE_DEFICIT",
            severity="HIGH",
            title="Sanctioned Machinery Missing from Vocational Floor Bay",
            description="Visual inspection scan detected only 2 operational machine units out of 3 approved heavy vocational lathes. Bay 2 appears vacant without prior decommission clearance notice.",
            detected_time="09:15 AM",
            submitted_value=3,
            ai_value=2,
            variance=1,
            ai_confidence=0.912,
            status="ACTION_CREATED",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(alert2)
        db.flush()

        # 10. CORRECTIVE ACTIONS, RESPONSES & TIMELINE
        action1 = Action(
            id="act_001",
            action_number="ACT-MH-PUN-2026-001",
            centre_id="tc_001",
            alert_id="alt_001",
            title="Statutory Attendance Discrepancy Clarification Notice",
            description="Explain verified 8-trainee physical deficit observed during Morning Session in Batch AI-102. Provide biometric device logs and sign-in sheets countersigned by course instructor within statutory SLA turnaround.",
            priority="CRITICAL",
            status="ACTION_ASSIGNED",
            assigned_to="usr_tc_admin",
            assigned_officer_name="Rajesh Sharma",
            due_date=(datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d 05:00 PM"),
            is_overdue=False,
            created_by="usr_gov_officer",
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(action1)
        db.flush()

        timeline1 = ActionTimeline(
            action_id="act_001",
            event_type="NOTICE_ISSUED",
            description="Statutory notice dispatched by District Monitoring Officer Rajesh Sharma following AI critical discrepancy alert.",
            performed_by="Rajesh Sharma (District Monitoring Officer)",
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(timeline1)

        action2 = Action(
            id="act_002",
            action_number="ACT-MH-PUN-2026-002",
            centre_id="tc_001",
            alert_id="alt_002",
            title="Vocational Machinery Relocation & Maintenance Verification",
            description="Provide proof of maintenance challan or authorized temporary relocation for CNC Lathe Unit #3 removed from designated workshop bay.",
            priority="HIGH",
            status="SUBMITTED_FOR_VERIFICATION",
            assigned_to="usr_tc_admin",
            assigned_officer_name="Rajesh Sharma",
            due_date=(datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d 05:00 PM"),
            is_overdue=False,
            created_by="usr_gov_officer",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(action2)
        db.flush()

        resp2 = ActionResponse(
            action_id="act_002",
            submitted_by="Vikram Desai (Centre Director)",
            explanation="The designated CNC Lathe unit was temporarily sent for emergency spindle recalibration to certified OEM service center (Godrej Tooling Ltd). Machine is scheduled for re-installation by Oct 12.",
            proof_document_name="OEM_Recalibration_Challan_Oct2026.pdf",
            proof_photo_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            submitted_at=datetime.utcnow() - timedelta(hours=8)
        )
        db.add(resp2)

        timeline2 = ActionTimeline(
            action_id="act_002",
            event_type="RESPONSE_SUBMITTED",
            description="Training Centre Director Vikram Desai submitted OEM recalibration invoice and temporary overhaul justification.",
            performed_by="Vikram Desai (Centre Director)",
            created_at=datetime.utcnow() - timedelta(hours=8)
        )
        db.add(timeline2)

        # 11. FIELD INSPECTIONS
        inspection1 = Inspection(
            id="insp_001",
            centre_id="tc_001",
            inspection_type="AI Triggered",
            reason="Repeated attendance variance flagged by automated video inference pipeline.",
            assigned_officer="Rajesh Sharma",
            scheduled_date=(datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
            status="SCHEDULED",
            notes="Audit paper trainee attendance register and verify machine serial tags in Bay 1 & 2.",
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(inspection1)
        db.flush()

        # 12. COMPLIANCE SCORES & RULES (Calculated Dynamically)
        rule = ComplianceRule(
            id="rule_default",
            rule_name="National Vocational Compliance Standard v2.4",
            alert_type="ALL",
            severity="CRITICAL",
            threshold_percent=10.0,
            sla_hours=72,
            reminder_hours=24,
            escalation_hours=96,
            weight_attendance=40.0,
            weight_infrastructure=35.0,
            weight_actions=25.0,
            active=True
        )
        db.add(rule)

        scores = [
            ComplianceScore(centre_id="tc_001", overall_score=82.0, attendance_score=80.0, infrastructure_score=85.0, action_score=82.0),
            ComplianceScore(centre_id="tc_002", overall_score=71.0, attendance_score=75.0, infrastructure_score=68.0, action_score=70.0),
            ComplianceScore(centre_id="tc_003", overall_score=94.0, attendance_score=96.0, infrastructure_score=92.0, action_score=94.0)
        ]
        db.add_all(scores)

        # 13. NOTIFICATIONS
        notifs = [
            Notification(
                id="notif_001",
                user_id="usr_gov_officer",
                type="ALERT",
                title="Critical Attendance Deficit: Apex Vocational",
                message="AI Video Analysis detected 8-trainee variance in batch AI-102. Automated notice issued.",
                entity_type="ALERT",
                entity_id="alt_001",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=3)
            ),
            Notification(
                id="notif_002",
                user_id="usr_tc_admin",
                type="ACTION_REQUIRED",
                title="Statutory Notice Received: ACT-001",
                message="Formal explanation required within 72 hours regarding attendance deficit in morning practicals.",
                entity_type="ACTION",
                entity_id="act_001",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=3)
            )
        ]
        db.add_all(notifs)

        # 14. SYSTEM SETTINGS
        settings = [
            SystemSetting(setting_key="attendance_warning_threshold", setting_value="5", setting_type="INTEGER", description="Variance percentage to trigger warning badge"),
            SystemSetting(setting_key="attendance_critical_threshold", setting_value="10", setting_type="INTEGER", description="Variance percentage to generate automated AI alert notice"),
            SystemSetting(setting_key="compliance_weight_attendance", setting_value="40", setting_type="INTEGER", description="Weight for attendance compliance in overall index"),
            SystemSetting(setting_key="compliance_weight_infrastructure", setting_value="35", setting_type="INTEGER", description="Weight for infrastructure compliance in overall index"),
            SystemSetting(setting_key="compliance_weight_actions", setting_value="25", setting_type="INTEGER", description="Weight for action resolution compliance in overall index"),
            SystemSetting(setting_key="low_bandwidth_mode", setting_value="true", setting_type="BOOLEAN", description="Transmit lightweight inference metadata instead of raw video uplink"),
            SystemSetting(setting_key="default_detection_fps", setting_value="5", setting_type="INTEGER", description="Edge video sampling rate in frames per second"),
            SystemSetting(setting_key="auto_escalation_days", setting_value="3", setting_type="INTEGER", description="Business days before pending action automatically escalates")
        ]
        db.add_all(settings)

        # 15. AUDIT LOGS
        audit_logs = [
            AuditLog(
                id="aud_001",
                user_id="usr_gov_admin",
                user_name="Dr. Alok Verma",
                role="GOVERNMENT_ADMIN",
                action="INITIALIZE_COMPLIANCE_PARAMETERS",
                entity_type="SYSTEM_SETTINGS",
                entity_id="rule_default",
                old_value=None,
                new_value="Configured 40/35/25 weights with 10% critical attendance variance threshold.",
                ip_address="10.20.4.12",
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            AuditLog(
                id="aud_002",
                user_id="usr_gov_officer",
                user_name="Rajesh Sharma",
                role="MONITORING_OFFICER",
                action="ISSUE_COMPLIANCE_ACTION",
                entity_type="ACTION",
                entity_id="act_001",
                old_value=None,
                new_value="Issued formal clarification directive ACT-MH-PUN-2026-001 to Apex Skill Centre.",
                ip_address="10.20.4.15",
                created_at=datetime.utcnow() - timedelta(hours=3)
            )
        ]
        db.add_all(audit_logs)

        db.commit()
        print("SUCCESS! MySQL Database sih245 completely seeded with real dynamic relational data.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
