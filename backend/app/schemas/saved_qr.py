from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SavedQRBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, example="Office Wi-Fi")
    type: str = Field(..., example="wifi")
    data: str = Field(..., example="WIFI:T:WPA;S:Office;P:secret123;;")

class SavedQRCreate(SavedQRBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SavedQRUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = None
    data: Optional[str] = None

class SavedQRResponse(SavedQRBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
