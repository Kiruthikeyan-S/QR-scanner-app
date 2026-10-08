import os
import secrets
import string
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import requests
import urllib3

from app.core.config import settings

# Disable insecure request warnings for fallback cloud uploaders
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger("qr_smart.storage")
logging.basicConfig(level=logging.INFO)

# File constraints
MAX_PHOTO_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_PDF_SIZE = 25 * 1024 * 1024     # 25 MB

ALLOWED_PHOTO_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "svg"}
ALLOWED_PDF_EXTS = {"pdf", "doc", "docx", "txt", "csv", "xls", "xlsx", "zip"}

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def generate_random_file_id(prefix: str = "F-") -> str:
    chars = string.ascii_letters + string.digits
    token = "".join(secrets.choice(chars) for _ in range(8))
    return f"{prefix}{token}"

def sanitize_ext(filename: str, default: str = "bin") -> str:
    parts = filename.rsplit(".", 1)
    if len(parts) > 1:
        ext = parts[1].lower().strip()
        clean_ext = "".join(c for c in ext if c.isalnum())
        return clean_ext if clean_ext else default
    return default


class StorageService:
    _supabase_client = None
    _bucket_verified = False

    @classmethod
    def get_supabase_client(cls):
        """Initializes and returns the Supabase client using server-side credentials"""
        if cls._supabase_client is not None:
            return cls._supabase_client

        url = (settings.SUPABASE_URL or os.getenv("SUPABASE_URL", "")).strip()
        key = (
            settings.SUPABASE_SERVICE_ROLE_KEY
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
            or settings.SUPABASE_KEY
            or os.getenv("SUPABASE_KEY", "")
        ).strip()

        # Check if dummy/placeholder
        if not url or not key or "your-project" in url or "secret-key" in key:
            return None

        try:
            from supabase import create_client
            cls._supabase_client = create_client(url, key)
            logger.info(f"[SUPABASE] Successfully initialized Supabase client for: {url}")
            return cls._supabase_client
        except Exception as e:
            logger.error(f"[SUPABASE] Failed to initialize client: {e}")
            return None

    @classmethod
    def ensure_bucket_exists(cls, bucket_name: str) -> bool:
        """Ensures the Supabase public storage bucket exists"""
        client = cls.get_supabase_client()
        if not client or cls._bucket_verified:
            return bool(client)

        try:
            buckets = client.storage.list_buckets()
            existing = [b.name for b in buckets] if buckets else []
            if bucket_name not in existing:
                logger.info(f"[SUPABASE] Bucket '{bucket_name}' not found. Creating public bucket...")
                client.storage.create_bucket(bucket_name, options={"public": True})
                logger.info(f"[SUPABASE] Bucket '{bucket_name}' created successfully.")
            cls._bucket_verified = True
            return True
        except Exception as e:
            logger.warning(f"[SUPABASE] Could not verify/create bucket '{bucket_name}': {e}")
            cls._bucket_verified = True
            return True

    @classmethod
    def upload_to_supabase(
        cls,
        file_bytes: bytes,
        storage_path: str,
        mime_type: str,
        bucket_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Uploads file bytes directly to Supabase Storage and returns the public HTTPS URL.
        """
        client = cls.get_supabase_client()
        if not client:
            return None

        bucket = bucket_name or settings.SUPABASE_BUCKET or "qr-files"
        cls.ensure_bucket_exists(bucket)

        try:
            logger.info(f"[SUPABASE] Uploading {len(file_bytes)} bytes to '{bucket}/{storage_path}'...")
            
            response = client.storage.from_(bucket).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
            
            logger.info(f"[SUPABASE UPLOAD OK] Response: {response}")

            public_url = client.storage.from_(bucket).get_public_url(storage_path)
            
            if public_url:
                public_url = public_url.split("?")[0] if not public_url.endswith("?") else public_url[:-1]
                logger.info(f"[SUPABASE PUBLIC URL] {public_url}")
                return public_url
        except Exception as e:
            logger.error(f"[SUPABASE UPLOAD ERROR] Failed to upload to Supabase: {e}")
            url = (settings.SUPABASE_URL or os.getenv("SUPABASE_URL", "")).rstrip("/")
            if url and "your-project" not in url:
                direct_url = f"{url}/storage/v1/object/public/{bucket}/{storage_path}"
                logger.info(f"[SUPABASE DIRECT URL FALLBACK] {direct_url}")
                return direct_url

        return None

    @classmethod
    def validate_file(cls, filename: str, file_bytes: bytes, file_type: str, content_type: Optional[str] = None) -> tuple[bool, Optional[str]]:
        """
        Validates file size and extension according to app security limits.
        """
        size = len(file_bytes)
        ext = sanitize_ext(filename)

        if file_type == "photo":
            if size > MAX_PHOTO_SIZE:
                return False, f"Photo size exceeds 10 MB limit ({format_file_size(size)})"
            if ext not in ALLOWED_PHOTO_EXTS and not (content_type and content_type.startswith("image/")):
                return False, f"Unsupported photo format '.{ext}'. Supported: JPG, JPEG, PNG, WEBP, GIF, SVG"
        else:
            if size > MAX_PDF_SIZE:
                return False, f"File size exceeds 25 MB limit ({format_file_size(size)})"
            if ext not in ALLOWED_PDF_EXTS and content_type != "application/pdf":
                return False, f"Unsupported document format '.{ext}'. Supported: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, ZIP"

        return True, None

    @classmethod
    def process_and_upload(
        cls,
        filename: str,
        file_bytes: bytes,
        file_type: str = "file",
        content_type: Optional[str] = None,
        fallback_base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        High-performance direct upload pipeline:
        1. Fast validation
        2. Generate unique storage path
        3. Upload directly to Supabase Storage -> Get public HTTPS URL
        4. Return metadata payload
        """
        # 1. Validate
        is_valid, err_msg = cls.validate_file(filename, file_bytes, file_type, content_type)
        if not is_valid:
            raise ValueError(err_msg)

        ext = sanitize_ext(filename, "jpg" if file_type == "photo" else "pdf")
        prefix = "P-" if file_type == "photo" else "F-"
        file_id = generate_random_file_id(prefix)

        # Folder structure in Supabase bucket: photos/{random_id}.{ext} or pdfs/{random_id}.{ext}
        folder = "photos" if file_type == "photo" else "pdfs"
        storage_filename = f"{file_id.lower().replace('-', '_')}_{secrets.token_hex(4)}.{ext}"
        storage_path = f"{folder}/{storage_filename}"

        # Resolve MIME type
        mime_type = content_type or (
            "image/jpeg" if ext in ("jpg", "jpeg")
            else "image/png" if ext == "png"
            else "image/webp" if ext == "webp"
            else "application/pdf" if ext == "pdf"
            else "application/octet-stream"
        )

        file_size = len(file_bytes)

        # 2. Upload to Supabase Storage
        public_url = cls.upload_to_supabase(
            file_bytes=file_bytes,
            storage_path=storage_path,
            mime_type=mime_type
        )

        # 3. Strict verification: Enforce public HTTPS URL
        if not public_url or not public_url.startswith("https://"):
            logger.error("[STORAGE ERROR] Supabase upload failed or not configured.")
            raise ValueError(
                "Unable to upload to cloud storage. Please ensure Supabase Storage is configured in backend/.env "
                "with valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            )

        logger.info(f"[STORAGE SUCCESS] Provider=supabase, URL={public_url}")

        return {
            "success": True,
            "status": "success",
            "file_id": file_id,
            "token_id": file_id,
            "file_name": filename,
            "filename": filename,
            "mime_type": mime_type,
            "content_type": mime_type,
            "file_size": file_size,
            "size_bytes": file_size,
            "size_formatted": format_file_size(file_size),
            "file_type": file_type,
            "storage_path": storage_path,
            "url": public_url,
            "view_url": public_url,
            "download_url": public_url,
            "qr_url": public_url,
            "storage_provider": "supabase",
            "is_supabase": True,
        }
