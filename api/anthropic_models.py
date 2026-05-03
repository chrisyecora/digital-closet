from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from db_models import ItemCategory

class GroundedItem(BaseModel):
    box_2d: List[int] = Field(..., description="[ymin, xmin, ymax, xmax] normalized 0-1000")
    category: ItemCategory = Field(..., description="TOP, BOTTOM, ONE_PIECE, OUTERWEAR, FOOTWEAR, ACTIVEWEAR, SWIMWEAR, INTIMATES, SLEEPWEAR")
    sub_category: str = Field(..., description="e.g., 'vintage graphic tee', 'slim-fit indigo jeans'")
    color: str = Field(..., description="Primary color")
    material: Optional[str] = Field(None, description="e.g., 'denim', 'cotton', 'leather'")
    pattern: Optional[str] = Field(None, description="e.g., 'solid', 'striped', 'floral'")
    reasoning: str = Field(..., description="Claude's internal logic for this detection")

class IdentityMatch(BaseModel):
    is_exact_match: bool = Field(..., description="True if identical physical garment")
    match_id: Optional[UUID] = Field(None, description="ID of the matching closet item")
    match_index: Optional[int] = Field(None, description="0-indexed position in candidate list")
    certainty_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0.0 to 1.0")
    visual_evidence: str = Field(..., description="Detailed visual markers (tags, wear, stains) justifying the match")
