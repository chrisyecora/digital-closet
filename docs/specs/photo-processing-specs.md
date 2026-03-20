# Specifications: Photo Processing Pipeline

## Overview
These specs cover the end-to-end flow from the camera capture on iOS to the asynchronous ML inference in the Python worker.

## Requirements

### Upload Flow
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **PHOTO-UI-001** | **When** the user captures an outfit photo, the Mobile Client **shall** `POST /photos` to create a record and receive an `upload_url`. | [ ] |
| **PHOTO-API-001** | **Where** a request is authenticated, the API **shall** return a pre-signed S3 URL scoped to `user/{clerk_user_id}/{timestamp}/{photo_id}.jpg`. | [ ] |
| **PHOTO-UI-002** | **When** the Mobile Client starts the S3 upload, it **shall** use a background upload service to ensure completion even if the app is minimized. | [ ] |
| **PHOTO-UI-003** | **When** the S3 upload completes, the Mobile Client **shall** `PATCH /photos/{id}` with `{ "status": "uploaded" }`. | [ ] |
| **PHOTO-API-002** | **When** a photo status is updated to `uploaded`, the API **shall** drop a JSON message onto the `photo-uploads` SQS queue. | [ ] |

### ML Inference Pipeline
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **PHOTO-SYS-001** | **When** the Worker pulls a message from SQS, it **shall** attempt an atomic database lock by setting `status = 'processing'`. | [ ] |
| **PHOTO-SYS-002** | **Where** the atomic lock is successful, the Worker **shall** fetch the corresponding image from S3. | [ ] |
| **PHOTO-SYS-003** | **When** an image is fetched, the Worker **shall** execute the YOLO model to detect and crop clothing items. | [ ] |
| **PHOTO-SYS-004** | **When** a clothing item is cropped, the Worker **shall** execute the CLIP model to generate a 512-dimension vector embedding. | [ ] |
| **PHOTO-DB-001** | **When** searching for matches, the Worker **shall** use pgvector cosine similarity scoped by `user_id` and `category`. | [ ] |
| **PHOTO-DB-002** | **When** calculating confidence, the Worker **shall** add a `+0.05` boost if the detected `sub_category` matches the database record. | [ ] |
| **PHOTO-DB-003** | **Where** a match has a final confidence score `> 0.85`, the Worker **shall** automatically update the `worn_count` and `last_worn_at`. | [ ] |
| **PHOTO-DB-004** | **Where** a match has a confidence score between `0.65` and `0.85`, the Worker **shall** create a pending `ItemMatch` for user confirmation. | [ ] |
| **PHOTO-DB-005** | **Where** a match has a confidence score `< 0.65`, the Worker **shall** create a new `clothing_item` record. | [ ] |
| **PHOTO-SYS-005** | **Where** an `ItemMatch` record already exists for the given `photo_id`, the Worker **shall** skip duplicate DB writes (idempotency). | [ ] |
| **PHOTO-UI-004** | **When** all items in a photo have been processed, the system **shall** trigger an APNs push notification to the user. | [ ] |

