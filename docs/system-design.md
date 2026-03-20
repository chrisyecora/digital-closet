## Part 2: System Design

### Architecture Overview

Digital Closet is backed by a scalable, event-driven server-side architecture. All ML inference is handled server-side to ensure consistent performance across device types. The system is designed to handle bursty upload traffic gracefully via an async processing queue, with separate read and write paths for efficient scaling.

---

### High Level Architecture
```
iOS App (React Native)
        |
        v
   API Gateway (FastAPI)
   /         \
Upload      Read
Endpoint    Endpoint
   |             |
   v             v
 S3 Bucket   Reader Workers
(raw photos)  (Python)
   |             |
   v             v
 SQS Queue   Postgres DB
   |          (RDS + pgvector)
   v
Backend Workers
(Python, containerized, scalable)
   |
   |---> YOLO (detection + classification)
   |---> CLIP (embedding generation)
   |
   v
pgvector similarity search
   |
   v
Postgres DB
(write results)
```

---

### Component Breakdown

#### 1. iOS Client (React Native)
- Captures outfit photo via native camera module
- Uploads photo to S3 via a pre-signed URL (avoids routing large files through the API)
- Notifies FastAPI that upload is complete, triggering SQS message
- Receives push notification (APNs) when processing is complete
- Fetches closet data from read endpoint on demand

#### 2. FastAPI (API Gateway)
- Single entry point for all client requests
- Routes upload notifications to the write path
- Routes closet fetch requests to the read path
- Handles authentication and rate limiting
- Issues pre-signed S3 URLs for direct photo uploads

#### 3. S3 Bucket
- Stores raw photo uploads
- Organized by user ID and timestamp: `/{user_id}/{timestamp}/{photo_id}.jpg`
- Free tier: 5GB — sufficient for early beta
- S3 lifecycle policies control photo retention per subscription tier

#### 4. SQS Queue
- Receives a message when a new photo upload is confirmed by the API
- Message payload: `user_id`, `photo_id`, `s3_key`, `timestamp`
- Decouples upload volume from worker capacity
- Dead Letter Queue (DLQ) configured for failed processing jobs
- Visibility timeout: 90 seconds to account for inference latency

#### 5. Backend Workers (Write Path)
- Containerized Python services deployed on ECS or EC2 auto-scaling group
- Poll SQS for new messages
- For each message:
  1. Fetch photo from S3
  2. Run YOLO to detect and crop individual clothing items
  3. Classify each item by category (top, bottom, dress, outerwear, shoes, accessory) and sub-category (shirt, hoodie, jeans, etc.)
  4. Run CLIP on each cropped item to generate a 512-dimension embedding
  5. Query pgvector filtered by `user_id` + `category` + `sub_category` for similar embeddings
  6. Apply confidence tier logic and write results to Postgres
  7. Trigger APNs push notification to user
- Scale horizontally during peak hours

#### 6. Reader Workers (Read Path)
- Separate Python service optimized for read workloads
- Handles closet fetch, item detail, wear history, and dashboard aggregations
- Scales independently from write workers
- Queries Postgres directly — no SQS involvement

#### 7. Postgres Database (RDS)
- Single instance for MVP
- Hosts both relational tables and pgvector extension
- pgvector handles embedding storage and cosine similarity search natively
- Read replicas added later as read traffic grows

#### 8. Push Notifications (APNs)
- Notifies user when photo processing is complete
- Example: "Your outfit has been logged — 3 items identified"
- Drives re-engagement and confirms async processing completed

---

### Confidence Tier Logic

When a detected item's CLIP embedding is compared against existing closet embeddings via pgvector cosine similarity:

| Confidence Score | Action |
|-----------------|--------|
| > 0.85 | Auto-match to existing item, increment worn_count silently |
| 0.65 – 0.85 | Auto-match but prompt user: "Is this your navy crewneck?" |
| < 0.65 | Treat as new item, create new clothing_items row |

User corrections are logged in the `item_matches` table and fed back into the model retraining pipeline.

---

### Why Cosine Similarity

Cosine similarity measures the angle between two embedding vectors, not their magnitude. This makes it robust to lighting, contrast, and photo quality differences across daily outfit photos — where the same garment may produce vectors of different magnitudes depending on conditions. Euclidean distance would penalize those magnitude differences even when the underlying item is the same.

