import pytest
from unittest.mock import MagicMock, patch
from PIL import Image
from anthropic_service import AnthropicService
from anthropic_models import GroundedItem
from db_models import ItemCategory

@pytest.fixture
def anthropic_service():
    with patch('anthropic_service.Anthropic'):
        service = AnthropicService()
        return service

def test_get_grounded_items_success(anthropic_service):
    # Mock the response from Claude
    mock_item_data = {
        "box_2d": [100, 200, 300, 400],
        "category": "top",
        "sub_category": "t-shirt",
        "color": "blue",
        "material": "cotton",
        "pattern": "solid",
        "reasoning": "Detected a blue t-shirt."
    }
    
    mock_content = MagicMock()
    mock_content.type = "tool_use"
    mock_content.name = "record_detections"
    mock_content.input = {"items": [mock_item_data]}
    
    mock_response = MagicMock()
    mock_response.content = [mock_content]
    
    anthropic_service.client.messages.create.return_value = mock_response
    
    # Create a dummy image
    image = Image.new('RGB', (100, 100))
    
    items = anthropic_service.get_grounded_items(image)
    
    assert len(items) == 1
    assert isinstance(items[0], GroundedItem)
    assert items[0].category == ItemCategory.TOP
    assert items[0].sub_category == "t-shirt"
    assert items[0].box_2d == [100, 200, 300, 400]
    
    # Verify tool choice was correct
    anthropic_service.client.messages.create.assert_called_once()
    kwargs = anthropic_service.client.messages.create.call_args.kwargs
    assert kwargs["tool_choice"] == {"type": "tool", "name": "record_detections"}

def test_get_grounded_items_empty(anthropic_service):
    mock_response = MagicMock()
    mock_response.content = []
    
    anthropic_service.client.messages.create.return_value = mock_response
    
    image = Image.new('RGB', (100, 100))
    items = anthropic_service.get_grounded_items(image)
    
    assert len(items) == 0
