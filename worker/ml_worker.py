#!/usr/bin/env python3
import time
import logging
import json
import boto3
import sys
import os
import uuid
import numpy as np
import cv2
from sqlalchemy.sql import func
from io import BytesIO
from PIL import Image, ImageOps
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

COLORS = [
    "black", "white", "gray", "red", "blue", "green", "yellow", 
    "brown", "pink", "purple", "orange", "beige", "multicolor", "navy"
]

SUBCATEGORIES = {
    ItemCategory.TOP: ["t-shirt", "long sleeve shirt", "sweater", "hoodie", "tank top", "blouse", "polo shirt"],
    ItemCategory.BOTTOM: ["jeans", "trousers", "shorts", "sweatpants", "skirt", "leggings"],
    ItemCategory.SHOES: ["sneakers", "boots", "sandals", "dress shoes", "heels", "loafers"],
    ItemCategory.OUTERWEAR: ["jacket", "coat", "blazer", "vest", "cardigan"],
    ItemCategory.ACCESSORY: ["bag", "backpack", "hat", "belt", "scarf", "sunglasses", "watch", "tie"],
    ItemCategory.DRESS: ["casual dress", "formal dress", "maxi dress", "mini dress", "gown"],
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

def white_balance(image):
    """
    Apply OpenCV xphoto white balancing.
    Tries GrayworldWB first, then falls back to LearningBasedWB if available.
    """
    # Convert PIL to OpenCV (RGB to BGR)
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    try:
        logger.info("Applying GrayworldWB white balance...")
        wb = cv2.xphoto.createGrayworldWB()
        wb.setSaturationThreshold(0.9)
        img_bgr = wb.balanceWhite(img_bgr)
    except Exception as e:
        logger.warning(f"GrayworldWB failed: {e}. Trying LearningBasedWB...")
        try:
            wb = cv2.xphoto.createLearningBasedWB()
            img_bgr = wb.balanceWhite(img_bgr)
        except Exception as e2:
            logger.error(f"LearningBasedWB also failed: {e2}. Returning original image.")
            return image
            
    # Convert back to PIL (BGR to RGB)
    return Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))

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

    def process_image(self, s3_key: str, photo_id: str, user_id: str, dry_run: bool = False):
        db = SessionLocal()
        photo = None
        try:
            photo = db.query(Photo).filter(Photo.id == photo_id).first()
            if not photo:
                logger.error(f"Photo {photo_id} not found in database.")
                return

            if dry_run:
                logger.info(f"DRY RUN ENABLED for photo {photo_id}. Database changes will be rolled back at the end.")

            # Download image from S3
            logger.info(f"Downloading {s3_key} from bucket {settings.storage_bucket}")
            obj = self.s3.get_object(Bucket=settings.storage_bucket, Key=s3_key)
            image_data = obj['Body'].read()
            image = Image.open(BytesIO(image_data)).convert("RGB")
            
            # Apply white balance
            logger.info("Applying white balance to image...")
            image = white_balance(image)
            
            # Ensure closet exists for user
            closet = db.query(Closet).filter(Closet.user_id == user_id).first()
            if not closet:
                closet = Closet(user_id=user_id)
                db.add(closet)
                db.flush() # Get ID without necessarily committing yet (if dry run)
                if not dry_run:
                    db.commit()

            # Run OWL-ViT
            logger.info("Detecting person to crop background...")
            person_inputs = self.owl_processor(text=[["a photo of a person"]], images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                person_outputs = self.owl_model(**person_inputs)
            
            target_sizes = torch.tensor([image.size[::-1]]).to(self.device)
            person_results = self.owl_processor.post_process_object_detection(outputs=person_outputs, target_sizes=target_sizes, threshold=0.10)
            
            person_boxes = person_results[0]["boxes"].cpu().numpy().tolist()
            person_scores = person_results[0]["scores"].cpu().numpy().tolist()
            
            if person_scores:
                # Get index of highest score
                max_idx = person_scores.index(max(person_scores))
                best_score = person_scores[max_idx]
                
                if best_score > 0.25: # Higher threshold for person detection to avoid noise
                    px1, py1, px2, py2 = person_boxes[max_idx]
                    logger.info(f"Found person with confidence {best_score:.2f}. Cropping image.")
                    image = image.crop((px1, py1, px2, py2))
                    
                    # Save a debug crop of the person found in local environment
                    if settings.app_env == "local":
                        crop_dir = os.path.join(os.path.dirname(__file__), 'debug_crops')
                        os.makedirs(crop_dir, exist_ok=True)
                        person_crop_path = os.path.join(crop_dir, f"person_{photo_id[:8]}.jpg")
                        image.save(person_crop_path)
                        logger.info(f"Saved person crop to {person_crop_path}")
                else:
                    logger.info("No person detected with high enough confidence. Proceeding with original image.")
            else:
                logger.info("No person detected. Proceeding with original image.")
                
            # Run OWL-ViT for clothing on the (potentially cropped) image
            logger.info(f"Running OWL-ViT clothing inference on {photo_id}")
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
            # NOTE: This is an MVP constraint to prevent duplicate identifications 
            # (e.g. left shoe vs right shoe). Future iterations may use bbox overlap/IoU only.
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
            
            SIMILARITY_THRESHOLD = 0.12
            processed_count = 0
            
            report = {
                "identified_items": [],
                "similar_items": [],
                "actions": []
            }
            
            # Phase 5: Embedding & Database Persistence
            for box, score, label in final_boxes:
                category = self.prompt_keys[label]
                x1, y1, x2, y2 = box
                
                logger.info(f"Identified {category.value} with confidence {score:.2f}")
                report["identified_items"].append({"category": category.value, "confidence": score})
                
                # Crop image
                crop = image.crop((x1, y1, x2, y2))
                
                # Save debug crop in local environment
                if settings.app_env == "local":
                    crop_id = uuid.uuid4().hex[:8]
                    crop_filename = f"{category.value}_{crop_id}.jpg"
                    crop_dir = os.path.join(os.path.dirname(__file__), 'debug_crops')
                    os.makedirs(crop_dir, exist_ok=True)
                    crop_path = os.path.join(crop_dir, crop_filename)
                    crop.save(crop_path)
                    logger.info(f"Saved debug crop to {crop_path}")
                    report["identified_items"][-1]["crop_path"] = crop_path
                
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
                    
                    # Zero-shot classify Subcategory FIRST
                    subcat_list = SUBCATEGORIES.get(category, [category.value])
                    subcat_prompts = [f"a photo of a {s}" for s in subcat_list]
                    subcat_inputs = self.clip_processor(text=subcat_prompts, return_tensors="pt", padding=True).to(self.device)
                    subcat_features = self.clip_model.get_text_features(**subcat_inputs)
                    subcat_features = subcat_features / subcat_features.norm(p=2, dim=-1, keepdim=True)
                    subcat_similarities = (image_embeds @ subcat_features.T).squeeze(0)
                    predicted_subcat = subcat_list[subcat_similarities.argmax().item()]
                    
                    # Zero-shot classify Color SECOND
                    # Use a central crop for color classification to avoid background interference
                    w, h = crop.size
                    color_crop = crop.crop((w*0.2, h*0.2, w*0.8, h*0.8)) # 60% central area
                    color_clip_inputs = self.clip_processor(images=color_crop, return_tensors="pt").to(self.device)
                    color_image_features = self.clip_model.get_image_features(**color_clip_inputs)
                    color_image_features = color_image_features / color_image_features.norm(p=2, dim=-1, keepdim=True)
                    
                    color_prompts = [f"the fabric color is {c}" for c in COLORS]
                    color_inputs = self.clip_processor(text=color_prompts, return_tensors="pt", padding=True).to(self.device)
                    text_features = self.clip_model.get_text_features(**color_inputs)
                    text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
                    color_similarities = (color_image_features @ text_features.T).squeeze(0)
                    predicted_color = COLORS[color_similarities.argmax().item()]
                    
                    predicted_name = f"{predicted_color.capitalize()} {predicted_subcat}"
                    predicted_description = f"A {predicted_color} {predicted_subcat}."
                    
                    report["identified_items"][-1].update({
                        "color": predicted_color,
                        "sub_category": predicted_subcat,
                        "name": predicted_name
                    })
                
                # Query for closest match
                result = db.query(
                    ClothingItem, 
                    ClothingItem.embedding.cosine_distance(embedding_vector).label("distance")
                ).filter(
                    ClothingItem.closet_id == closet.id,
                    ClothingItem.category == category
                ).order_by(
                    "distance"
                ).first()
                
                closest_item, match_distance = None, None
                if result:
                    closest_item, match_distance = result
                
                if closest_item and match_distance < SIMILARITY_THRESHOLD:
                    logger.debug(f"Found matching item {closest_item.id} with distance {match_distance:.4f} < {SIMILARITY_THRESHOLD}")
                    item_id = closest_item.id
                    
                    report["similar_items"].append({
                        "category": category.value,
                        "item_id": str(item_id),
                        "distance": match_distance
                    })
                    report["actions"].append(f"Increment worn_count of existing {category.value} (ID: {item_id})")
                    
                    if not dry_run:
                        closest_item.worn_count = (closest_item.worn_count or 0) + 1
                        closest_item.last_worn_at = func.now()
                else:
                    if closest_item:
                        logger.debug(f"Closest item {closest_item.id} distance {match_distance:.4f} >= {SIMILARITY_THRESHOLD}, creating new item.")
                    else:
                        logger.debug(f"No existing items found for category {category.value}, creating new item.")
                        
                    report["actions"].append(f"Create new ClothingItem for {category.value}")
                    
                    # Save to DB
                    item = ClothingItem(
                        closet_id=closet.id,
                        name=predicted_name,
                        description=predicted_description,
                        category=category,
                        sub_category=predicted_subcat,
                        color=predicted_color,
                        embedding=embedding_vector
                    )
                    db.add(item)
                    db.flush() # Get item.id
                    item_id = item.id
                
                match = ItemMatch(
                    photo_id=photo.id,
                    clothing_item_id=item_id,
                    confidence_score=score
                )
                db.add(match)
                processed_count += 1
                
            photo.status = PhotoStatus.PROCESSED
            if not dry_run:
                db.commit()
                logger.info(f"Successfully processed photo {photo_id}. Found {processed_count} items.")
            else:
                db.rollback()
                logger.info(f"DRY RUN COMPLETE for photo {photo_id}. Found {processed_count} items. Changes discarded.")
                
            return report

        except Exception as e:
            logger.error(f"Error processing photo {photo_id}: {e}")
            db.rollback()
            if photo and not dry_run:
                photo.status = PhotoStatus.FAILED
                db.commit()
        finally:
            db.close()

    def run(self, once=False, dry_run=False):
        logger.info(f"Starting ML worker, polling {settings.sqs_queue_url} (dry_run={dry_run})")
        reports = []
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
                    
                    # Optional dry run override from message payload
                    msg_dry_run = body.get("dry_run", dry_run)
                    
                    if not all([photo_id, user_id, s3_key]):
                        logger.error(f"Invalid message format: {body}")
                    else:
                        logger.info(f"Processing message for photo {photo_id}")
                        report = self.process_image(s3_key, photo_id, user_id, dry_run=msg_dry_run)
                        if report:
                            reports.append(report)
                        
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
                
        return reports

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run the ML Worker")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (no database writes)")
    args = parser.parse_args()
    
    worker = Worker()
    worker.run(once=args.once, dry_run=args.dry_run)
