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
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Add API to sys.path to import DB models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api')))

import torch
from transformers import CLIPProcessor, CLIPModel, OwlViTProcessor, OwlViTForObjectDetection

from config import settings
from database import SessionLocal
from db_models import Photo, PhotoStatus, ItemCategory, ClothingItem, ItemMatch, Closet

# Target textual prompts for OWL-ViT
OWL_PROMPTS = {
    ItemCategory.TOP: "a photo of a top or shirt",
    ItemCategory.BOTTOM: "a photo of pants or shorts",
    ItemCategory.DRESS: "a photo of a dress",
    ItemCategory.SHOES: "a photo of shoes",
    ItemCategory.OUTERWEAR: "a photo of a jacket or outerwear",
    ItemCategory.ACCESSORY: "a photo of a bag or accessory"
}

def calculate_iou(box1, box2):
    """
    Calculate IoU of two bounding boxes.
    Boxes are in format [x1, y1, x2, y2]
    """
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    intersection_area = max(0, x2 - x1) * max(0, y2 - y1)
    
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    union_area = box1_area + box2_area - intersection_area
    
    if union_area == 0:
        return 0.0
    
    return intersection_area / union_area

class Worker:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Load models
        logger.info("Loading OWL-ViT model...")
        self.owl_processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
        self.owl_model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32").to(self.device)
        
        logger.info("Loading CLIP model...")
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # Build text inputs for OWL-ViT
        self.prompt_keys = list(OWL_PROMPTS.keys())
        self.text_prompts = list(OWL_PROMPTS.values())
        
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
            
            # Ensure closet exists for user
            closet = db.query(Closet).filter(Closet.user_id == user_id).first()
            if not closet:
                closet = Closet(user_id=user_id)
                db.add(closet)
                db.commit()

            # Run OWL-ViT
            logger.info(f"Running OWL-ViT inference on {photo_id}")
            inputs = self.owl_processor(text=[self.text_prompts], images=image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                outputs = self.owl_model(**inputs)
            
            # Phase 3 & 4: Inference and IoU deduplication
            target_sizes = torch.tensor([image.size[::-1]]).to(self.device)
            # Apply baseline confidence threshold (e.g., 0.10)
            logger.debug(f"Applying baseline confidence threshold 0.10...")
            results = self.owl_processor.post_process_object_detection(outputs=outputs, target_sizes=target_sizes, threshold=0.10)
            
            boxes = results[0]["boxes"].cpu().numpy().tolist()
            scores = results[0]["scores"].cpu().numpy().tolist()
            labels = results[0]["labels"].cpu().numpy().tolist()
            
            filtered_boxes = [] # store (box, score, label)
            logger.debug(f"Found {len(boxes)} raw boxes above 0.10 threshold.")
            for box, score, label in zip(boxes, scores, labels):
                logger.debug(f"Raw Box - Label: {self.prompt_keys[label].value}, Score: {score:.4f}, Box: {box}")
                filtered_boxes.append((box, score, label))
                
            # Filter overlapping boxes (IoU > 0.60)
            final_boxes = []
            for i, (box1, score1, label1) in enumerate(filtered_boxes):
                keep = True
                for j, (box2, score2, label2) in enumerate(filtered_boxes):
                    if i == j:
                        continue
                    iou = calculate_iou(box1, box2)
                    if iou > 0.60:
                        logger.debug(f"IoU Conflict (iou={iou:.4f}): Box {i} ({self.prompt_keys[label1].value}, score={score1:.4f}) vs Box {j} ({self.prompt_keys[label2].value}, score={score2:.4f})")
                        if score1 < score2 or (score1 == score2 and i > j):
                            logger.debug(f"Dropping Box {i} due to lower score or secondary index.")
                            keep = False
                            break
                if keep:
                    final_boxes.append((box1, score1, label1))
                    
            # Deduplicate by category: keep only the highest confidence box per category
            # This ensures we don't get duplicates like "left shoe" and "right shoe" separately
            logger.debug(f"Boxes after IoU deduplication: {len(final_boxes)}. Starting category deduplication...")
            unique_category_boxes = {}
            for box, score, label in final_boxes:
                category_name = self.prompt_keys[label].value
                if label not in unique_category_boxes:
                    logger.debug(f"Registering primary box for category '{category_name}' with score {score:.4f}")
                    unique_category_boxes[label] = (box, score, label)
                elif score > unique_category_boxes[label][1]:
                    logger.debug(f"Replacing box for category '{category_name}' (old score: {unique_category_boxes[label][1]:.4f}, new score: {score:.4f})")
                    unique_category_boxes[label] = (box, score, label)
                else:
                    logger.debug(f"Discarding lower-confidence box for category '{category_name}' (score {score:.4f} < {unique_category_boxes[label][1]:.4f})")
            
            final_boxes = list(unique_category_boxes.values())
            
            processed_count = 0
            # Phase 5: Embedding & Database Persistence
            for box, score, label in final_boxes:
                category = self.prompt_keys[label]
                x1, y1, x2, y2 = box
                
                logger.info(f"Identified {category.value} with confidence {score:.2f}")
                
                # Crop image
                crop = image.crop((x1, y1, x2, y2))
                
                # Run CLIP for embedding only
                clip_inputs = self.clip_processor(
                    images=crop, 
                    return_tensors="pt"
                ).to(self.device)
                
                with torch.no_grad():
                    clip_outputs = self.clip_model.get_image_features(**clip_inputs)
                    # Normalize embedding vector
                    image_embeds = clip_outputs / clip_outputs.norm(p=2, dim=-1, keepdim=True)
                    embedding_vector = image_embeds[0].cpu().numpy().tolist()
                
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
                    confidence_score=score
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
