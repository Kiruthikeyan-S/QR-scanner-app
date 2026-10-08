from fastapi import APIRouter, HTTPException, status
from app.schemas.url_safety import CheckURLRequest, CheckURLResponse
from app.services.url_safety_service import URLSafetyService

router = APIRouter()

@router.post("/check-url", response_model=CheckURLResponse, summary="Analyze URL for safety threats")
def check_url_safety(payload: CheckURLRequest):
    """
    Perform a comprehensive security reputation & heuristic threat assessment
    on the provided URL to classify it as 'safe', 'suspicious', 'unsafe', or 'unknown'.
    """
    try:
        result = URLSafetyService.analyze_url(payload.url)
        return CheckURLResponse(**result)
    except Exception as e:
        return CheckURLResponse(
            status="unknown",
            risk_score=50,
            domain="error",
            normalized_url=payload.url,
            scheme="unknown",
            is_https=payload.url.startswith("https"),
            reasons=[f"Safety check error: {str(e)}"],
        )
