# Plan: Phase 2.2 - ML Processing Worker (SQS, YOLO, CLIP) - Local Development

## Objective
Implement an asynchronous ML worker for local development that consumes SQS messages from ElasticMQ, fetches images from MinIO, runs YOLO to detect clothing items and crops, generates 512-dimensional CLIP embeddings, and persists results in the local PostgreSQL database with idempotent behavior.

## Scope & Assumptions
- **Strictly Local**: This phase focuses exclusively on the local development environment using Docker Compose.
- Local development uses MinIO (S3 mock) and ElasticMQ (SQS mock).
- The worker is designed to be stateless with respect to ML model state but relies on the local shared DB to store results and embeddings.
- Use existing pgvector-enabled Postgres for embedding storage; align with CLOSET-DB-001 idempotency rules.
- Phase 2.1 must be implemented before Phase 2.2 to provide content and messaging payloads.

## Interfaces
- Input: Local SQS message (ElasticMQ) with fields such as photo_id, s3_key, user_id, and attempt counter.
- Output: Local DB updates (embedding vectors, match results), optional ItemMatch records, and updated Photo statuses.

## Data Model Changes (if needed)
- Add new Embedding entity/table or extend existing entities to store 512-d CLIP embeddings linked to (photo_id, clothing_item_id).
- Ensure mappings between Photo and ClothingItem exist for post-processing matches.

## Architecture Overview
- SQS Listener: poll or long-poll the queue (photo-uploads) with at-least-once semantics.
- Storage: fetch image from S3 using s3_key; YOLO model for detection; crop and save crops to temp buffers.
- Embeddings: pass crops through CLIP to produce embeddings; store embeddings in the database using pgvector.
- Persistence: create/update ClothingItem records; increment worn_count if a match is auto-identified; otherwise flag for review.
- Idempotency: use photo_id as the primary key for processing; ignore messages that have already been processed (status not in ['PENDING_PROCESSING', 'PROCESSED']).

## Implementation Tasks (granular)
1. Create worker entrypoint (e.g., worker/ml_worker.py) and a CLI/entrypoint for container usage.
2. Add dependencies to pyproject.toml: torch, torchvision, ultralytics, clip, pillow, boto3, pika/aws-sqs library if needed.
3. Implement SQS client/consumer logic:
   - Poll messages with visibility timeout; implement exponential backoff.
   - Decode message payload; validate required fields.
4. Implement S3 fetch logic:
   - Use boto3 client from the shared s3_client (if available) or create a minimal S3 fetch utility.
5. YOLO inference:
   - Load pre-trained YOLO model; run inference on image; extract bounding boxes for clothing categories.
   - Crop and store region images for embedding.
6. CLIP embeddings:
   - Run CLIP to generate 512-d embeddings for each cropped region.
   - Persist embeddings in pgvector columns associated with clothing items.
7. Database integration:
   - Persist new embeddings; update or create ClothingItem records; update Photo statuses as needed.
8. Idempotency safeguards:
   - Ensure re-processing of same photo_id does not duplicate results; guard against duplicate ItemMatches.
9. Logging & error handling:
   - Structured logs, clear error paths, and retry handling.
10. Tests:
   - Write smoke tests for end-to-end path using local SQS and S3 mocks.
11. Documentation:
   - Update README/docs with worker flow and endpoints.

## Verification & Acceptance Criteria
- [ ] The worker starts and consumes messages from the local SQS queue in a controlled test.
- [ ] YOLO detects clothing items and crops are produced for embedding.
- [ ] CLIP embeddings are generated and stored in the database.
- [ ] Idempotency works: re-sending the same message does not duplicate results.
- [ ] End-to-end test demonstrates that a single photo yields embeddings and a match (or pending review) entry in the database.

## Dependencies & Rollout
- Depends on Phase 2.1 to produce valid S3 objects and messages.
- Local dev prerequisites: MinIO, ElasticMQ running with proper credentials and endpoints.

END OF PLAN
