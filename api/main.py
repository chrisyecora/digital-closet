from fastapi import FastAPI, Depends, HTTPException, status
from auth import get_current_user
from db_models import User, Photo
from models import PhotoCreate, PhotoResponse
from sqlalchemy.orm import Session
from database import get_db
import uuid

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "clerk_user_id": current_user.clerk_user_id,
        "email": current_user.email,
        "created_at": current_user.created_at
    }

@app.post("/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def create_photo(
    photo_in: PhotoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # TODO: Generate pre-signed S3 URL
    photo_id = uuid.uuid4()
    s3_key = f"user/{current_user.clerk_user_id}/{photo_id}.jpg"
    
    photo = Photo(
        id=photo_id,
        user_id=current_user.id,
        s3_key=s3_key,
        taken_at=photo_in.taken_at
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return {
        "id": photo.id,
        "upload_url": "https://example.com/presigned-url"  # Placeholder
    }
