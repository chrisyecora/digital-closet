from abc import ABC, abstractmethod
from typing import Dict, Any

class QueueProvider(ABC):
    @abstractmethod
    def send_message(self, message: Dict[str, Any]) -> str:
        """Send a message to the queue. Returns a message ID."""
        pass
