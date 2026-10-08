from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text
from app.database.session import Base

class StoredFile(Base):
    __tablename__ = "stored_files"

    file_id = Column(String(64), primary_key=True, index=True)
    original_file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(20), nullable=False)  # "photo" or "file"
    storage_key = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
