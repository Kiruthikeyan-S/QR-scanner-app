import os
import secrets
import string
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Depends
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db, engine, Base
from app.models.stored_file import StoredFile

# Setup logger for persistent debugging
logger = logging.getLogger("qr_smart.files")
logging.basicConfig(level=logging.INFO)

router = APIRouter()

# Uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
METADATA_FILE = UPLOAD_DIR / "metadata.json"

# Ensure table exists in database
Base.metadata.create_all(bind=engine)

def load_json_metadata() -> dict:
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read metadata.json: {e}")
            return {}
    return {}

def save_json_metadata(data: dict):
    try:
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save metadata.json: {e}")

def generate_random_file_id(prefix: str = "F-") -> str:
    """Generates a random unique ID like F-x82Km91P or P-x82Km91P"""
    chars = string.ascii_letters + string.digits
    token = "".join(secrets.choice(chars) for _ in range(8))
    return f"{prefix}{token}"

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "webp", "gif", "svg",
    "pdf", "doc", "docx", "txt", "csv", "xls", "xlsx", "zip", "json", "xml"
}

MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILE_SIZE = 25 * 1024 * 1024   # 25 MB

def resolve_file_record(file_id: str, db: Optional[Session] = None) -> Optional[dict]:
    """
    Robust multi-tier file lookup:
    1. Direct DB lookup by file_id
    2. JSON metadata lookup
    3. Disk inspection for matching files in UPLOAD_DIR
    """
    # Clean file_id (remove extensions if user passed F-xxx.pdf)
    clean_id = file_id.strip()
    if clean_id.startswith("http"):
        clean_id = clean_id.split("/")[-1]
    
    clean_id = clean_id.split("?")[0].split("#")[0]
    
    # Strip known extension from token if present
    base_token = clean_id
    for ext in ALLOWED_EXTENSIONS:
        if clean_id.lower().endswith(f".{ext}"):
            base_token = clean_id[:-len(ext)-1]
            break

    logger.info(f"[LOOKUP] Resolving file for token='{clean_id}', base_token='{base_token}'")

    # 1. Database lookup
    if db:
        try:
            record = db.query(StoredFile).filter(
                (StoredFile.file_id == clean_id) | (StoredFile.file_id == base_token)
            ).first()
            if record:
                file_path = UPLOAD_DIR / record.storage_key
                if file_path.exists():
                    logger.info(f"[LOOKUP] Found in DB: file_id={record.file_id}, path={file_path}")
                    return {
                        "file_id": record.file_id,
                        "filename": record.original_file_name,
                        "content_type": record.mime_type,
                        "size_bytes": record.file_size,
                        "size_formatted": format_file_size(record.file_size),
                        "file_type": record.file_type,
                        "stored_file": record.storage_key,
                        "file_path": file_path,
                    }
        except Exception as e:
            logger.error(f"[LOOKUP] DB query failed: {e}")

    # 2. JSON metadata lookup
    metadata = load_json_metadata()
    for key in (clean_id, base_token):
        if key in metadata:
            info = metadata[key]
            file_path = UPLOAD_DIR / info.get("stored_file", "")
            if file_path.exists():
                logger.info(f"[LOOKUP] Found in metadata.json: file_id={key}, path={file_path}")
                return {
                    "file_id": key,
                    "filename": info.get("filename", "file"),
                    "content_type": info.get("content_type", "application/octet-stream"),
                    "size_bytes": info.get("size_bytes", file_path.stat().st_size),
                    "size_formatted": info.get("size_formatted", format_file_size(file_path.stat().st_size)),
                    "file_type": info.get("file_type", "file"),
                    "stored_file": info.get("stored_file", file_path.name),
                    "file_path": file_path,
                }

    # 3. Disk scan fallback
    for match_token in (clean_id, base_token):
        for candidate in UPLOAD_DIR.glob(f"{match_token}_*"):
            if candidate.is_file():
                ext = candidate.suffix.lower().lstrip(".")
                mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png" if ext == "png" else "application/pdf" if ext == "pdf" else "application/octet-stream"
                file_type = "photo" if mime.startswith("image/") else "file"
                orig_name = candidate.name[len(match_token)+1:]
                file_size = candidate.stat().st_size

                logger.info(f"[LOOKUP] Found on disk: file_id={match_token}, candidate={candidate.name}")
                return {
                    "file_id": match_token,
                    "filename": orig_name,
                    "content_type": mime,
                    "size_bytes": file_size,
                    "size_formatted": format_file_size(file_size),
                    "file_type": file_type,
                    "stored_file": candidate.name,
                    "file_path": candidate,
                }

    logger.warning(f"[LOOKUP] File not found anywhere: query='{file_id}'")
    return None


