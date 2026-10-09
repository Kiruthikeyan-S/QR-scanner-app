from fastapi import APIRouter
from app.core.config import settings
from app.services.storage_service import StorageService

router = APIRouter()

@router.get("/health", tags=["Health"])
def get_health():
    return {
        "status": "ok",
        "service": "qr-smart-api",
        "supabase_configured": StorageService.is_configured(),
        "storage_bucket": settings.SUPABASE_BUCKET or "qr-files",
    }
