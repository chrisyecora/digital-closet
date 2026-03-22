# Plan: Phase 2.2 - ML Processing Worker (SQS, YOLO, CLIP)

## Objective
Implement the asynchronous ML worker pipeline: consume SQS messages, fetch photos from S3, run YOLO to detect clothing items, crop images, generate 512-dim CLIP embeddings, and store results back in the database.

## Context
- Phase 2.1 (Upload Flow) must be in place so the worker has photos to process.
- The worker will be designed to be idempotent: processing the same queue item twice should not corrupt state or duplicate items.
- Initial scope focuses on local/dev parity using MinIO and ElasticMQ, with a plan to migrate to AWS infrastructure (SAM) in a later phase.

---

## Implementation Steps

### 2.2.1 Queue Consumer
- [ ] Implement an SQS consumer that polls the queue (photo-uploads) and retrieves messages.
- [ ] Ensure at-least-once processing semantics with idempotent retries.

### 2.2.2 S3 Fetch & Image Processing
- [ ] Fetch the image from S3 using the key provided in the queue message.
- [ ] Run YOLO model to detect clothing items and crop segments corresponding to items.
- [ ] Pass cropped regions through CLIP to generate embedding vectors (512-dim).
- [ ] Persist embeddings and item associations in PostgreSQL (pgvector).

### 2.2.3 End-to-End Verification
- [ ] Ensure the pipeline correctly updates the Photo/Item records with embeddings and metadata.
- [ ] Validate idempotency by re-sending the same message and ensuring no duplicate processing occurs.

---

## Verification Plan
- [ ] Run unit tests for each ML component (YOLO inference, CLIP embedding) if available.
- [ ] Manual smoke test: enqueue a test message and verify the end-to-end flow completes without errors.

---

## Dependencies
- Phase 2.1 must be completed and verified (S3 presigned URL flow).
- Local S3 (MinIO) and ElasticMQ must be running for local validation.

END OF PLAN
