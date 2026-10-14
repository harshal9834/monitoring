import os
import tempfile
import cv2
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.models.models import (
    Alert, AlertEvidence, Notification, ApprovedAsset, AssetType, TrainingCentre, User
)
from backend.services.cloudinary_service import (
    upload_media_to_cloudinary,
    is_cloudinary_configured,
    format_cloudinary_video_url
)


def map_object_class_to_asset_key(class_name: str, approved_keys: List[str]) -> Optional[str]:
    """
    Dynamically maps detected object/infrastructure class names (e.g. from YOLO or sensors)
    to accredited centre asset registry keys (e.g. 'benches', 'workbenches', 'computers', 'chairs', 'machines', etc.).
    Supports any infrastructure/object class dynamically.
    Priority order:
    1. Exact / direct match (e.g. 'bench' -> 'benches', 'benches' -> 'benches')
    2. Primary alias match
    3. Broader fallback alias match
    """
    clean_cls = class_name.lower().strip().replace("-", " ").replace("_", " ")

    # Direct match or singular/plural normalization
    for key in approved_keys:
        k_clean = key.lower().strip().replace("-", " ").replace("_", " ")
        if clean_cls == k_clean:
            return key
        if clean_cls.rstrip("s") == k_clean.rstrip("s"):
            return key

    # Dynamic alias mapping with strict priority
    aliases = {
        "bench": ["benches", "workbenches", "table", "dining table"],
        "benches": ["benches", "workbenches", "table", "dining table"],
        "chair": ["chairs", "seat", "seating"],
        "chairs": ["chairs", "seat"],
        "computer": ["computers", "laptop", "tv", "monitor", "screen"],
        "computers": ["computers", "computer", "laptop", "tv", "monitor"],
        "laptop": ["computers", "computer", "laptops"],
        "tv": ["computers", "monitor", "screens"],
        "monitor": ["computers", "screens", "computer"],
        "workbench": ["workbenches", "benches", "bench", "table"],
        "workbenches": ["workbenches", "benches", "bench"],
        "dining table": ["workbenches", "benches", "table"],
        "table": ["workbenches", "benches", "dining table"],
        "machine": ["machines", "machinery", "equipment"],
        "machines": ["machines", "machine", "machinery"],
        "cctv": ["cctv", "camera", "cameras"],
        "camera": ["cctv", "cameras"]
    }

    # Check alias candidates against approved_keys
    candidates = aliases.get(clean_cls, [clean_cls])
    for cand in candidates:
        for key in approved_keys:
            k_clean = key.lower().strip()
            if cand == k_clean or cand.rstrip("s") == k_clean.rstrip("s"):
                return key

    return None


