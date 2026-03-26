from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    def generate_presigned_upload_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for uploading a file."""
        pass
