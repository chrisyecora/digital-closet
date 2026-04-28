from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    def generate_presigned_upload_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for uploading a file."""
        pass

    @abstractmethod
    def generate_presigned_download_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for downloading a file."""
        pass

    @abstractmethod
    def delete_object(self, object_name: str) -> bool:
        """Delete an object from storage."""
        pass
