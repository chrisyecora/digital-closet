#!/usr/bin/env python3
import time
import logging
import json
import boto3
import sys
import os
from io import BytesIO
from PIL import Image
import pillow_heif

# Register HEIF opener with PIL
pillow_heif.register_heif_opener()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Add API to sys.path to import DB models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api')))

import torch
from transformers import CLIPProcessor, CLIPModel
from ultralytics import YOLO

from config import settings
from database import SessionLocal
from db_models import Photo, PhotoStatus, ItemCategory, ClothingItem, ItemMatch, Closet

# COCO Classes we care about for YOLO filtering
ALLOWED_COCO_CLASSES = ["person", "tie", "backpack", "umbrella", "handbag", "suitcase"]

# Prompts for CLIP zero-shot classification
CATEGORY_PROMPTS = {
    ItemCategory.TOP: "a photo of a top, shirt, or t-shirt",
    ItemCategory.BOTTOM: "a photo of a bottom, pants, shorts, or skirt",
    ItemCategory.DRESS: "a photo of a dress",
    ItemCategory.OUTERWEAR: "a photo of outerwear, a jacket, or a coat",
    ItemCategory.SHOES: "a photo of shoes or sneakers",
    ItemCategory.ACCESSORY: "a photo of an accessory, hat, or bag"
}

# Negative prompts to filter out backgrounds/noise
NEGATIVE_PROMPTS = [
    "a photo of a person's face",
    "a photo of a cell phone",
    "a photo of a background",
    "a photo of skin",
    "a photo of a room",
    "a photo of a hand"
]

