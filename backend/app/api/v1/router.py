from fastapi import APIRouter
from app.api.v1.endpoints import scans, saved_qr, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(scans.router, prefix="/scans", tags=["Scans"])
api_router.include_router(saved_qr.router, prefix="/qr/saved", tags=["Saved QR Codes"])
