import os
import secrets
import string
import logging
from typing import Dict, Any, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("qr_smart.storage")
logging.basicConfig(level=logging.INFO)

# Size constraints
MAX_PHOTO_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_FILE_SIZE = 25 * 1024 * 1024    # 25 MB

PHOTO_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "svg"}
PDF_EXTS = {"pdf"}
SPREADSHEET_EXTS = {"xlsx", "xls", "csv"}
DOCUMENT_EXTS = {"docx", "doc", "odt", "rtf"}
TEXT_EXTS = {"txt", "text", "md", "log"}
JSON_EXTS = {"json"}
ARCHIVE_EXTS = {"zip", "tar", "gz", "rar", "7z"}

# Comprehensive supported extensions
ALL_ALLOWED_EXTS = (
    PHOTO_EXTS
    | PDF_EXTS
    | SPREADSHEET_EXTS
    | DOCUMENT_EXTS
    | TEXT_EXTS
    | JSON_EXTS
    | ARCHIVE_EXTS
    | {"xml", "pptx", "ppt"}
)

def format_file_size(size_bytes: int) -> str:
    if not size_bytes or size_bytes < 1024:
        return f"{size_bytes or 0} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def generate_random_file_id(prefix: str = "F-") -> str:
    chars = string.ascii_uppercase + string.digits
    token = "".join(secrets.choice(chars) for _ in range(8))
    return f"{prefix}{token}"

def sanitize_ext(filename: str, default: str = "bin") -> str:
    parts = filename.rsplit(".", 1)
    if len(parts) > 1:
        ext = parts[1].lower().strip()
        clean_ext = "".join(c for c in ext if c.isalnum())
        return clean_ext if clean_ext else default
    return default

def detect_file_info(filename: str, declared_type: Optional[str] = None, content_type: Optional[str] = None) -> Tuple[str, str, str, str]:
    """
    Accurately classifies the file into (folder, category, label, mime_type).
    Never misclassifies xlsx as image or PDF.
    
    Returns:
        (folder, file_category, file_type_label, resolved_mime_type)
    """
    ext = sanitize_ext(filename)
    mime = content_type or ""

    # 1. Images
    if ext in PHOTO_EXTS or mime.startswith("image/") or declared_type == "photo":
        resolved_mime = mime if mime.startswith("image/") else (
            "image/jpeg" if ext in ("jpg", "jpeg")
            else "image/png" if ext == "png"
            else "image/webp" if ext == "webp"
            else "image/gif" if ext == "gif"
            else "image/svg+xml" if ext == "svg"
            else "image/jpeg"
        )
        return "photos", "image", "Image File", resolved_mime

    # 2. PDF
    if ext in PDF_EXTS or mime == "application/pdf":
        return "pdfs", "pdf", "PDF Document", "application/pdf"

    # 3. Excel Spreadsheets
    if ext in ("xlsx", "xls"):
        resolved_mime = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            if ext == "xlsx"
            else "application/vnd.ms-excel"
        )
        return "files", "spreadsheet", "Excel Spreadsheet", resolved_mime

    # 4. CSV Spreadsheets
    if ext == "csv" or mime == "text/csv":
        return "files", "spreadsheet", "CSV Spreadsheet", "text/csv"

    # 5. Word Documents
    if ext in ("docx", "doc"):
        resolved_mime = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            if ext == "docx"
            else "application/msword"
        )
        return "files", "document", "Word Document", resolved_mime

    # 6. JSON Files
    if ext in JSON_EXTS or mime == "application/json":
        return "files", "json", "JSON File", "application/json"

    # 7. Text Files
    if ext in TEXT_EXTS or mime.startswith("text/plain"):
        return "files", "text", "Text File", "text/plain; charset=utf-8"

    # 8. ZIP / Archives
    if ext in ARCHIVE_EXTS or "zip" in mime or "compressed" in mime:
        return "files", "archive", "ZIP Archive", "application/zip"

    # 9. Generic File fallback
    return "files", "file", "Document", mime or "application/octet-stream"


