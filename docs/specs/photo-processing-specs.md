# Specifications: Photo Processing Pipeline

## Overview
These specs cover the end-to-end flow from the camera capture on iOS to the asynchronous ML inference in the Python worker.

## Requirements

### Upload Flow
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **PHOTO-UI-001** | **When** the user captures an outfit photo, the Mobile Client **shall** `POST /photos` to create a record and receive an `uploadUrl`. | [x] |
| **PHOTO-API-001** | **Where** a request is authenticated, the API **shall** return a pre-signed S3 URL scoped to `user/{clerk_user_id}/{photo_id}.jpg`. | [x] |
| **PHOTO-API-002** | **Where** a `file_hash` is provided in the `POST /photos` request, the API **shall** check for an existing photo with the same hash for that user to ensure idempotency. | [x] |
| **PHOTO-UI-002** | **When** the Mobile Client starts the S3 upload, it **shall** use a background upload service to ensure completion even if the app is minimized. | [x] |
| **PHOTO-UI-003** | **When** the S3 upload completes, the Mobile Client **shall** `POST /photos/{id}/confirm` to notify the backend. | [x] |
| **PHOTO-API-003** | **When** a photo is confirmed, the API **shall** drop a JSON message onto the `photo-uploads` SQS queue and update status to `pending_processing`. | [x] |

### ML Inference Pipeline
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **PHOTO-SYS-001** | **When** the Worker pulls a message from SQS, it **shall** pull the photo metadata and start processing. | [x] |
| **PHOTO-SYS-002** | **When** processing starts, the Worker **shall** fetch the corresponding image from S3. | [x] |
| **PHOTO-SYS-003** | **When** an image is fetched, the Worker **shall** execute the OWL-ViT model to detect and crop clothing items (including person detection for background removal). | [x] |
| **PHOTO-SYS-004** | **When** a clothing item is cropped, the Worker **shall** execute the CLIP model to generate a 512-dimension vector embedding. | [x] |
| **PHOTO-DB-001** | **When** searching for matches, the Worker **shall** use pgvector cosine distance scoped by `closet_id` and `category`. | [x] |
| **PHOTO-DB-002** | **Where** a match has a cosine distance `< 0.12`, the Worker **shall** automatically update the `worn_count` and `last_worn_at` of the existing item. | [x] |
| **PHOTO-DB-003** | **Where** no match is found below the threshold, the Worker **shall** create a new `clothing_item` record, initialized with `worn_count = 1`. | [x] |
| **PHOTO-SYS-005** | **Where** an `ItemMatch` record already exists for the given `photo_id` and item, the Worker **shall** skip duplicate DB writes (idempotency). | [x] |
| **PHOTO-UI-004** | **When** all items in a photo have been processed, the system **shall** update the photo status to `processed`. | [x] |
