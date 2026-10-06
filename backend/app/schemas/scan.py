from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ScanBase(BaseModel):
    type: str = Field(..., example="url", description="QR code type e.g. url, wifi, phone, email, text, contact, location")
    data: str = Field(..., example="https://example.com", description="Decoded content of the QR code")

class ScanCreate(ScanBase):
    id: Optional[str] = None
    scanned_at: Optional[datetime] = None

class ScanResponse(ScanBase):
    id: str
    scanned_at: datetime

    class Config:
        from_attributes = True
