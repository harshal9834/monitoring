import os
import shutil
import tempfile
import urllib.request
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load credentials from both .env and backend/.env
load_dotenv(".env", override=True)
load_dotenv("backend/.env", override=True)

logger = logging.getLogger("skillguard.cloudinary")

FALLBACK_MEDIA_DIR = os.path.join("storage", "fallback_media")

_is_configured = False


def check_cloudinary_config() -> Dict[str, Any]:
    """
    Validates and outputs safe debug information for Cloudinary configuration.
    NEVER prints API secret.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    is_configured = bool(
        cloud_name and api_key and api_secret and cloud_name not in ["your_cloud_name", ""]
    )

    print("Cloudinary configured:", str(is_configured).lower())
    print("Cloud name:", cloud_name or "not_set")
    print("API key configured:", str(bool(api_key)).lower())
    print("API secret configured:", str(bool(api_secret)).lower())

    return {
        "configured": is_configured,
        "cloud_name": cloud_name,
        "api_key_configured": bool(api_key),
        "api_secret_configured": bool(api_secret),
    }


def init_cloudinary() -> bool:
    global _is_configured
    if _is_configured:
        return True

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret or cloud_name in ["your_cloud_name", ""]:
        logger.error(
            "Cloudinary credentials missing or invalid in environment. "
            "Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )
        return False

    try:
        import cloudinary
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        _is_configured = True
        logger.info(f"Cloudinary initialized successfully for cloud '{cloud_name}'.")
        return True
    except Exception as e:
        logger.error(f"Failed to configure Cloudinary SDK: {e}")
        return False


def is_cloudinary_configured() -> bool:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    return bool(cloud_name and api_key and api_secret and cloud_name not in ["your_cloud_name", ""])


def format_cloudinary_video_url(url: Optional[str]) -> Optional[str]:
    """
    Ensures Cloudinary video URLs include the 'vc_h264' transformation
    so that browser HTML5 <video> elements can decode and play the stream
    across all modern browsers regardless of the original video codec.
    """
    if not url or not isinstance(url, str):
        return url
    if "res.cloudinary.com" in url and "/video/upload/" in url:
        if "/video/upload/vc_h264/" in url or "/video/upload/f_auto,vc_h264/" in url:
            return url
        return url.replace("/video/upload/", "/video/upload/vc_h264/", 1)
    return url


def build_cloudinary_folder(center_id: str, submission_id: str, media_type: str) -> str:
    """
    Constructs standardized Cloudinary folder path:
    skillguard/centers/{center_id}/submissions/{submission_id}/images
    skillguard/centers/{center_id}/submissions/{submission_id}/videos
    """
    clean_center = str(center_id).replace("/", "_").strip()
    clean_sub = str(submission_id).replace("/", "_").strip()
    subfolder = "videos" if str(media_type).upper() == "VIDEO" else "images"
    return f"skillguard/centers/{clean_center}/submissions/{clean_sub}/{subfolder}"


def upload_image(
    file_bytes: bytes,
    center_id: str,
    submission_id: str,
    filename: str
) -> Dict[str, Any]:
    """
    Uploads an image file to Cloudinary with explicit image resource_type.
    """
    return upload_media_to_cloudinary(
        file_bytes=file_bytes,
        center_id=center_id,
        submission_id=submission_id,
        filename=filename,
        media_type="IMAGE"
    )


def upload_video(
    file_bytes: bytes,
    center_id: str,
    submission_id: str,
    filename: str
) -> Dict[str, Any]:
    """
    Uploads a video file to Cloudinary with explicit video resource_type.
    Uses chunked upload_large for files > 20MB.
    """
    return upload_media_to_cloudinary(
        file_bytes=file_bytes,
        center_id=center_id,
        submission_id=submission_id,
        filename=filename,
        media_type="VIDEO"
    )


def upload_media_to_cloudinary(
    file_bytes: bytes,
    center_id: str,
    submission_id: str,
    filename: str,
    media_type: str = "IMAGE"
) -> Dict[str, Any]:
    """
    Direct Cloudinary upload function.
    Fails clearly if Cloudinary is not configured or upload fails.
    Never returns a theoretical or fake URL if the upload did not succeed.
    """
    if not init_cloudinary():
        raise RuntimeError("Cloudinary is not configured. Set valid credentials in .env.")

    import cloudinary.uploader

    is_video = str(media_type).upper() == "VIDEO"
    resource_type = "video" if is_video else "image"
    folder_path = build_cloudinary_folder(center_id, submission_id, media_type)
    base_name = os.path.splitext(os.path.basename(filename))[0]

    # Required debug logging
    print("=== CLOUDINARY UPLOAD ===")
    print(f"center_id: {center_id}")
    print(f"submission_id: {submission_id}")
    print(f"media_type: {media_type.upper()}")
    print(f"filename: {filename}")
    print("Cloudinary upload started")

    ext = os.path.splitext(filename)[1].lower() or (".mp4" if is_video else ".jpg")

    try:
        if is_video and len(file_bytes) > 20 * 1024 * 1024:
            # For chunked upload_large, stream via a temporary file
            fd, temp_large = tempfile.mkstemp(suffix=ext)
            try:
                with os.fdopen(fd, "wb") as f_tmp:
                    f_tmp.write(file_bytes)
                upload_result = cloudinary.uploader.upload_large(
                    temp_large,
                    folder=folder_path,
                    public_id=base_name,
                    resource_type="video",
                    overwrite=True,
                    chunk_size=6000000
                )
            finally:
                if os.path.exists(temp_large):
                    try:
                        os.remove(temp_large)
                    except Exception:
                        pass
        else:
            upload_result = cloudinary.uploader.upload(
                file_bytes,
                folder=folder_path,
                public_id=base_name,
                resource_type=resource_type,
                overwrite=True,
                unique_filename=False
            )

        secure_url = upload_result.get("secure_url")
        ret_public_id = upload_result.get("public_id")
        asset_id = upload_result.get("asset_id")

        if not secure_url:
            raise RuntimeError("Cloudinary response missing secure_url")

        if is_video:
            secure_url = format_cloudinary_video_url(secure_url)

        print("Cloudinary upload completed")
        print(f"public_id: {ret_public_id}")
        print(f"resource_type: {resource_type}")
        print(f"secure_url: {secure_url}")
        print("=========================")

        return {
            "public_id": ret_public_id,
            "asset_id": asset_id,
            "secure_url": secure_url,
            "url": secure_url,
            "bytes": upload_result.get("bytes", len(file_bytes)),
            "format": upload_result.get("format", ext.lstrip(".")),
            "duration": upload_result.get("duration", 0.0),
            "resource_type": resource_type,
            "original_filename": filename
        }

    except Exception as e:
        print(f"Cloudinary upload failed: {e}")
        print("=========================")
        logger.error(f"[Cloudinary Error] Upload failed for {filename}: {e}")
        raise RuntimeError(f"Cloudinary upload failed: {str(e)}")


def download_temp_media_file(media_url: str, suffix: str = ".jpg") -> str:
    """
    Downloads media asset to a temporary local file for YOLO inference.
    Caller is responsible for deleting the returned temp file.
    """
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)

    try:
        req = urllib.request.Request(
            media_url,
            headers={"User-Agent": "SkillGuard-AI-Inference/2.4"}
        )
        with urllib.request.urlopen(req, timeout=20) as response, open(temp_path, "wb") as out_file:
            out_file.write(response.read())
        return temp_path
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise RuntimeError(f"Failed to download temporary media from {media_url}: {e}")


def delete_media(public_id: str, resource_type: str = "image") -> bool:
    """
    Deletes media asset from Cloudinary using public_id.
    """
    if not init_cloudinary():
        return False
    import cloudinary.uploader
    try:
        res = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return res.get("result") in ["ok", "not found"]
    except Exception as e:
        logger.error(f"Failed to delete Cloudinary media {public_id}: {e}")
        return False
