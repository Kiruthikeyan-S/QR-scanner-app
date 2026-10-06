from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from app.models.scan import ScanRecord
from app.schemas.scan import ScanCreate

class ScanService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ScanRecord]:
        return db.query(ScanRecord).order_by(ScanRecord.scanned_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, scan_id: str) -> Optional[ScanRecord]:
        return db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()

    @staticmethod
    def create(db: Session, scan_in: ScanCreate) -> ScanRecord:
        record = ScanRecord(
            id=scan_in.id or str(uuid.uuid4()),
            type=scan_in.type,
            data=scan_in.data,
            scanned_at=scan_in.scanned_at or datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete(db: Session, scan_id: str) -> bool:
        record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_all(db: Session) -> int:
        count = db.query(ScanRecord).delete()
        db.commit()
        return count
