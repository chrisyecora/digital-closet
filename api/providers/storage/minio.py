import boto3
from botocore.config import Config
from .base import StorageProvider
from config import settings

class MinIOStorageProvider(StorageProvider):
    def __init__(self):
        self.bucket = settings.storage_bucket
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_default_region,
            config=Config(signature_version="s3v4"),
        )

    def generate_presigned_upload_url(self, object_name: str, expiration: int = 3600) -> str:
        try:
            response = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": object_name,
                    "ContentType": "image/jpeg" # Defaulting to JPEG for photos
                },
                ExpiresIn=expiration,
            )
            return response
        except Exception as e:
            # We would usually log this properly
            print(f"Error generating MinIO presigned URL: {e}")
            raise