class StorageService:
    _supabase_client = None
    _bucket_verified = False

    @classmethod
    def get_supabase_client(cls):
        """Initializes and returns the Supabase client using server-side credentials"""
        if cls._supabase_client is not None:
            return cls._supabase_client

        url = (settings.SUPABASE_URL or os.getenv("SUPABASE_URL", "")).strip()
        key = settings.active_supabase_key or os.getenv("SUPABASE_SECRET_KEY", "").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

        # Check if dummy or unconfigured
        if not url or not key or "your-project" in url or "secret-key" in key:
            return None

        try:
            from supabase import create_client
            cls._supabase_client = create_client(url, key)
            logger.info(f"[SUPABASE] Initialized Supabase client for: {url}")
            return cls._supabase_client
        except Exception as e:
            logger.error(f"[SUPABASE] Failed to initialize Supabase client: {e}")
            return None

    @classmethod
    def is_configured(cls) -> bool:
        """Returns True if Supabase credentials are configured"""
        return cls.get_supabase_client() is not None

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
                client.storage.create_bucket(bucket_name, options={"public": True, "file_size_limit": 26214400})
                logger.info(f"[SUPABASE] Bucket '{bucket_name}' created successfully.")
            cls._bucket_verified = True
            return True
        except Exception as e:
            logger.warning(f"[SUPABASE] Bucket '{bucket_name}' check/create note: {e}")
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
        Uploads file bytes directly to Supabase Storage bucket and returns the public HTTPS URL.
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
                logger.info(f"[SUPABASE DIRECT URL] {direct_url}")
                return direct_url

        return None

    @classmethod
    def delete_from_supabase(cls, storage_path: str, bucket_name: Optional[str] = None) -> bool:
        """Deletes a file from Supabase Storage"""
        client = cls.get_supabase_client()
        if not client:
            return False
        bucket = bucket_name or settings.SUPABASE_BUCKET or "qr-files"
        try:
            client.storage.from_(bucket).remove([storage_path])
            return True
        except Exception as e:
            logger.error(f"[SUPABASE DELETE ERROR] Could not remove '{storage_path}': {e}")
            return False

    @classmethod
    def validate_file(cls, filename: str, file_bytes: bytes, file_category: str) -> Tuple[bool, Optional[str]]:
        """
        Validates file size and format against security boundaries.
        """
        size = len(file_bytes)
        ext = sanitize_ext(filename)

        if file_category == "image":
            if size > MAX_PHOTO_SIZE:
                return False, f"Photo size exceeds 10 MB limit ({format_file_size(size)})"
            if ext not in PHOTO_EXTS:
                return False, f"Unsupported photo format '.{ext}'. Supported: JPG, JPEG, PNG, WEBP, GIF, SVG"
        else:
            if size > MAX_FILE_SIZE:
                return False, f"File size exceeds 25 MB limit ({format_file_size(size)})"
            if ext not in ALL_ALLOWED_EXTS:
                return False, f"Unsupported document format '.{ext}'."

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
        Production Supabase Upload Pipeline:
        1. Classify file type, label, category, folder & MIME
        2. Validate size & format
        3. Generate random safe storage path: photos/xxx.jpg, pdfs/xxx.pdf, files/xxx.ext
        4. Upload to Supabase Storage -> Get public HTTPS URL
        5. Return structured metadata
        """
        folder, file_category, file_type_label, mime_type = detect_file_info(
            filename=filename,
            declared_type=file_type,
            content_type=content_type
        )

        # 1. Validate
        is_valid, err_msg = cls.validate_file(filename, file_bytes, file_category)
        if not is_valid:
            raise ValueError(err_msg)

        ext = sanitize_ext(filename, "jpg" if file_category == "image" else "pdf" if file_category == "pdf" else "bin")
        prefix = "P-" if file_category == "image" else "F-PDF-" if file_category == "pdf" else "F-"
        file_id = generate_random_file_id(prefix)

        # Storage path: photos/f3bc92d14a.jpg or pdfs/91efc802fa.pdf or files/35a8fd81.xlsx
        random_token = secrets.token_hex(5)
        storage_filename = f"{random_token}.{ext}"
        storage_path = f"{folder}/{storage_filename}"

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
                "with valid SUPABASE_URL and SUPABASE_SECRET_KEY."
            )

        logger.info(f"[STORAGE SUCCESS] Category={file_category}, Folder={folder}, URL={public_url}")

        return {
            "success": True,
            "status": "success",
            "file_id": file_id,
            "token_id": file_id,
            "original_name": filename,
            "file_name": filename,
            "filename": filename,
            "mime_type": mime_type,
            "content_type": mime_type,
            "file_category": file_category,
            "file_type": file_category,
            "file_type_label": file_type_label,
            "file_size": file_size,
            "size_bytes": file_size,
            "size_formatted": format_file_size(file_size),
            "storage_path": storage_path,
            "url": public_url,
            "view_url": public_url,
            "download_url": public_url,
            "qr_url": public_url,
            "storage_provider": "supabase",
            "is_supabase": True,
        }
