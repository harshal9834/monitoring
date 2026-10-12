import os
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError, OperationalError

from backend.database import engine, Base, get_db, safe_init_db_schema, db_status_info
from backend.routers import auth_router, government_router, centre_router, admin_router, video_router, submissions_router


async def init_db_background():
    """
    Runs database schema check & initialization in the background after the server starts.
    Bounded retry to prevent infinite looping. Server remains fully responsive throughout.
    """
    import time
    for attempt in range(1, 4):
        print(f"[Database Background Init] Attempt {attempt}/3...", flush=True)

        success = await asyncio.to_thread(safe_init_db_schema)

        if success:
            print(
                "[Database Background Init] Database initialization SUCCESS.",
                flush=True
            )
            break

        print(
            f"[Database Background Init] Attempt {attempt} FAILED.",
            flush=True
        )

        if attempt < 3:
            await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lightweight startup: launch DB verification in background so Uvicorn binds port immediately
    bg_task = asyncio.create_task(init_db_background())
    yield
    # Shutdown logic if needed
    if not bg_task.done():
        bg_task.cancel()


app = FastAPI(
    title="SkillGuard AI Enterprise API",
    description="AI-Powered Training Centre Compliance & Monitoring Platform (MySQL 8.0+ Backend)",
    version="2.4.0",
    lifespan=lifespan
)

# Global exception handler for database connectivity failures across API routes
@app.exception_handler(OperationalError)
async def db_operational_error_handler(request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service is temporarily unavailable. Please try again shortly."}
    )

@app.exception_handler(DBAPIError)
async def db_api_error_handler(request, exc: DBAPIError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection error. Please try again shortly."}
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

# CORS Middleware (Explicit origins for production security)
raw_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "https://skillguardai.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if raw_origins:
    for o in raw_origins.split(","):
        clean_origin = o.strip()
        if clean_origin and clean_origin not in allowed_origins:
            allowed_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    rtype = "video" if is_video else "image"
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

# Health Check (Live TiDB / MySQL Connectivity Ping)
@app.get("/api/health")
def health_check():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
        overall_status = "ok"
    except Exception as e:
        db_status = "unavailable"
        overall_status = "degraded"

    return {
        "status": overall_status,
        "database": db_status,
        "service": "skillguard-api",
        "inference_engine": "Ultralytics YOLOv8m (15fps Active)",
        "version": "2.4.0"
    }

# TEMPORARY: Database Connection Debug Endpoint (Easy to remove after verification)
@app.get("/api/debug/db")
def debug_db():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
        return {
            "status": "ok",
            "database": "connected",
            "result": int(result) if result is not None else 1
        }
    except Exception as e:
        exc_type = type(e).__name__
        err_msg = str(e)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error_type": exc_type,
                "error": err_msg
            }
        )

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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True, reload_dirs=["backend"])
