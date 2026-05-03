import base64
import logging
from io import BytesIO
from typing import List
from anthropic import Anthropic
from PIL import Image

from config import settings
from anthropic_models import GroundedItem

logger = logging.getLogger(__name__)

GROUNDING_SYSTEM_PROMPT = """
You are a high-precision visual grounding agent for a digital closet application. 
Your task is to identify every individual clothing item in the provided photo.

For each item you detect, you must provide:
1. box_2d: Precise [ymin, xmin, ymax, xmax] coordinates normalized to 0-1000.
2. category: One of top, bottom, one_piece, outerwear, footwear, activewear, swimwear, intimates, sleepwear.
3. sub_category: A specific description (e.g., "vintage graphic tee", "slim-fit indigo jeans").
4. color: The primary color of the item.
5. material: The material if identifiable (e.g., "denim", "cotton", "leather", "wool").
6. pattern: The pattern if any (e.g., "solid", "striped", "floral", "plaid").
7. reasoning: A brief explanation of why you identified this item and its boundaries.

Guidelines:
- Be extremely precise with bounding boxes. Avoid including too much background.
- If items are layered (e.g., a jacket over a shirt), provide boxes for both.
- Use your spatial reasoning to estimate the boundaries of tucked-in or partially obscured items.
- Focus ONLY on clothing, shoes, and significant accessories.
"""

class AnthropicService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-3-5-sonnet-20241022"

    def _encode_image(self, image: Image.Image) -> str:
        """Encode PIL image to base64 string."""
        buffered = BytesIO()
        # Convert to RGB if necessary (e.g., if it has alpha channel)
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    def get_grounded_items(self, image: Image.Image) -> List[GroundedItem]:
        """
        Send image to Claude 3.5 Sonnet to get grounded detections and metadata.
        """
        base64_image = self._encode_image(image)
        
        # Define the tool for structured output
        tools = [
            {
                "name": "record_detections",
                "description": "Record the detected clothing items and their properties.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "items": {
                            "type": "array",
                            "items": GroundedItem.model_json_schema()
                        }
                    },
                    "required": ["items"]
                }
            }
        ]

        logger.info("Sending image to Claude for visual grounding...")
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=GROUNDING_SYSTEM_PROMPT,
                tools=tools,
                tool_choice={"type": "tool", "name": "record_detections"},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": base64_image,
                                },
                            },
                            {
                                "type": "text",
                                "text": "Please identify all clothing items in this photo."
                            }
                        ],
                    }
                ],
            )

            # Extract tool use from response
            items = []
            for content in response.content:
                if content.type == "tool_use" and content.name == "record_detections":
                    raw_items = content.input.get("items", [])
                    for item_data in raw_items:
                        try:
                            items.append(GroundedItem(**item_data))
                        except Exception as ve:
                            logger.error(f"Failed to parse item data: {ve}. Data: {item_data}")
            
            logger.info(f"Claude detected {len(items)} items.")
            return items

        except Exception as e:
            logger.error(f"Error calling Anthropic API: {e}")
            raise

def get_grounded_items_from_claude(image: Image.Image) -> List[GroundedItem]:
    """
    Standalone function to get grounded items from Claude.
    """
    service = AnthropicService()
    return service.get_grounded_items(image)
