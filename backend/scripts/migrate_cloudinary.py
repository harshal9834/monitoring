import os
import sys
import shutil
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.database import engine
from sqlalchemy import text

load_dotenv("backend/.env")
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "djdieezso")

migrations = [
    {
        "sub_id": "SUB-2026-664825",
        "center_code": "MH-PUN-TC-1991",
        "media_type": "IMAGE",
        "local_path": "storage/uploads/images/MH-PUN-TC-1991/2026-10-11/SUB-2026-664825.jpg",
        "ext": ".jpg",
        "resource_type": "image"
    },
    {
        "sub_id": "SUB-2026-335252",
        "center_code": "DEMO-TC-0001",
        "media_type": "IMAGE",
        "local_path": "storage/uploads/images/DEMO-TC-0001/2026-10-10/SUB-2026-335252.jpg",
        "ext": ".jpg",
        "resource_type": "image"
    },
    {
        "sub_id": "SUB-2026-702130",
        "center_code": "DEMO-TC-0001",
        "media_type": "IMAGE",
        "local_path": "storage/uploads/images/DEMO-TC-0001/2026-10-10/SUB-2026-702130.jpg",
        "ext": ".jpg",
        "resource_type": "image"
    },
    {
        "sub_id": "SUB-2026-272970",
        "center_code": "DEMO-TC-0001",
        "media_type": "IMAGE",
        "local_path": "storage/uploads/images/DEMO-TC-0001/2026-10-11/SUB-2026-272970.jpg",
        "ext": ".jpg",
        "resource_type": "image"
    },
    {
        "sub_id": "SUB-2026-105534",
        "center_code": "DEMO-TC-0001",
        "media_type": "VIDEO",
        "local_path": "storage/videos/submissions/DEMO-TC-0001/2026-10-10/SUB-2026-105534.mp4",
        "ext": ".mp4",
        "resource_type": "video"
    }
]

def main():
    print("Starting Cloudinary database migration...")
    with engine.connect() as conn:
        for m in migrations:
            sub_folder = "videos" if m["media_type"] == "VIDEO" else "images"
            public_id = f"skillguard/centers/{m['center_code']}/submissions/{m['sub_id']}/{sub_folder}/{m['sub_id']}"
            secure_url = f"https://res.cloudinary.com/{cloud_name}/{m['resource_type']}/upload/{public_id}{m['ext']}"

            # Copy to storage/cloud_media for fallback streaming
            fb_dest = os.path.join("storage", "cloud_media", f"{public_id}{m['ext']}")
            os.makedirs(os.path.dirname(fb_dest), exist_ok=True)
            if os.path.exists(m["local_path"]):
                shutil.copyfile(m["local_path"], fb_dest)
                print(f"Copied {m['local_path']} -> {fb_dest}")

            # Update submission_media
            conn.execute(
                text("""
                    UPDATE submission_media
                    SET cloudinary_public_id = :pub_id,
                        cloudinary_url = :sec_url,
                        secure_url = :sec_url,
                        file_path = :sec_url
                    WHERE submission_id = :sub_id
                """),
                {"pub_id": public_id, "sec_url": secure_url, "sub_id": m["sub_id"]}
            )

            # Update attendance_submissions
            if m["media_type"] == "IMAGE":
                conn.execute(
                    text("""
                        UPDATE attendance_submissions
                        SET image_path = :sec_url
                        WHERE id = :sub_id
                    """),
                    {"sec_url": secure_url, "sub_id": m["sub_id"]}
                )
            else:
                conn.execute(
                    text("""
                        UPDATE attendance_submissions
                        SET video_path = :sec_url
                        WHERE id = :sub_id
                    """),
                    {"sec_url": secure_url, "sub_id": m["sub_id"]}
                )

        conn.commit()
        print("Migration committed successfully!")

if __name__ == "__main__":
    main()
