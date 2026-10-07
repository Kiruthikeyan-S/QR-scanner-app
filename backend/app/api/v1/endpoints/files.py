import os
import secrets
import string
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

router = APIRouter()

# Uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
METADATA_FILE = UPLOAD_DIR / "metadata.json"

def load_metadata() -> dict:
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata(data: dict):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def generate_token_id(prefix: str = "F-") -> str:
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

# Maximum limits
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILE_SIZE = 25 * 1024 * 1024   # 25 MB

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "webp", "gif", "svg",
    "pdf", "doc", "docx", "txt", "csv", "xls", "xlsx", "zip", "json", "xml"
}

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    file_type: str = Form("file")  # "photo" or "file"
):
    filename = file.filename or "uploaded_file"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    
    # Read content
    contents = await file.read()
    file_size = len(contents)
    
    max_allowed = MAX_PHOTO_SIZE if file_type == "photo" else MAX_FILE_SIZE
    max_label = "10 MB" if file_type == "photo" else "25 MB"
    
    if file_size > max_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File is larger than the allowed {max_label} limit (Actual: {format_file_size(file_size)})."
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    
    token_id = generate_token_id("F-" if file_type == "file" else "P-")
    safe_filename = f"{token_id}_{filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Store metadata
    metadata = load_metadata()
    metadata[token_id] = {
        "token_id": token_id,
        "filename": filename,
        "content_type": file.content_type or "application/octet-stream",
        "size_bytes": file_size,
        "size_formatted": format_file_size(file_size),
        "file_type": file_type,
        "stored_file": safe_filename,
    }
    save_metadata(metadata)
    
    base_url = str(request.base_url).rstrip("/")
    view_url = f"{base_url}/api/v1/files/view/{token_id}"
    download_url = f"{base_url}/api/v1/files/download/{token_id}"
    
    return {
        "status": "success",
        "token_id": token_id,
        "filename": filename,
        "content_type": file.content_type,
        "size_bytes": file_size,
        "size_formatted": format_file_size(file_size),
        "file_type": file_type,
        "view_url": view_url,
        "download_url": download_url,
        "qr_url": view_url,
    }

@router.get("/info/{token_id}")
async def get_file_info(token_id: str):
    metadata = load_metadata()
    if token_id not in metadata:
        raise HTTPException(status_code=404, detail="File not found or link has expired.")
    return metadata[token_id]

@router.get("/download/{token_id}")
async def download_file(token_id: str):
    metadata = load_metadata()
    if token_id not in metadata:
        raise HTTPException(status_code=404, detail="File not found or link has expired.")
    
    info = metadata[token_id]
    file_path = UPLOAD_DIR / info["stored_file"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File storage missing.")
    
    return FileResponse(
        path=file_path,
        filename=info["filename"],
        media_type=info["content_type"]
    )

@router.get("/view/{token_id}", response_class=HTMLResponse)
async def view_file_page(token_id: str, request: Request):
    metadata = load_metadata()
    if token_id not in metadata:
        return HTMLResponse(
            content="""
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR Smart - File Not Found</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 40px 20px; }
                    .card { background: #1e293b; max-width: 480px; margin: 0 auto; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
                    h2 { color: #f87171; margin-bottom: 8px; }
                    p { color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>File Not Found</h2>
                    <p>The requested QR file link does not exist or has expired.</p>
                </div>
            </body>
            </html>
            """,
            status_code=404
        )
    
    info = metadata[token_id]
    base_url = str(request.base_url).rstrip("/")
    download_url = f"{base_url}/api/v1/files/download/{token_id}"
    is_image = info["file_type"] == "photo" or info["content_type"].startswith("image/")
    is_pdf = info["content_type"] == "application/pdf" or info["filename"].lower().endswith(".pdf")
    
    preview_html = ""
    if is_image:
        preview_html = f'<img src="{download_url}" alt="Preview" style="max-width: 100%; max-height: 380px; border-radius: 12px; margin: 16px 0; object-fit: contain; background: #0f172a;" />'
    elif is_pdf:
        preview_html = f'<iframe src="{download_url}" style="width: 100%; height: 400px; border-radius: 12px; margin: 16px 0; border: 1px solid #334155;"></iframe>'
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Smart - {info['filename']}</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                max-width: 520px;
                width: 100%;
                border-radius: 20px;
                padding: 28px;
                border: 1px solid #334155;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
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
                padding: 4px 10px;
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
                margin-bottom: 20px;
            }}
            .file-name {{
                font-size: 16px;
                font-weight: 600;
                color: #F8FAFC;
                word-break: break-all;
                margin-bottom: 6px;
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
                <div style="font-size: 24px;">📄</div>
                <div>
                    <div style="font-size: 18px; font-weight: 700;">QR Smart File</div>
                    <div style="font-size: 12px; color: #94A3B8;">Verified Scanned Document</div>
                </div>
                <div style="margin-left: auto;">
                    <span class="app-badge">{info['file_type'].upper()}</span>
                </div>
            </div>

            <div class="file-meta">
                <div class="file-name">{info['filename']}</div>
                <div class="file-size">{info['size_formatted']} • {info['content_type']}</div>
            </div>

            {preview_html}

            <a href="{download_url}" class="btn-download" download="{info['filename']}">
                ⬇ Download {info['filename']}
            </a>

            <div class="footer">
                Powered by QR Smart • Secure File QR Delivery
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
