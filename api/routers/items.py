from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid

from auth import get_current_user
from database import get_db
from db_models import User, ClothingItem
from models import ItemResponse
from dependencies import StorageDependency

router = APIRouter(prefix="/items", tags=["items"])

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
    
    response_items = []
    now = datetime.now(timezone.utc)
    
    for item in items:
        # Get the first matching photo to use as the image
        first_match = item.matches[0] if item.matches else None
        photo_s3_key = first_match.photo.s3_key if first_match and first_match.photo else None
        
        image_url = ""
        if photo_s3_key:
            image_url = storage.generate_presigned_download_url(photo_s3_key)
            
        last_worn = item.last_worn_at or item.created_at
        
        # Calculate dormancy: dormant if not worn in 60 days
        is_dormant = False
        if last_worn:
            days_since_worn = (now - last_worn).days
            if days_since_worn > 60:
                is_dormant = True
                
        # Format category enum to Title Case string to match React Native (e.g. ItemCategory.TOP -> 'Tops')
        cat_str = item.category.value if item.category else "unknown"
        if cat_str == "top": cat_str = "Tops"
        elif cat_str == "bottom": cat_str = "Bottoms"
        elif cat_str == "dress": cat_str = "Tops" # Map to tops for MVP
        elif cat_str == "outerwear": cat_str = "Outerwear"
        elif cat_str == "shoes": cat_str = "Shoes"
        elif cat_str == "accessory": cat_str = "Accessories"
        else: cat_str = "Tops"

        response_items.append(ItemResponse(
            id=item.id,
            imageUrl=image_url,
            category=cat_str,
            subCategory=item.sub_category,
            color=item.color or "Unknown",
            lastWorn=last_worn,
            firstLogged=item.created_at,
            wearCount=item.worn_count,
            isDormant=is_dormant
        ))
        
    return response_items
