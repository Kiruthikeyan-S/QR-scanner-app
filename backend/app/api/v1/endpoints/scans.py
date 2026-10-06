from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.scan import ScanCreate, ScanResponse
from app.services.scan_service import ScanService

router = APIRouter()

@router.get("", response_model=List[ScanResponse], summary="List all scan history")
def get_scans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ScanService.get_all(db, skip=skip, limit=limit)

@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED, summary="Create a new scan record")
def create_scan(scan_in: ScanCreate, db: Session = Depends(get_db)):
    return ScanService.create(db, scan_in)

@router.get("/{scan_id}", response_model=ScanResponse, summary="Get scan record by ID")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = ScanService.get_by_id(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return scan

@router.delete("/{scan_id}", status_code=status.HTTP_200_OK, summary="Delete a scan record")
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    success = ScanService.delete(db, scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"message": "Scan record deleted successfully", "id": scan_id}

@router.delete("", status_code=status.HTTP_200_OK, summary="Clear all scan history")
def clear_all_scans(db: Session = Depends(get_db)):
    deleted_count = ScanService.delete_all(db)
    return {"message": "All scan records cleared", "count": deleted_count}
