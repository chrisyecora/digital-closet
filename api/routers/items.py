from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid

from auth import get_current_user
from database import get_db
from db_models import User, ClothingItem, ItemCategory
from models import ItemResponse, ItemDetailResponse
from dependencies import StorageDependency

router = APIRouter(prefix="/items", tags=["items"])

def format_item(item: ClothingItem, storage: StorageDependency) -> dict:
    now = datetime.now(timezone.utc)
    
    # Use item.s3_key if available (cropped image), otherwise fallback to full photo
    photo_s3_key = item.s3_key
    if not photo_s3_key:
        first_match = item.matches[0] if item.matches else None
        photo_s3_key = first_match.photo.s3_key if first_match and first_match.photo else None
        
    image_url = ""
    if photo_s3_key:
        image_url = storage.generate_presigned_download_url(photo_s3_key)
        
    last_worn = item.last_worn_at or item.created_at
    
    # Calculate dormancy: dormant if not worn in 60 days
    is_dormant = False
    if last_worn:
        # Ensure last_worn is timezone-aware for comparison
        if last_worn.tzinfo is None:
            last_worn = last_worn.replace(tzinfo=timezone.utc)
        days_since_worn = (now - last_worn).days
        if days_since_worn > 60:
            is_dormant = True
            
    # Format category enum to Title Case string for mobile UI
    cat_str = item.category.value if item.category else "unknown"
    category_map = {
        ItemCategory.TOP.value: "Tops",
        ItemCategory.BOTTOM.value: "Bottoms",
        ItemCategory.ONE_PIECE.value: "One Pieces",
        ItemCategory.OUTERWEAR.value: "Outerwear",
        ItemCategory.FOOTWEAR.value: "Footwear",
        ItemCategory.ACTIVEWEAR.value: "Activewear",
        ItemCategory.SWIMWEAR.value: "Swimwear",
        ItemCategory.INTIMATES.value: "Intimates",
        ItemCategory.SLEEPWEAR.value: "Sleepwear"
    }
    display_category = category_map.get(cat_str, cat_str.capitalize())

    return {
        "id": item.id,
        "name": item.name or f"Unnamed {display_category}",
        "description": item.description,
        "image_url": image_url,
        "category": display_category,
        "sub_category": item.sub_category,
        "color": item.color or "Unknown",
        "last_worn": last_worn,
        "first_logged": item.created_at,
        "wear_count": item.worn_count,
        "is_dormant": is_dormant
    }

@router.get("", response_model=List[ItemResponse])
async def get_items(
    storage: StorageDependency,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    closet = current_user.closet
    if not closet:
        return []
        
    items = db.query(ClothingItem).filter(ClothingItem.closet_id == closet.id).order_by(ClothingItem.last_worn_at.desc().nulls_last()).all()
    
    return [format_item(item, storage) for item in items]

@router.get("/{item_id}", response_model=ItemDetailResponse)
async def get_item(
    item_id: uuid.UUID,
    storage: StorageDependency,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    closet = current_user.closet
    if not closet:
        raise HTTPException(status_code=404, detail="Item not found")

    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id, 
        ClothingItem.closet_id == closet.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    return format_item(item, storage)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    storage: StorageDependency,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    closet = current_user.closet
    if not closet:
        raise HTTPException(status_code=404, detail="Item not found")

    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id, 
        ClothingItem.closet_id == closet.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Capture s3_key before DB deletion
    s3_key = item.s3_key
        
    db.delete(item)
    db.commit() # Commit DB first

    # Delete from S3 ONLY after successful DB commit
    if s3_key:
        storage.delete_object(s3_key)
    
    return None
