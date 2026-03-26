import boto3
import json
from typing import Dict, Any
from .base import QueueProvider
from config import settings

class ElasticMQProvider(QueueProvider):
    def __init__(self):
        self.queue_url = settings.sqs_queue_url
        self.sqs_client = boto3.client(
            "sqs",
            endpoint_url=settings.sqs_endpoint,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_default_region,
        )

    def send_message(self, message: Dict[str, Any]) -> str:
        try:
            response = self.sqs_client.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message),
            )
            return response.get("MessageId", "")
        except Exception as e:
            print(f"Error sending message to ElasticMQ: {e}")
            raise