---

### Embedding Index Strategy

To avoid iterating over every item in a user's closet on each upload, similarity search is scoped by metadata before the vector comparison runs:

1. YOLO classifies category and sub-category — fast and cheap
2. pgvector query filters by `user_id` + `category` + `sub_category` first
3. Cosine similarity runs only against that small candidate set (typically single digits to low double digits)
4. Confidence thresholds applied to the top result

This keeps search fast and cheap regardless of closet size.

---

### Database Schema

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| created_at | TIMESTAMP | |
| subscription_tier | ENUM | free, paid |

#### closets
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| created_at | TIMESTAMP | |

#### clothing_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| closet_id | UUID | FK → closets |
| name | VARCHAR | e.g. "Navy Crewneck" |
| description | TEXT | AI-generated description |
| category | ENUM | top, bottom, dress, outerwear, shoes, accessory |
| sub_category | VARCHAR | shirt, hoodie, jeans, etc. |
| color | VARCHAR | Primary color |
| worn_count | INTEGER | Incremented on each match |
| last_worn_at | TIMESTAMP | Updated on each match |
| created_at | TIMESTAMP | |
| embedding | VECTOR(512) | CLIP embedding via pgvector |

#### photos
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| s3_key | VARCHAR | Path to raw photo in S3 |
| taken_at | TIMESTAMP | When photo was captured |
| processed_at | TIMESTAMP | When inference completed |
| status | ENUM | pending, processed, failed |

#### item_matches
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| photo_id | UUID | FK → photos |
| clothing_item_id | UUID | FK → clothing_items |
| confidence_score | FLOAT | Cosine similarity score |
| was_confirmed | BOOLEAN | Did user confirm the match |
| was_corrected | BOOLEAN | Did user correct the match |
| correct_item_id | UUID | FK → clothing_items, if corrected |
| created_at | TIMESTAMP | |

---

### ML Pipeline

#### Phase 1 — Detection & Classification
- Input: raw photo
- Output: bounding boxes + category + sub_category per detected item
- Model: YOLO (via Ultralytics)
- Training data: DeepFashion dataset to bootstrap

#### Phase 2 — Embedding Generation
- Input: cropped item image from YOLO bounding box
- Output: 512-dimension embedding vector
- Model: OpenAI CLIP (open source, self-hosted)
- No fine-tuning needed at MVP — pretrained embeddings sufficient

#### Phase 3 — Similarity Search
- Query: pgvector cosine similarity search
- Filter: `user_id` + `category` + `sub_category` before vector comparison
- Output: top match with confidence score

#### Phase 4 — Feedback Loop
- User corrections logged in `item_matches`
- Periodically retrain or fine-tune embedding model on correction data
- Confidence thresholds (0.85, 0.65) tuned over time based on real correction rates

---

### Infrastructure Stack

| Component | Service | Notes |
|-----------|---------|-------|
| Mobile | React Native | iOS first |
| API | FastAPI on ECS | Containerized Python |
| Photo Storage | AWS S3 | Pre-signed URLs for direct upload |
| Queue | AWS SQS | ElasticMQ locally, SQS in prod |
| Database | AWS RDS Postgres + pgvector | Single instance MVP |
| Workers | AWS ECS (Fargate) | Auto-scaling |
| Notifications | Apple APNs | Push on processing complete |
| ML Inference | Self-hosted CLIP + YOLO on EC2 GPU | g4dn.xlarge ~$0.50/hr |

---

### Scaling Considerations

- **Short term:** Single RDS instance, fixed EC2 GPU for inference, SQS absorbs traffic spikes
- **Medium term:** Read replicas for Postgres, inference worker auto-scaling, S3 lifecycle policies enforcing history paywall
- **Long term:** Migrate SQS to Kafka if event replay is needed (e.g. reprocessing old photos when a new model version ships), model distillation to reduce inference cost per request

---

### Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CLIP inference latency too high | Async queue + push notification — user never waits synchronously |
| Instance matching accuracy below 75% | Lean on user corrections early, tune thresholds with real data |
| S3 storage costs at scale | Paywall photo history, lifecycle policies delete old photos for free users |
| SQS message lost on worker crash | DLQ catches failures, retry logic in worker |
| Cold start latency on GPU instance | Keep one instance warm, scale from there |