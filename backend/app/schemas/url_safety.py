from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CheckURLRequest(BaseModel):
    url: str = Field(..., description="The URL or URI to check for security threats")

class CheckURLResponse(BaseModel):
    status: str = Field(..., description="Safety classification: 'safe' | 'suspicious' | 'unsafe' | 'unknown'")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 (clean) to 100 (critical threat)")
    domain: str = Field(..., description="Parsed domain / host")
    normalized_url: str = Field(..., description="Normalized URL for security analysis")
    scheme: str = Field(..., description="URI scheme e.g. https, http, javascript")
    is_https: bool = Field(..., description="Whether the connection uses secure HTTPS")
    reasons: List[str] = Field(default_factory=list, description="List of reasons or risk flags identified")
    checked_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
