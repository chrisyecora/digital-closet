from config import settings
from .storage.base import StorageProvider
from .storage.minio import MinIOStorageProvider
# We will add S3 when cloud is implemented

from .queue.base import QueueProvider
from .queue.elasticmq import ElasticMQProvider
# We will add SQS when cloud is implemented

def get_storage_provider() -> StorageProvider:
    if settings.app_env == "local":
        return MinIOStorageProvider()
    else:
        # TODO: Return S3StorageProvider when implemented
        raise NotImplementedError("Cloud storage provider not implemented yet.")

def get_queue_provider() -> QueueProvider:
    if settings.app_env == "local":
        return ElasticMQProvider()
    else:
        # TODO: Return SQSProvider when implemented
        raise NotImplementedError("Cloud queue provider not implemented yet.")
