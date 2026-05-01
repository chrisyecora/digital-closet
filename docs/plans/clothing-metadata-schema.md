# High-Fidelity Clothing Metadata Schema

This document defines the data contract for the Digital Closet's "Double-Claude" orchestrated pipeline. It focuses on capturing the richest possible physical and contextual metadata to enable a high-intelligence conversational Style Agent.

## 1. Objective
To transform raw outfit photos into a structured Knowledge Graph. By capturing details like fabric type, fit, and a numeric formality scale, we enable the agent to answer complex queries such as: *"Find me a breathable, smart-casual outfit for a summer outdoor wedding."*

## 2. The Schema (Pydantic Model)

This model will be used in the `worker/` service to validate Claude's structured output.

```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ClothingItemMetadata(BaseModel):
    # --- SPATIAL GROUNDING ---
    box_2d: List[int] = Field(
        ..., 
        description="Precise [ymin, xmin, ymax, xmax] coordinates normalized to 0-1000."
    )

    # --- CORE CLASSIFICATION ---
    category: Literal["top", "bottom", "shoes", "dress", "outerwear", "accessory"]
    sub_category: str = Field(..., description="Specific type, e.g., 'Oxford Button-Down', 'Selvedge Denim', 'Chelsea Boots'")
    
    # --- PHYSICAL CHARACTERISTICS ---
    primary_color: str = Field(..., description="The dominant color (e.g., 'Midnight Navy', 'Charcoal Gray')")
    secondary_colors: List[str] = Field(default_factory=list, description="Accent colors or pattern colors.")
    material: str = Field(..., description="Visible fabric type (e.g., 'Linen', 'Heavyweight Cotton', 'Suede')")
    pattern: str = Field(..., description="e.g., 'Solid', 'Vertical Stripe', 'Windowpane Check', 'Graphic'")
    fit: Literal["slim", "regular", "relaxed", "oversized", "cropped"]
    
    # --- STYLE & CONTEXT ---
    formality_score: int = Field(
        ..., 
        ge=1, le=10, 
        description="1: Gym/Lounge, 5: Smart Casual/Office, 10: Formal/Black Tie"
    )
    style_vibe: List[str] = Field(
        ..., 
        description="Descriptive tags for the agent, e.g., ['minimalist', 'streetwear', 'vintage', 'preppy']"
    )
    
    # --- DENSE DESCRIPTION (THE 'SIGNATURE') ---
    visual_signature: str = Field(
        ..., 
        description="A dense description capturing unique markers like pocket styles, specific button types, or unique wear patterns. Used for identity arbitration."
    )

class OutfitAnalysis(BaseModel):
    """The root response from the Claude Scene Analysis call."""
    detected_items: List[ClothingItemMetadata]
    overall_outfit_vibe: str = Field(..., description="A summary of the full look and how the items work together.")
```

## 3. Field Significance for the Style Agent

| Field | Purpose for Agent |
| :--- | :--- |
| **`formality_score`** | Allows the agent to filter items based on event type (e.g., "job interview" = 7-9). |
| **`material`** | Enables seasonal reasoning (e.g., "It's hot out" -> filter for Linen/Cotton). |
| **`visual_signature`** | Acts as a human-readable "fingerprint" for the agent to explain *why* it matched an item. |
| **`style_vibe`** | Enables personality-based queries (e.g., "I want to look more 'minimalist' today"). |
| **`box_2d`** | Required to perform surgical crops for local CLIP retrieval and thumbnails. |

## 4. Implementation via Anthropic Tool Use

To ensure Claude adheres to this schema, we will define it as a "Tool" in the Anthropic API call. 

**Prompt Strategy:**
> "You are an expert fashion archivist. Analyze the provided outfit photo. Identify each distinct garment. For each item, provide precise bounding boxes and rich metadata according to the `analyze_outfit` tool. Pay extreme attention to fabric texture and small details like buttons or stitching for the `visual_signature`."

## 5. Example Structured Output (JSON)
```json
{
  "detected_items": [
    {
      "box_2d": [120, 250, 450, 750],
      "category": "top",
      "sub_category": "Linen Button-Down",
      "primary_color": "Sand",
      "material": "Lightweight Linen",
      "pattern": "Solid",
      "fit": "relaxed",
      "formality_score": 6,
      "style_vibe": ["minimalist", "summer-chic", "coastal"],
      "visual_signature": "Single chest pocket on the left, white mother-of-pearl buttons, slightly wrinkled texture characteristic of linen."
    }
  ],
  "overall_outfit_vibe": "A relaxed, monochromatic summer look perfect for a resort or elevated casual event."
}
```
