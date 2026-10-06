import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database.session import Base

class ScanRecord(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(50), nullable=False, default="text", index=True)
    data = Column(Text, nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
