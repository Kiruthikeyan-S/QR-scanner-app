from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from app.models.saved_qr import SavedQRRecord
from app.schemas.saved_qr import SavedQRCreate, SavedQRUpdate

class SavedQRService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[SavedQRRecord]:
        return db.query(SavedQRRecord).order_by(SavedQRRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, qr_id: str) -> Optional[SavedQRRecord]:
        return db.query(SavedQRRecord).filter(SavedQRRecord.id == qr_id).first()

    @staticmethod
    def create(db: Session, qr_in: SavedQRCreate) -> SavedQRRecord:
        now = datetime.utcnow()
        record = SavedQRRecord(
            id=qr_in.id or str(uuid.uuid4()),
            name=qr_in.name,
            type=qr_in.type,
            data=qr_in.data,
            created_at=qr_in.created_at or now,
            updated_at=qr_in.updated_at or now
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def update(db: Session, qr_id: str, qr_in: SavedQRUpdate) -> Optional[SavedQRRecord]:
        record = db.query(SavedQRRecord).filter(SavedQRRecord.id == qr_id).first()
        if not record:
            return None
        
        update_data = qr_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(record, field, value)
        record.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete(db: Session, qr_id: str) -> bool:
        record = db.query(SavedQRRecord).filter(SavedQRRecord.id == qr_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False
