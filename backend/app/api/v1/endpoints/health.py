from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
def get_health():
    return {
        "status": "ok",
        "service": "qr-smart-api"
    }