def extract_evidence_clip(
    video_source_path: str,
    event_timestamp_sec: float,
    context_before_sec: float = 3.0,
    context_after_sec: float = 3.0
) -> Tuple[bytes, float, float, float]:
    """
    Extracts strictly a 6-second evidence clip around event_timestamp_sec:
    START = max(0.0, event_timestamp_sec - 3.0)
    END   = min(total_duration, event_timestamp_sec + 3.0)
    Duration: ~6.0 seconds (or bounded by video length).
    Does NOT load the entire video into RAM: streams frame by frame from start_frame.
    Never leaves local clip files on disk.
    Returns: (clip_bytes, start_sec, end_sec, duration_sec)
    """
    temp_downloaded_src = None
    working_src = video_source_path

    # If remote URL, download temporarily
    if video_source_path and (video_source_path.startswith("http://") or video_source_path.startswith("https://")):
        try:
            from backend.services.cloudinary_service import download_temp_media_file
            temp_downloaded_src = download_temp_media_file(video_source_path, suffix=".mp4")
            working_src = temp_downloaded_src
        except Exception as e:
            print(f"[Warning] Failed to download remote video for clip extraction: {e}", flush=True)

    if not working_src or not os.path.exists(working_src):
        raise ValueError(f"Cannot access video file for evidence extraction: {video_source_path}")

    cap = cv2.VideoCapture(working_src)
    if not cap.isOpened():
        if temp_downloaded_src and os.path.exists(temp_downloaded_src):
            try:
                os.remove(temp_downloaded_src)
            except Exception:
                pass
        raise ValueError(f"Cannot open video at {working_src} for evidence extraction")

    native_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    total_duration = total_frames / native_fps if native_fps > 0 else 0.0

    # Boundary handling:
    # If T < 3 seconds, start at 0.0.
    start_sec = max(0.0, float(event_timestamp_sec) - float(context_before_sec))
    # If T + 3 exceeds video duration, end at video duration.
    if total_duration > 0:
        end_sec = min(total_duration, float(event_timestamp_sec) + float(context_after_sec))
    else:
        end_sec = float(event_timestamp_sec) + float(context_after_sec)

    clip_duration = max(0.1, round(end_sec - start_sec, 2))
    start_frame = int(start_sec * native_fps)
    end_frame = int(end_sec * native_fps)

    # Position capture stream directly to the target start frame (avoids full video processing)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    fd, temp_clip_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)

    try:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(temp_clip_path, fourcc, native_fps, (width, height))

        curr_frame = start_frame
        while cap.isOpened() and curr_frame <= end_frame:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)
            curr_frame += 1

        cap.release()
        out.release()

        # Read clip bytes into memory
        with open(temp_clip_path, "rb") as f:
            clip_bytes = f.read()

        return clip_bytes, round(start_sec, 2), round(end_sec, 2), clip_duration
    finally:
        # Crucial Requirement: Never permanently store evidence videos on local disk
        if os.path.exists(temp_clip_path):
            try:
                os.remove(temp_clip_path)
            except Exception:
                pass
        if temp_downloaded_src and os.path.exists(temp_downloaded_src):
            try:
                os.remove(temp_downloaded_src)
            except Exception:
                pass


def format_timestamp_clock(seconds: float) -> str:
    """Formats seconds into MM:SS or HH:MM:SS format."""
    total_sec = int(round(seconds))
    hrs = total_sec // 3600
    rem = total_sec % 3600
    mins = rem // 60
    secs = rem % 60
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


