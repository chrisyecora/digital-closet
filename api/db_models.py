from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from database import Base
import uuid
import enum

def generate_uuid():
    return str(uuid.uuid4())

class SubscriptionTier(enum.Enum):
    FREE = "free"
    PAID = "paid"

class PhotoStatus(enum.Enum):
    AWAITING_UPLOAD = "awaiting_upload"
    PENDING_PROCESSING = "pending_processing"
    PROCESSED = "processed"
    FAILED = "failed"

class ItemCategory(enum.Enum):
    TOP = "top"
    BOTTOM = "bottom"
    ONE_PIECE = "one_piece"
    OUTERWEAR = "outerwear"
    FOOTWEAR = "footwear"
    ACTIVEWEAR = "activewear"
    SWIMWEAR = "swimwear"
    INTIMATES = "intimates"
    SLEEPWEAR = "sleepwear"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    tier = Column(Enum(SubscriptionTier, native_enum=False), default=SubscriptionTier.FREE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    closet = relationship("Closet", back_populates="user", uselist=False)
    photos = relationship("Photo", back_populates="user")

class Closet(Base):
    __tablename__ = "closets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="closet")
    items = relationship("ClothingItem", back_populates="closet")

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    closet_id = Column(UUID(as_uuid=True), ForeignKey("closets.id"), nullable=False)
    name = Column(String)
    description = Column(String)
    category = Column(Enum(ItemCategory, native_enum=False))
    sub_category = Column(String)
    color = Column(String)
    material = Column(String)
    pattern = Column(String)
    s3_key = Column(String) # Path to the cropped item image
    worn_count = Column(Integer, default=1)
    last_worn_at = Column(DateTime(timezone=True))
    embedding = Column(Vector(512))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    closet = relationship("Closet", back_populates="items")
    matches = relationship("ItemMatch", foreign_keys="ItemMatch.clothing_item_id", back_populates="clothing_item", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    s3_key = Column(String)
    file_hash = Column(String, index=True)
    status = Column(Enum(PhotoStatus, native_enum=False), default=PhotoStatus.AWAITING_UPLOAD)
    taken_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="photos")
    matches = relationship("ItemMatch", back_populates="photo")

class ItemMatch(Base):
    __tablename__ = "item_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False)
    clothing_item_id = Column(UUID(as_uuid=True), ForeignKey("clothing_items.id", ondelete="CASCADE"), nullable=False)
    confidence_score = Column(Float)
    visual_evidence = Column(String)
    was_confirmed = Column(Boolean, default=False)
    was_corrected = Column(Boolean, default=False)
    correct_item_id = Column(UUID(as_uuid=True), ForeignKey("clothing_items.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    photo = relationship("Photo", back_populates="matches")
    clothing_item = relationship("ClothingItem", foreign_keys=[clothing_item_id], back_populates="matches")
    correct_item = relationship("ClothingItem", foreign_keys=[correct_item_id])
