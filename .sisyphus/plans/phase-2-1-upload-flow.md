# Plan: Phase 2.1 - Upload Flow (S3 & API)

## Objective
Implement the core photo upload pipeline. The mobile app will request a pre-signed S3 URL from the backend, upload the photo directly to S3 (MinIO locally), and then notify the backend that the upload is complete so the backend can queue an SQS message for the ML worker.

## Context
- Phase 1 (Auth & DB) is complete.
- We have a plan for a local S3 mock (`local-s3-mock.md`) that adds MinIO to `docker-compose.yml` and sets up the S3 client utility in the backend. 
- This phase requires the local S3 mock to be executed (or at least MinIO running) before proceeding with Phase 2.1.

## Guardrails & Assumptions (from Metis)
- For testing on physical iOS devices, S3_ENDPOINT_URL must point to the host machine's LAN IP (e.g., 192.168.x.x:9000) instead of localhost.
- Standardize S3 key structure: user_{clerk_id}/{photo_uuid}.jpg.
- Pre-signed URLs TTL: 15 minutes.
- Idempotency: PATCH /photos/{id} should not enqueue duplicate messages if called twice.
- File constraints: Favor JPEG uploads; enforce MIME type validation in POST /photos.
- Status alignment: Ensure API status strings map to DB enums (AWAITING_UPLOAD, PENDING_PROCESSING).

---

## Implementation Steps

### Phase 1: Prerequisite - Local S3 Infrastructure
- [ ] Execute the local S3 mock plan to bring MinIO online (MinIO bucket: digital-closet-local).
- [ ] Ensure api/s3_client.py exists and is wired to use S3_ENDPOINT_URL when set.

### Phase 2: Backend API (`POST /photos`)
- [ ] Implement /photos logic to:
  - Validate request metadata (content-type, etc.).
  - Generate S3 key: user_{clerk_user_id}/{uuid}.jpg.
  - Create a pre-signed URL (15-minute TTL) via the S3 client.
  - Persist a Photo row with status AWAITING_UPLOAD and the S3 key.
  - Return photo_id, presigned_url, s3_key to client.

### Phase 3: Mobile App Upload Flow
- [ ] Build UI for selecting a photo (JPEG) and uploading to pre-signed URL.
- [ ] Ensure upload disables multiple submissions and uses correct Content-Type header (image/jpeg).
- [ ] Call PATCH /photos/{id} after a successful S3 PUT to trigger backend processing.

### Phase 4: Backend API (`PATCH /photos/{id}`)
- [ ] Validate photo exists and belongs to the user.
- [ ] Idempotent handling: if status already PENDING_PROCESSING or PROCESSED, return 200 without queuing another message.
- [ ] Update status to PENDING_PROCESSING and publish an SQS message with:
  ```json
  {
    "photo_id": "uuid",
    "s3_key": "user_{id}/{uuid}.jpg",
    "user_id": "uuid"
  }
  ```

---

## Verification & Acceptance Criteria
- [ ] Local end-to-end: MinIO bucket is created; presigned URL is returned; image uploaded via PUT to presigned URL.
- [ ] DB record for Photo shows status PENDING_PROCESSING after PATCH.
- [ ] SQS queue contains a message with the correct payload.

End of Phase 2.1 draft.
