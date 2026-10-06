import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database.session import Base

class SavedQRRecord(Base):
    __tablename__ = "saved_qrs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, default="text", index=True)
    data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
