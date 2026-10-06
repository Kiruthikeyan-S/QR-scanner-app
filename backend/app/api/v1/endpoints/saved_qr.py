from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.saved_qr import SavedQRCreate, SavedQRUpdate, SavedQRResponse
from app.services.saved_qr_service import SavedQRService

router = APIRouter()

@router.get("", response_model=List[SavedQRResponse], summary="List all saved QR codes")
def get_saved_qrs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return SavedQRService.get_all(db, skip=skip, limit=limit)

@router.post("", response_model=SavedQRResponse, status_code=status.HTTP_201_CREATED, summary="Create a saved QR code")
def create_saved_qr(qr_in: SavedQRCreate, db: Session = Depends(get_db)):
    return SavedQRService.create(db, qr_in)

@router.get("/{qr_id}", response_model=SavedQRResponse, summary="Get saved QR code by ID")
def get_saved_qr(qr_id: str, db: Session = Depends(get_db)):
    qr = SavedQRService.get_by_id(db, qr_id)
    if not qr:
        raise HTTPException(status_code=404, detail="Saved QR code not found")
    return qr

@router.put("/{qr_id}", response_model=SavedQRResponse, summary="Update saved QR code")
def update_saved_qr(qr_id: str, qr_in: SavedQRUpdate, db: Session = Depends(get_db)):
    qr = SavedQRService.update(db, qr_id, qr_in)
    if not qr:
        raise HTTPException(status_code=404, detail="Saved QR code not found")
    return qr

@router.delete("/{qr_id}", status_code=status.HTTP_200_OK, summary="Delete a saved QR code")
def delete_saved_qr(qr_id: str, db: Session = Depends(get_db)):
    success = SavedQRService.delete(db, qr_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved QR code not found")
    return {"message": "Saved QR code deleted successfully", "id": qr_id}
