from config import settings
from .storage.base import StorageProvider
from .storage.minio import MinIOStorageProvider
# We will add S3 when cloud is implemented

from .queue.base import QueueProvider
from .queue.elasticmq import ElasticMQProvider
# We will add SQS when cloud is implemented

# Singleton instances
_storage_provider = None
_queue_provider = None

def get_storage_provider() -> StorageProvider:
    global _storage_provider
    if _storage_provider is None:
        if settings.app_env == "local":
            _storage_provider = MinIOStorageProvider()
        else:
            # TODO: Return S3StorageProvider when implemented
            raise NotImplementedError("Cloud storage provider not implemented yet.")
    return _storage_provider

def get_queue_provider() -> QueueProvider:
    global _queue_provider
    if _queue_provider is None:
        if settings.app_env == "local":
            _queue_provider = ElasticMQProvider()
        else:
            # TODO: Return SQSProvider when implemented
            raise NotImplementedError("Cloud queue provider not implemented yet.")
    return _queue_provider
