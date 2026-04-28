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
 S3 Bucket   FastAPI Routers
(raw photos)  (Python)
   |             |
   v             v
 SQS Queue   Postgres DB
   |          (RDS + pgvector)
   v
Backend Workers
(Python, containerized, scalable)
   |
   |---> OWL-ViT (detection + person removal)
   |---> CLIP (embedding generation + classification)
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
- Notifies FastAPI that upload is complete via `POST /photos/{id}/confirm`, triggering SQS message
- Receives push notification (APNs) when processing is complete
- Fetches closet data from `/items` endpoint on demand

#### 2. FastAPI (API Gateway)
- Single entry point for all client requests
- Routes upload notifications to the write path
- Routes closet fetch requests to the read path
- Handles authentication and rate limiting
- Issues pre-signed S3 URLs for direct photo uploads
- Centralized response formatting (camelCase) via Pydantic `BaseResponse`

#### 3. S3 Bucket
- Stores raw photo uploads and cropped clothing item images.
- Organized by user ID: `user/{user_id}/{photo_id}.jpg` for raw photos and `user/{user_id}/crops/{crop_id}.jpg` for items.

#### 4. SQS Queue
- Receives a message when a new photo upload is confirmed by the API
- Message payload: `user_id`, `photo_id`, `s3_key`
- Decouples upload volume from worker capacity
- Dead Letter Queue (DLQ) configured for failed processing jobs

#### 5. Backend Workers (Write Path)
- Containerized Python services deployed on ECS or EC2 auto-scaling group
- Poll SQS for new messages
- For each message:
  1. Fetch photo from S3
  2. Run OWL-ViT to detect person (for background removal) and crop individual clothing items
  3. Classify each item by category (top, bottom, dress, outerwear, shoes, accessory) and sub-category using CLIP zero-shot classification.
  4. Run CLIP on each cropped item to generate a 512-dimension embedding
  5. Query pgvector filtered by `closet_id` + `category` for similar embeddings (cosine distance < 0.12)
  6. Apply confidence tier logic and write results to Postgres (initial worn_count = 1)
  7. Store individual item crops back to S3 for fast frontend loading
- Scale horizontally during peak hours

#### 6. Database (Postgres + pgvector)
- Hosts both relational tables and pgvector extension
- pgvector handles embedding storage and cosine similarity search natively
- Idempotency enforced via `file_hash` in the `photos` table.

---

### Confidence Tier Logic

When a detected item's CLIP embedding is compared against existing closet embeddings via pgvector cosine distance:

| Distance Score | Action |
|-----------------|--------|
| < 0.12 | Auto-match to existing item, increment `worn_count` and update `last_worn_at` |
| >= 0.12 | Treat as new item, create new `clothing_items` record (worn_count = 1) |

---

### Embedding Index Strategy

To avoid iterating over every item in a user's closet on each upload, similarity search is scoped by metadata before the vector comparison runs:

1. pgvector query filters by `closet_id` + `category` first
2. Cosine similarity runs only against that small candidate set
3. Threshold of 0.12 (cosine distance) applied to the top result

---

### Database Schema

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| clerk_user_id | VARCHAR | Unique index |
| email | VARCHAR | Unique index |
| tier | ENUM | free, paid |
| created_at | TIMESTAMP | |

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
| name | VARCHAR | e.g. "Black T-Shirt" |
| description | TEXT | AI-generated description |
| category | ENUM | top, bottom, dress, outerwear, shoes, accessory |
| sub_category | VARCHAR | shirt, hoodie, jeans, etc. |
| color | VARCHAR | Primary color |
| s3_key | VARCHAR | Path to cropped item image |
| worn_count | INTEGER | Incremented on each match |
| last_worn_at | TIMESTAMP | Updated on each match |
| embedding | VECTOR(512) | CLIP embedding via pgvector |

#### photos
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| s3_key | VARCHAR | Path to raw photo in S3 |
| file_hash | VARCHAR | For upload idempotency |
| status | ENUM | awaiting_upload, pending_processing, processed, failed |
| taken_at | TIMESTAMP | When photo was captured |

#### item_matches
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| photo_id | UUID | FK → photos (CASCADE) |
| clothing_item_id | UUID | FK → clothing_items (CASCADE) |
| confidence_score | FLOAT | Cosine similarity score |
| was_confirmed | BOOLEAN | Did user confirm the match |
| was_corrected | BOOLEAN | Did user correct the match |
| correct_item_id | UUID | FK → clothing_items, if corrected |
