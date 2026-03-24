from fastapi import Depends
from providers.factory import get_storage_provider, get_queue_provider
from providers.storage.base import StorageProvider
from providers.queue.base import QueueProvider
from typing import Annotated

# Use Annotated for cleaner dependency injection in routers
StorageDependency = Annotated[StorageProvider, Depends(get_storage_provider)]
QueueDependency = Annotated[QueueProvider, Depends(get_queue_provider)]
