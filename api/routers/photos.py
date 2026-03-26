from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from auth import get_current_user
from database import get_db
from db_models import User, Photo, PhotoStatus
from models import PhotoCreate, PhotoResponse, PhotoDetailResponse
from dependencies import StorageDependency, QueueDependency

router = APIRouter(prefix="/photos", tags=["photos"])

@router.post("", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def create_photo(
    photo_in: PhotoCreate,
    storage: StorageDependency,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a Photo record and returns a presigned URL for upload.
    """
    photo_id = uuid.uuid4()
    s3_key = f"user/{current_user.clerk_user_id}/{photo_id}.jpg"
    
    # Generate the presigned URL via our provider
    upload_url = storage.generate_presigned_upload_url(s3_key)
    
    photo = Photo(
        id=photo_id,
        user_id=current_user.id,
        s3_key=s3_key,
        status=PhotoStatus.AWAITING_UPLOAD,
        taken_at=photo_in.taken_at
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return {
        "id": photo.id,
        "upload_url": upload_url
    }

@router.post("/{photo_id}/confirm", response_model=PhotoDetailResponse)
async def confirm_photo_upload(
    photo_id: uuid.UUID,
    queue: QueueDependency,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Called by the client after successful upload.
    Updates the photo status and enqueues a message for processing.
    """
    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.user_id == current_user.id).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    if photo.status != PhotoStatus.AWAITING_UPLOAD:
        raise HTTPException(status_code=400, detail="Photo is not awaiting upload")
        
    # Update status
    photo.status = PhotoStatus.PENDING_PROCESSING
    db.commit()
    db.refresh(photo)
    
    # Send message to queue for the worker
    message_payload = {
        "photo_id": str(photo.id),
        "user_id": str(current_user.id),
        "s3_key": photo.s3_key
    }
    
    try:
        queue.send_message(message_payload)
    except Exception as e:
        # Revert status if queueing fails
        photo.status = PhotoStatus.AWAITING_UPLOAD
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enqueue photo for processing"
        )
        
    return photo
