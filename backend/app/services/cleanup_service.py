import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.stored_file import StoredFile
from app.core.config import settings

logger = logging.getLogger("qr_smart.cleanup")

def cleanup_expired_local_and_db_files(db: Session) -> dict:
    """
    Cleans up files that have passed their 7-day retention period.
    Safe to run repeatedly and idempotently.
    """
    now = datetime.utcnow()
    cleaned = 0
    errors = []

    try:
        expired_files = db.query(StoredFile).filter(
            StoredFile.expires_at <= now,
            StoredFile.is_active == True
        ).all()

        for f in expired_files:
            try:
                import os
                if f.file_path and os.path.exists(f.file_path):
                    os.remove(f.file_path)
                f.is_active = False
                cleaned += 1
            except Exception as ex:
                errors.append(f"Failed deleting file {f.file_id}: {str(ex)}")

        db.commit()
    except Exception as e:
        logger.error(f"Error during file cleanup: {e}")
        errors.append(str(e))

    return {
        "success": len(errors) == 0,
        "cleaned_count": cleaned,
        "timestamp": now.isoformat(),
        "errors": errors
    }
