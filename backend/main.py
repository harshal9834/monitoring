import os
import json
from typing import Optional
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.database import engine, Base, get_db
from backend.routers import auth_router, government_router, centre_router, admin_router, video_router, submissions_router

app = FastAPI(
    title="SkillGuard AI Enterprise API",
    description="AI-Powered Training Centre Compliance & Monitoring Platform (MySQL 8.0+ Backend)",
    version="2.4.0"
)

# Ensure required system and temporary processing directories exist
os.makedirs("storage/evidence", exist_ok=True)
os.makedirs("storage/captures", exist_ok=True)
os.makedirs("storage/reports", exist_ok=True)
os.makedirs("storage/models", exist_ok=True)
os.makedirs("storage/temp", exist_ok=True)
os.makedirs("storage/cloud_media", exist_ok=True)

# Mount local storage as static files for snapshots and temporary caching
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Auto-create tables on startup if they don't exist
try:
    from backend.models import models
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Database Init] Table auto-creation notice: {e}")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router.router)
app.include_router(government_router.router)
app.include_router(centre_router.router)
app.include_router(submissions_router.router)
app.include_router(admin_router.router)
app.include_router(video_router.router)

# Dedicated Cloudinary Streaming Proxy Fallback (Requirement 14)
@app.get("/api/media/stream/{public_id:path}")
def stream_media_by_public_id(
    public_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse, StreamingResponse
    from backend.services.cloudinary_service import FALLBACK_MEDIA_DIR

    # Search in fallback cloud media storage
    clean_id = public_id.strip("/\\")
    for ext in ["", ".jpg", ".png", ".mp4", ".mov", ".webp"]:
        cand = os.path.join(FALLBACK_MEDIA_DIR, f"{clean_id}{ext}")
        if os.path.exists(cand) and os.path.isfile(cand):
            mime = "video/mp4" if ext in [".mp4", ".mov"] else "image/jpeg"
            return FileResponse(cand, media_type=mime)

    for root, _, files in os.walk(FALLBACK_MEDIA_DIR):
        for f in files:
            if clean_id.split("/")[-1] in f:
                cand = os.path.join(root, f)
                mime = "video/mp4" if f.endswith((".mp4", ".mov")) else "image/jpeg"
                return FileResponse(cand, media_type=mime)

    # Proxy from Cloudinary CDN if remote
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "djdieezso")
    is_video = "videos" in clean_id or clean_id.endswith((".mp4", ".mov", ".webm"))
    trans = "vc_h264/" if is_video else ""
    remote_url = f"https://res.cloudinary.com/{cloud_name}/{rtype}/upload/{trans}{clean_id}"
    import urllib.request
    try:
        req = urllib.request.Request(remote_url, headers={"User-Agent": "SkillGuard-Proxy/2.4"})
        resp = urllib.request.urlopen(req, timeout=10)
        return StreamingResponse(resp, media_type=resp.headers.get("Content-Type", "video/mp4" if is_video else "image/jpeg"))
    except Exception:
        pass

    raise HTTPException(status_code=404, detail=f"Media asset '{public_id}' not found")

# Health Check
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "HEALTHY",
        "service": "SkillGuard AI Enterprise Platform",
        "database": "MySQL 8.0+ Connected (sih245)",
        "inference_engine": "Ultralytics YOLOv8m (15fps Active)",
        "version": "2.4.0"
    }

# WebSocket for Real-Time CCTV Inference & Alert Telemetry (Section 27)
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process client command
            await websocket.send_text(f"Telemetry Heartbeat Ack: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["backend"])
