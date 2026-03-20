# Low-Level Design: API Gateway

## 1. Overview
The API Gateway serves as the primary entry point for the mobile client. It follows RESTful principles, treating photos, items, and matches as resources.

## 2. API Endpoints

### 2.1 Authentication (Clerk Integration)
*   **Auth Flow**: 
    1. Mobile app authenticates via Clerk SDK.
    2. API verifies the JWT session token in the `Authorization` header.

### 2.2 Photo Resource (`/photos`)
*   **POST `/photos`**
    *   **Purpose**: Creates a new photo record and prepares for upload.
    *   **Input**: `{ "taken_at": "ISO-8601" }`
    *   **Output (201 Created)**: `{ "id": "uuid", "upload_url": "s3-presigned-url" }`
    *   **Initial Status**: `awaiting_upload`
*   **PATCH `/photos/{id}`**
    *   **Purpose**: Updates photo status to trigger asynchronous processing.
    *   **Input**: `{ "status": "uploaded" }`
    *   **Action**: Verifies S3 file presence (optional head check), updates status to `pending_processing`, and enqueues SQS message.
*   **GET `/photos/{id}`**
    *   **Purpose**: Check processing status and retrieve identified items.

### 2.3 Closet & Items (`/closet`)
*   **GET `/closet/items`**: Fetches all unique clothing items in the user's closet.
*   **GET `/closet/items/{id}`**: Detailed view of an item including wear history.
*   **GET `/closet/summary`**: Aggregated dashboard stats (most worn, dormant counts).

### 2.4 Item Match Resource (`/item-matches`)
*   **PATCH `/item-matches/{id}`**
    *   **Purpose**: Resolves a borderline match (0.65 - 0.85 confidence).
    *   **Input (Confirm)**: `{ "status": "confirmed" }`
    *   **Input (Correct)**: `{ "status": "corrected", "clothing_item_id": "uuid" }`
    *   **Action**: Updates `was_confirmed` or `was_corrected` and adjusts wear counts.

## 3. Data Models (SQLAlchemy)

### 3.1 User & Closet
*   `User`: `id`, `clerk_user_id` (Unique), `email`, `tier`.
*   `Closet`: `id`, `user_id` (FK).

### 3.2 Items & History
*   `ClothingItem`: `id`, `closet_id`, `name`, `category`, `sub_category`, `color`, `worn_count`, `last_worn_at`, `embedding` (VECTOR 512).
*   `Photo`: `id`, `user_id`, `s3_key`, `status` (`awaiting_upload`, `pending_processing`, `processed`, `failed`), `taken_at`.
*   `ItemMatch`: `id`, `photo_id`, `clothing_item_id`, `confidence`, `status` (`pending`, `confirmed`, `corrected`).

## 4. Error Handling
*   **401 Unauthorized**: Clerk JWT is invalid or missing.
*   **404 Not Found**: Resource does not exist.
*   **409 Conflict**: Attempting to patch a photo that is already processing.

## 5. Security
*   **JWT Verification**: Custom FastAPI dependency using Clerk's JWKS.
*   **S3 Scoping**: Pre-signed URLs restricted to `user/{clerk_user_id}/` prefix.
