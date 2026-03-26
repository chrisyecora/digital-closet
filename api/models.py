from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    clerk_user_id: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class ClosetResponse(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class PhotoCreate(BaseModel):
    taken_at: Optional[datetime] = Field(default_factory=datetime.now)

class PhotoResponse(BaseModel):
    id: UUID
    upload_url: str

class PhotoDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    s3_key: Optional[str]
    status: str
    taken_at: datetime
    processed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
