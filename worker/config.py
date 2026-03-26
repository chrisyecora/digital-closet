from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    app_env: Literal["local", "production"] = "local"
    database_url: str = "postgresql://digital_closet:digital_closet@localhost:5432/digital_closet_dev"
    
    # AWS/Storage Settings
    aws_access_key_id: str = "dummy"
    aws_secret_access_key: str = "dummy"
    aws_default_region: str = "us-east-1"
    
    # MinIO Specific (Local)
    minio_endpoint: str = "http://localhost:9000"
    storage_bucket: str = "digital-closet-local"
    
    # SQS / ElasticMQ Specific
    sqs_endpoint: str = "http://localhost:9324"
    sqs_queue_url: str = "http://localhost:9324/000000000000/photo-uploads"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
