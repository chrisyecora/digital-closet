from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class BaseResponse(BaseModel):
    """Base response model with camelCase alias generator."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class UserBase(BaseModel):
    email: EmailStr
    clerk_user_id: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase, BaseResponse):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

class ClosetResponse(BaseResponse):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

class PhotoCreate(BaseModel):
    taken_at: Optional[datetime] = Field(default_factory=datetime.now)
    file_hash: Optional[str] = None

class PhotoResponse(BaseResponse):
    id: UUID
    upload_url: str

class PhotoDetailResponse(BaseResponse):
    id: UUID
    user_id: UUID
    s3_key: Optional[str]
    file_hash: Optional[str]
    status: str
    taken_at: datetime
    processed_at: Optional[datetime]

class ItemResponse(BaseResponse):
    id: UUID
    image_url: str
    category: str
    sub_category: Optional[str] = None
    color: str
    last_worn: datetime
    first_logged: datetime
    wear_count: int
    is_dormant: bool

class ItemDetailResponse(ItemResponse):
    name: str
    description: Optional[str] = None