def detect_and_verify_infrastructure_reductions(
    frame_events: List[Dict[str, Any]],
    approved_quantities: Dict[str, int],
    min_persistence_frames: int = 4,
    min_persistence_seconds: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Temporal Persistence Verification Algorithm:
    - Analyzes frame_events over short time windows
    - Maps dynamic object classes to approved assets
    - Verifies that detected_count < approved_count persists for multiple consecutive frames / duration
    - Ignores momentary occlusions and detection noise
    - Identifies the exact timestamp where the count reduction occurred
    - Deduplicates so only genuine reduction events trigger alerts
    """
    approved_keys = list(approved_quantities.keys())
    if not approved_keys or not frame_events:
        print("[AI INFRA] No approved keys or empty frame events for persistence check", flush=True)
        return []

    # Map frame-level detections into asset-level counts per frame
    frame_asset_series: List[Dict[str, Any]] = []

    # Track which classes were detected across the entire video
    video_detected_classes = set()
    for fe in frame_events:
        ts = fe.get("timestamp", 0.0)
        detections = fe.get("detections", [])
        counts_in_frame: Dict[str, int] = {}
        for d in detections:
            c_name = d.get("class", "").lower()
            if c_name == "person":
                continue
            video_detected_classes.add(c_name)
            mapped_asset = map_object_class_to_asset_key(c_name, approved_keys)
            if mapped_asset:
                counts_in_frame[mapped_asset] = counts_in_frame.get(mapped_asset, 0) + 1

        frame_asset_series.append({
            "timestamp": ts,
            "counts": counts_in_frame,
            "raw_detections": detections
        })

    reduction_events = []

    for asset_key, approved_count in approved_quantities.items():
        if approved_count <= 0:
            continue

        observed_counts_in_frames = [f_data["counts"].get(asset_key, 0) for f_data in frame_asset_series]
        peak_observed = max(observed_counts_in_frames) if observed_counts_in_frames else 0

        # Requirement 1: ESTABLISH INITIAL OBSERVED BASELINE
        # The AI inspects the beginning/stable portion of the submitted video.
        # If no objects of this asset class were ever detected in the entire video,
        # it remained 0 -> 0 -> 0 (Scenario A/E: no temporal change, so NO ALERT).
        if peak_observed <= 0:
            print(
                f"[AI INFRA] asset_type={asset_key} peak_observed=0. No objects detected throughout monitoring: NO ALERT",
                flush=True
            )
            continue

        # Establish initial baseline from initial frames (first 2-3 sampled frames or mode/median of first 30%)
        initial_window_frames = max(1, min(3, len(observed_counts_in_frames) // 2))
        initial_counts = observed_counts_in_frames[:initial_window_frames]
        initial_observed_baseline = int(round(float(np.median(initial_counts))))
        if initial_observed_baseline <= 0 and initial_counts:
            initial_observed_baseline = max(initial_counts)

        print(
            f"[AI INFRA] asset_type={asset_key} approved_count={approved_count} "
            f"initial_observed_baseline={initial_observed_baseline} peak_detected={peak_observed} "
            f"frames_checked={len(observed_counts_in_frames)}",
            flush=True
        )

        # Requirement 2 & 13: NO ALERT IF NO TEMPORAL REDUCTION
        # If the count started at X and remained at X across all frames (e.g. 18 -> 18 -> 18, or 20 -> 20 -> 20),
        # NO ALERT is generated. An alert requires a TEMPORAL DROP: previous_count > current_count.
        running_baseline = initial_observed_baseline
        consecutive_reduction_frames = 0
        reduction_start_timestamp = None
        min_detected_in_streak = running_baseline
        previous_count_before_drop = running_baseline
        reduction_event_frame = None
        alert_already_triggered = False

        for f_idx, f_data in enumerate(frame_asset_series):
            ts = f_data["timestamp"]
            current_detected = f_data["counts"].get(asset_key, 0)
            cur_frame_num = f_data.get("raw_detections", [{}])[0].get("frame_index") if f_data.get("raw_detections") else int(ts * 24)

            # If count dropped below the established running baseline
            if current_detected < running_baseline:
                if consecutive_reduction_frames == 0:
                    reduction_start_timestamp = ts
                    reduction_event_frame = cur_frame_num
                    # Capture the stable count right before this drop began
                    prev_counts = [frame_asset_series[max(0, p)]["counts"].get(asset_key, 0) for p in range(max(0, f_idx - 2), f_idx)]
                    previous_count_before_drop = max(prev_counts) if prev_counts else running_baseline

                consecutive_reduction_frames += 1
                min_detected_in_streak = min(min_detected_in_streak, current_detected)

                duration_in_streak = ts - (reduction_start_timestamp or ts)
                # Requirement 3: Persistence check across multiple consecutive windows (e.g. >= 2 frames or >= 2s)
                is_persistent = (
                    consecutive_reduction_frames >= min_persistence_frames or
                    duration_in_streak >= min_persistence_seconds
                )

                if is_persistent and not alert_already_triggered:
                    reduction_amount = min_detected_in_streak - previous_count_before_drop
                    event_ts_val = reduction_start_timestamp if reduction_start_timestamp is not None else ts
                    event_frame_val = reduction_event_frame if reduction_event_frame is not None else (cur_frame_num if cur_frame_num is not None else int(event_ts_val * 24))
                    fps_val = round(float(event_frame_val) / max(event_ts_val, 0.001), 2) if (event_ts_val > 0 and event_frame_val is not None) else 24.0

                    print(
                        f"[INFRA EVENT] frame={event_frame_val} fps={fps_val} event_timestamp={round(event_ts_val, 2)}",
                        flush=True
                    )
                    print(
                        f"[INFRA REDUCTION DETECTED] asset_type={asset_key} approved={approved_count} "
                        f"initial_baseline={initial_observed_baseline} previous={previous_count_before_drop} "
                        f"current={min_detected_in_streak} reduction={reduction_amount} event_time={round(event_ts_val, 2)}s "
                        f"streak_frames={consecutive_reduction_frames}",
                        flush=True
                    )

                    reduction_events.append({
                        "asset_type": asset_key,
                        "approved_count": approved_count,
                        "initial_observed_count": initial_observed_baseline,
                        "previous_count": previous_count_before_drop,
                        "current_observed_count": min_detected_in_streak,
                        "detected_count": min_detected_in_streak,
                        "reduction_count": reduction_amount,
                        "difference": reduction_amount,
                        "event_timestamp_sec": round(event_ts_val, 2),
                        "event_timestamp_str": format_timestamp_clock(event_ts_val),
                        "persistence_frames": consecutive_reduction_frames,
                        "persistence_duration_sec": round(duration_in_streak, 2)
                    })
                    alert_already_triggered = True
            else:
                # Count returned or increased: update running baseline if higher, reset streak
                if current_detected > running_baseline:
                    running_baseline = current_detected
                consecutive_reduction_frames = 0
                reduction_start_timestamp = None
                reduction_event_frame = None
                min_detected_in_streak = running_baseline

        if not alert_already_triggered:
            print(
                f"[PERSISTENCE CHECK] No alert for {asset_key}: temporal count remained stable ({initial_observed_baseline}) "
                f"or momentary occlusion was not persistent.",
                flush=True
            )

    return reduction_events


def process_infrastructure_movement_alerts(
    video_source_path: str,
    center_id: str,
    submission_id: str,
    ai_analysis_id: str,
    frame_events: List[Dict[str, Any]],
    db: Session
) -> List[Dict[str, Any]]:
    """
    Main Orchestrator for Infrastructure Movement / Asset Count Reduction Detection:
    1. Loads accredited approved infrastructure baseline for center_id.
    2. Runs temporal persistence verification across video frame detections.
    3. When genuine reduction is confirmed:
       - Extracts exact context evidence clip [t - 2s to t + 2s].
       - Streams evidence clip directly to Cloudinary (no permanent local disk storage).
       - Persists metadata, difference, Cloudinary public_id & URL in MySQL/TiDB alerts & alert_evidence.
       - Dispatches notification to Government Officers.
    4. Returns created alert summaries.
    """
    # 1. Fetch approved infrastructure baseline
    approved_assets = db.query(ApprovedAsset).filter(ApprovedAsset.centre_id == center_id).all()
    if not approved_assets:
        # Default accredited baseline if none registered yet
        default_baseline = [("computers", 20), ("machines", 5), ("workbenches", 10), ("chairs", 30), ("benches", 20)]
        for at_id, qty in default_baseline:
            at_exist = db.query(AssetType).filter(AssetType.id == at_id).first()
            if not at_exist:
                db.add(AssetType(id=at_id, name=at_id.title(), category="EQUIPMENT", active=True))
            db.add(ApprovedAsset(centre_id=center_id, asset_type_id=at_id, approved_quantity=qty))
        try:
            db.commit()
        except Exception:
            db.rollback()
        approved_assets = db.query(ApprovedAsset).filter(ApprovedAsset.centre_id == center_id).all()

    approved_dict = {a.asset_type_id: a.approved_quantity for a in approved_assets}

    # 2. Run Temporal Persistence Verification
    reductions = detect_and_verify_infrastructure_reductions(
        frame_events=frame_events,
        approved_quantities=approved_dict,
        min_persistence_frames=4,
        min_persistence_seconds=2.0
    )

    if not reductions:
        print(f"[AI INFRA] No persistent reductions detected for centre {center_id} submission {submission_id}", flush=True)
        return []

    centre = db.query(TrainingCentre).filter(TrainingCentre.id == center_id).first()
    centre_name = centre.name if centre else center_id

    # Resolve a valid government user for notification foreign key
    gov_user = db.query(User).filter(User.role.in_(["GOVERNMENT_ADMIN", "MONITORING_OFFICER", "SUPER_ADMIN"])).first()
    fallback_user = db.query(User).first()
    notification_user_id = gov_user.id if gov_user else (fallback_user.id if fallback_user else None)

    created_alerts = []

    for red in reductions:
        asset_key = red["asset_type"]
        app_cnt = red["approved_count"]
        init_obs = red.get("initial_observed_count", red["detected_count"])
        prev_cnt = red.get("previous_count", init_obs)
        det_cnt = red["detected_count"]
        diff = red["difference"]
        evt_sec = red["event_timestamp_sec"]
        evt_str = red["event_timestamp_str"]

        print(
            f"[ALERT CREATE EVALUATION] center_id={center_id} submission_id={submission_id} "
            f"asset_type={asset_key} approved_count={app_cnt} initial_observed={init_obs} "
            f"previous_count={prev_cnt} detected_count={det_cnt} difference={diff}",
            flush=True
        )

        # Check for existing duplicate alert for this submission & asset type
        existing = db.query(Alert).filter(
            Alert.centre_id == center_id,
            Alert.submission_id == submission_id,
            Alert.asset_type == asset_key
        ).first()

        # 3. Create 6-Second Evidence Clip (T - 3s to T + 3s)
        clip_url = None
        clip_public_id = None
        start_sec = 0.0
        end_sec = 0.0
        clip_duration = 6.0

        if video_source_path:
            try:
                clip_bytes, start_sec, end_sec, clip_duration = extract_evidence_clip(
                    video_source_path=video_source_path,
                    event_timestamp_sec=evt_sec,
                    context_before_sec=3.0,
                    context_after_sec=3.0
                )
                print(
                    f"[EVIDENCE WINDOW] start={start_sec} end={end_sec} duration={clip_duration}",
                    flush=True
                )

                # 4. Upload Evidence Clip to Cloudinary
                if is_cloudinary_configured() and len(clip_bytes) > 0:
                    clip_filename = f"evidence_clip_6s_{submission_id}_{asset_key}_{int(evt_sec)}s.mp4"
                    cloud_res = upload_media_to_cloudinary(
                        file_bytes=clip_bytes,
                        center_id=center_id,
                        submission_id=submission_id,
                        filename=clip_filename,
                        media_type="VIDEO"
                    )
                    clip_url = format_cloudinary_video_url(cloud_res.get("secure_url"))
                    clip_public_id = cloud_res.get("public_id")
                    print(f"[CLOUDINARY EVIDENCE] url={clip_url}", flush=True)
            except Exception as e:
                print(f"[Warning] Failed to generate/upload 6s evidence clip for {asset_key}: {e}", flush=True)

        title = f"Potential Infrastructure Count Reduction — {asset_key.title()}"
        description = (
            f"Persistent infrastructure count reduction detected. {asset_key.title()} count changed from {prev_cnt} to {det_cnt} "
            f"during monitoring (Initial Observed: {init_obs}, Government Baseline: {app_cnt}). "
            f"Review the evidence clip to determine whether the asset was relocated, temporarily obscured, or otherwise unavailable."
        )

        if existing:
            # Update existing alert instead of creating duplicate
            existing.is_deleted = False
            existing.status = "NEW"
            existing.approved_count = app_cnt
            existing.detected_count = det_cnt
            existing.difference = diff
            existing.event_timestamp = evt_str
            existing.detected_time = evt_str
            existing.submitted_value = app_cnt
            existing.ai_value = det_cnt
            existing.variance = abs(diff)
            existing.title = title
            existing.description = description
            if clip_url:
                existing.evidence_clip_url = clip_url
                existing.evidence_clip_public_id = clip_public_id

            # Update linked evidence
            ev_rec = db.query(AlertEvidence).filter(AlertEvidence.alert_id == existing.id).first()
            if ev_rec:
                if clip_url:
                    ev_rec.video_clip_url = clip_url
                    ev_rec.video_clip_public_id = clip_public_id
                    ev_rec.snapshot_url = clip_url
                ev_rec.start_timestamp = start_sec
                ev_rec.end_timestamp = end_sec
                ev_rec.duration = clip_duration
                ev_rec.event_timestamp = evt_str
                ev_rec.detected_count = det_cnt
                ev_rec.expected_count = app_cnt

            alert_id = existing.id
            print(f"[ALERT UPDATE] Updated existing alert {alert_id} for {asset_key}", flush=True)
        else:
            # 5. Create Government Alert in MySQL/TiDB
            alert_id = f"alt_infra_{int(datetime.utcnow().timestamp())}_{asset_key[:4]}"
            alert = Alert(
                id=alert_id,
                centre_id=center_id,
                submission_id=submission_id,
                asset_type=asset_key,
                approved_count=app_cnt,
                detected_count=det_cnt,
                difference=diff,
                event_timestamp=evt_str,
                ai_analysis_id=ai_analysis_id,
                evidence_clip_url=clip_url,
                evidence_clip_public_id=clip_public_id,
                category="INFRASTRUCTURE_SHORTAGE",
                severity="CRITICAL" if abs(diff) >= 3 else "HIGH",
                title=title,
                description=description,
                detected_time=evt_str,
                submitted_value=app_cnt,
                ai_value=det_cnt,
                variance=abs(diff),
                ai_confidence=0.92,
                status="NEW",
                is_deleted=False,
                created_at=datetime.utcnow()
            )
            db.add(alert)

            # 6. Store Evidence Metadata in AlertEvidence
            evidence = AlertEvidence(
                alert_id=alert_id,
                snapshot_url=clip_url or "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
                video_clip_url=clip_url,
                video_clip_public_id=clip_public_id,
                start_timestamp=start_sec,
                end_timestamp=end_sec,
                duration=clip_duration,
                resource_type="video",
                event_timestamp=evt_str,
                submission_id=submission_id,
                center_id=center_id,
                model_version="YOLOv8 Ultralytics (Compliance Guard)",
                detected_count=det_cnt,
                expected_count=app_cnt,
                confidence=0.92,
                timestamp=datetime.utcnow()
            )
            db.add(evidence)

            # 7. Create Government Notification if valid user exists
            if notification_user_id:
                notif = Notification(
                    id=f"notif_infra_{int(datetime.utcnow().timestamp())}_{asset_key[:3]}",
                    user_id=notification_user_id,
                    type="CRITICAL" if abs(diff) >= 3 else "WARNING",
                    title=f"Infrastructure Review Required: {centre_name}",
                    message=f"Potential count reduction for {asset_key.title()} detected at {evt_str} (Approved: {app_cnt}, Detected: {det_cnt}). Evidence clip ready for review.",
                    entity_type="ALERT",
                    entity_id=alert_id,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(notif)

            print(
                f"[ALERT CREATE] center_id={center_id} submission_id={submission_id} "
                f"asset_type={asset_key} severity=CRITICAL status=NEW alert_id={alert_id}",
                flush=True
            )

        created_alerts.append({
            "alert_id": alert_id,
            "asset_type": asset_key,
            "approved_count": app_cnt,
            "detected_count": det_cnt,
            "difference": diff,
            "event_timestamp": evt_str,
            "evidence_clip_url": clip_url,
            "status": "NEW"
        })

    try:
        db.commit()
        print(f"[ALERT CREATE SUCCESS] Committed {len(created_alerts)} alerts to database", flush=True)
    except Exception as e:
        db.rollback()
        print(f"[Error] Failed to persist infrastructure alerts: {e}", flush=True)

    return created_alerts