from app.services.storage_service import StorageService

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    file_type: str = Form("file"),  # "photo" or "file"
    db: Session = Depends(get_db)
):
    filename = file.filename or ("photo.jpg" if file_type == "photo" else "document.pdf")

    # Read bytes
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # 1. Process and upload via StorageService (Supabase Storage)
    try:
        fallback_base = str(request.base_url).rstrip("/")
        storage_result = StorageService.process_and_upload(
            filename=filename,
            file_bytes=contents,
            file_type=file_type,
            content_type=file.content_type,
            fallback_base_url=fallback_base
        )
    except ValueError as e:
        logger.warning(f"[UPLOAD REJECTED] Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[UPLOAD ERROR] Failed processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    file_id = storage_result["file_id"]
    file_size = storage_result["file_size"]
    mime_type = storage_result["mime_type"]
    public_url = storage_result["url"]
    safe_filename = f"{file_id}_{filename}"
    file_path = UPLOAD_DIR / safe_filename

    # Save to local disk for local fallback & offline preservation
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.warning(f"[LOCAL BACKUP] Could not write local cache: {e}")

    # Save to SQLite Database
    try:
        db_file = StoredFile(
            file_id=file_id,
            original_file_name=filename,
            mime_type=mime_type,
            file_size=file_size,
            file_type=file_type,
            storage_key=safe_filename,
            created_at=datetime.utcnow()
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        logger.info(f"[UPLOAD SUCCESS] Saved to DB: file_id={file_id}, public_url={public_url}")
    except Exception as e:
        logger.error(f"[UPLOAD WARNING] DB commit failed, continuing with JSON metadata: {e}")
        db.rollback()

    # Save to JSON metadata
    metadata = load_json_metadata()
    metadata[file_id] = {
        "token_id": file_id,
        "file_id": file_id,
        "filename": filename,
        "content_type": mime_type,
        "size_bytes": file_size,
        "size_formatted": format_file_size(file_size),
        "file_type": file_type,
        "stored_file": safe_filename,
        "public_url": public_url,
    }
    save_json_metadata(metadata)

    logger.info(f"[UPLOAD COMPLETE] file_id={file_id}, URL={public_url}")

    return storage_result


@router.get("/info/{file_id}")
async def get_file_info(file_id: str, db: Session = Depends(get_db)):
    record = resolve_file_record(file_id, db)
    if not record:
        raise HTTPException(status_code=404, detail=f"File '{file_id}' not found or has expired.")
    return record


@router.get("/download/{file_id}")
@router.get("/raw/{file_id}")
async def download_file(file_id: str, db: Session = Depends(get_db)):
    record = resolve_file_record(file_id, db)
    if not record:
        logger.warning(f"[DOWNLOAD 404] File not found: {file_id}")
        raise HTTPException(status_code=404, detail=f"File '{file_id}' not found.")

    file_path = record["file_path"]
    logger.info(f"[DOWNLOAD 200] Streaming file {record['filename']} ({record['content_type']})")
    return FileResponse(
        path=file_path,
        filename=record["filename"],
        media_type=record["content_type"]
    )


@router.get("/view/{file_id}", response_class=HTMLResponse)
@router.get("/{file_id}", response_class=HTMLResponse)
async def view_file_page(file_id: str, request: Request, raw: bool = False, db: Session = Depends(get_db)):
    logger.info(f"[VIEW REQUEST] file_id='{file_id}', client={request.client.host if request.client else 'unknown'}, raw={raw}")

    record = resolve_file_record(file_id, db)

    if not record:
        logger.warning(f"[VIEW 404] File '{file_id}' could not be resolved.")
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR Smart - File Not Found</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 40px 20px; }}
                    .card {{ background: #1e293b; max-width: 480px; margin: 0 auto; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                    h2 {{ color: #f87171; margin-bottom: 12px; }}
                    p {{ color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }}
                    .code {{ background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h2>File Not Found</h2>
                    <p>The requested QR file link <span class="code">{file_id}</span> does not exist or has expired.</p>
                    <p>Please make sure you generated the QR code with an active server connection.</p>
                </div>
            </body>
            </html>
            """,
            status_code=404
        )

    # If raw requested, return the file directly
    if raw:
        return FileResponse(
            path=record["file_path"],
            filename=record["filename"],
            media_type=record["content_type"]
        )

    base_url = str(request.base_url).rstrip("/")
    download_url = f"{base_url}/files/download/{record['file_id']}"
    raw_url = f"{base_url}/files/raw/{record['file_id']}"

    is_image = record["file_type"] == "photo" or record["content_type"].startswith("image/")
    is_pdf = record["content_type"] == "application/pdf" or record["filename"].lower().endswith(".pdf")

    preview_html = ""
    if is_image:
        preview_html = f'''
        <div style="text-align: center; margin: 20px 0;">
            <a href="{raw_url}" target="_blank">
                <img src="{raw_url}" alt="{record['filename']}" style="max-width: 100%; max-height: 420px; border-radius: 12px; object-fit: contain; background: #0f172a; border: 1px solid #334155;" />
            </a>
        </div>
        '''
    elif is_pdf:
        preview_html = f'''
        <div style="margin: 20px 0;">
            <iframe src="{raw_url}" style="width: 100%; height: 440px; border-radius: 12px; border: 1px solid #334155; background: #ffffff;"></iframe>
        </div>
        '''

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Smart - {record['filename']}</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: #0F172A;
                color: #F8FAFC;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .container {{
                background: #1E293B;
                max-width: 540px;
                width: 100%;
                border-radius: 20px;
                padding: 28px;
                border: 1px solid #334155;
                box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5);
            }}
            .header {{
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #334155;
            }}
            .app-badge {{
                background: rgba(16, 185, 129, 0.15);
                color: #10B981;
                padding: 5px 12px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }}
            .file-meta {{
                background: #0F172A;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
            }}
            .file-name {{
                font-size: 16px;
                font-weight: 600;
                color: #F8FAFC;
                word-break: break-all;
                margin-bottom: 4px;
            }}
            .file-size {{
                font-size: 13px;
                color: #94A3B8;
            }}
            .btn-download {{
                display: block;
                width: 100%;
                background: #059669;
                color: #FFFFFF;
                text-decoration: none;
                text-align: center;
                padding: 14px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 15px;
                transition: background 0.2s;
            }}
            .btn-download:hover {{
                background: #047857;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748B;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 28px;">{'🖼' if is_image else '📄'}</div>
                <div>
                    <div style="font-size: 18px; font-weight: 700;">QR Smart File</div>
                    <div style="font-size: 12px; color: #94A3B8;">Verified Scanned Content</div>
                </div>
                <div style="margin-left: auto;">
                    <span class="app-badge">{record['file_type'].upper()}</span>
                </div>
            </div>

            <div class="file-meta">
                <div class="file-name">{record['filename']}</div>
                <div class="file-size">{record['size_formatted']} • {record['content_type']}</div>
            </div>

            {preview_html}

            <a href="{download_url}" class="btn-download" download="{record['filename']}">
                ⬇ Download {record['filename']}
            </a>

            <div class="footer">
                Powered by QR Smart • Persistent Secure File Storage
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