class Worker:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Load models
        logger.info("Loading YOLOv8n model...")
        self.yolo_model = YOLO("yolov8n.pt")
        
        logger.info("Loading CLIP model...")
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # Build combined text inputs for CLIP
        self.prompt_keys = list(CATEGORY_PROMPTS.keys()) + ["NEGATIVE_" + str(i) for i in range(len(NEGATIVE_PROMPTS))]
        self.text_prompts = list(CATEGORY_PROMPTS.values()) + NEGATIVE_PROMPTS
        
        # Init AWS/MinIO/ElasticMQ clients
        self.sqs = boto3.client(
            "sqs",
            endpoint_url=settings.sqs_endpoint,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_default_region,
        )
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_default_region,
        )

    def process_image(self, s3_key: str, photo_id: str, user_id: str):
        db = SessionLocal()
        photo = None
        try:
            photo = db.query(Photo).filter(Photo.id == photo_id).first()
            if not photo:
                logger.error(f"Photo {photo_id} not found in database.")
                return

            # Download image from S3
            logger.info(f"Downloading {s3_key} from bucket {settings.storage_bucket}")
            obj = self.s3.get_object(Bucket=settings.storage_bucket, Key=s3_key)
            image_data = obj['Body'].read()
            image = Image.open(BytesIO(image_data)).convert("RGB")
            
            # Run YOLO
            logger.info(f"Running YOLO inference on {photo_id}")
            results = self.yolo_model(image)
            boxes = results[0].boxes
            
            # Ensure closet exists for user
            closet = db.query(Closet).filter(Closet.user_id == user_id).first()
            if not closet:
                closet = Closet(user_id=user_id)
                db.add(closet)
                db.commit()

            processed_count = 0
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    # Class filtering
                    cls_id = int(box.cls[0].item())
                    cls_name = self.yolo_model.names[cls_id]
                    
                    if cls_name not in ALLOWED_COCO_CLASSES:
                        logger.debug(f"Skipping YOLO class: {cls_name}")
                        continue
                    
                    # Confidence check
                    conf = box.conf[0].item()
                    if conf < 0.25:
                        logger.debug(f"Skipping low confidence box ({conf:.2f})")
                        continue
                        
                    # Crop image
                    xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                    x1, y1, x2, y2 = xyxy
                    h = y2 - y1
                    
                    crops_to_process = []
                    if cls_name == "person":
                        # Heuristically slice the person to find top, bottom, and shoes separately
                        crops_to_process.append(("upper", image.crop((x1, y1 + 0.15*h, x2, y1 + 0.6*h))))
                        crops_to_process.append(("lower", image.crop((x1, y1 + 0.6*h, x2, y1 + 0.95*h))))
                        crops_to_process.append(("feet", image.crop((x1, y1 + 0.85*h, x2, y2))))
                    else:
                        crops_to_process.append(("item", image.crop((x1, y1, x2, y2))))
                    
                    for crop_name, crop in crops_to_process:
                        # Run CLIP for classification and embedding
                        inputs = self.clip_processor(
                            text=self.text_prompts, 
                            images=crop, 
                            return_tensors="pt", 
                            padding=True
                        ).to(self.device)
                        
                        with torch.no_grad():
                            outputs = self.clip_model(**inputs)
                            image_embeds = outputs.image_embeds
                            logits_per_image = outputs.logits_per_image
                            probs = logits_per_image.softmax(dim=1)
                        
                        # Find best matching prompt
                        best_idx = probs.argmax().item()
                        best_key = self.prompt_keys[best_idx]
                        confidence = probs[0, best_idx].item()
                        
                        # If it's a negative prompt or low confidence, discard
                        if isinstance(best_key, str) and best_key.startswith("NEGATIVE_"):
                            logger.debug(f"Discarding {crop_name} crop, matched negative prompt: {self.text_prompts[best_idx]}")
                            continue
                            
                        if confidence < 0.30:
                            logger.debug(f"Discarding {crop_name} crop due to low confidence ({confidence:.2f})")
                            continue
                        
                        # We found a clothing item!
                        category = best_key
                        embedding_vector = image_embeds[0].cpu().numpy().tolist()
                        
                        logger.info(f"Identified {category.value} in {crop_name} crop with confidence {confidence:.2f}")
                        
                        # Save to DB
                        item = ClothingItem(
                            closet_id=closet.id,
                            name=f"New {category.value.capitalize()}",
                            category=category,
                            embedding=embedding_vector
                        )
                        db.add(item)
                        db.flush() # Get item.id
                        
                        match = ItemMatch(
                            photo_id=photo.id,
                            clothing_item_id=item.id,
                            confidence_score=confidence
                        )
                        db.add(match)
                        processed_count += 1
                
            photo.status = PhotoStatus.PROCESSED
            db.commit()
            logger.info(f"Successfully processed photo {photo_id}. Found {processed_count} items.")

        except Exception as e:
            logger.error(f"Error processing photo {photo_id}: {e}")
            db.rollback()
            if photo:
                photo.status = PhotoStatus.FAILED
                db.commit()
        finally:
            db.close()

    def run(self, once=False):
        logger.info(f"Starting ML worker, polling {settings.sqs_queue_url}")
        while True:
            try:
                response = self.sqs.receive_message(
                    QueueUrl=settings.sqs_queue_url,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=10 # Long polling
                )
                
                messages = response.get("Messages", [])
                for message in messages:
                    receipt_handle = message['ReceiptHandle']
                    body = json.loads(message['Body'])
                    
                    photo_id = body.get("photo_id")
                    user_id = body.get("user_id")
                    s3_key = body.get("s3_key")
                    
                    if not all([photo_id, user_id, s3_key]):
                        logger.error(f"Invalid message format: {body}")
                    else:
                        logger.info(f"Processing message for photo {photo_id}")
                        self.process_image(s3_key, photo_id, user_id)
                        
                    # Delete message after processing (or failing permanently)
                    self.sqs.delete_message(
                        QueueUrl=settings.sqs_queue_url,
                        ReceiptHandle=receipt_handle
                    )
                if once:
                    break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                if once:
                    break
                time.sleep(5)

if __name__ == "__main__":
    worker = Worker()
    worker.run()
