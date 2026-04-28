# Low-Level Design: API Gateway

## 1. Overview
The API Gateway serves as the primary entry point for the mobile client. It follows RESTful principles, treating photos, items, and matches as resources. It uses a Pydantic-based `BaseResponse` to automatically handle `snake_case` to `camelCase` conversion for the mobile client.

## 2. API Endpoints

### 2.1 Authentication (Clerk Integration)
*   **Auth Flow**: 
    1. Mobile app authenticates via Clerk SDK.
    2. API verifies the JWT session token in the `Authorization` header against Clerk JWKS.
    3. User record and Closet are automatically created on first successful authentication.

### 2.2 Photo Resource (`/photos`)
*   **POST `/photos`**
    *   **Purpose**: Creates a new photo record and prepares for upload.
    *   **Input**: `{ "taken_at": "ISO-8601", "file_hash": "string (optional)" }`
    *   **Idempotency**: If `file_hash` is provided, returns existing record if found.
    *   **Output (201 Created)**: `{ "id": "uuid", "uploadUrl": "s3-presigned-url" }`
    *   **Initial Status**: `awaiting_upload`
*   **POST `/photos/{id}/confirm`**
    *   **Purpose**: Notifies the backend that the upload is complete.
    *   **Action**: Updates status to `pending_processing` and enqueues SQS message for the ML worker.
    *   **Output (200 OK)**: `{ "id": "uuid", "status": "pending_processing", ... }`
*   **GET `/photos/{id}`**
    *   **Purpose**: Check processing status and retrieve identified items.

### 2.3 Items Resource (`/items`)
*   **GET `/items`**
    *   **Purpose**: Fetches all unique clothing items in the user's closet.
    *   **Output**: List of `ItemResponse` objects in `camelCase`.
*   **GET `/items/{id}`**
    *   **Purpose**: Detailed view of an item including wear history.
*   **DELETE `/items/{id}`**
    *   **Purpose**: Removes an item from the closet.
    *   **Action**: Deletes the database record and the corresponding S3 cropped image.
    *   **Safety**: DB transaction is committed before S3 object deletion.

### 2.4 Item Match Resource (`/item-matches`)
*   **PATCH `/item-matches/{id}`**
    *   **Purpose**: Resolves a borderline match.
    *   **Input (Confirm)**: `{ "status": "confirmed" }`
    *   **Input (Correct)**: `{ "status": "corrected", "clothing_item_id": "uuid" }`

## 3. Data Models (SQLAlchemy)

### 3.1 User & Closet
*   `User`: `id`, `clerk_user_id` (Unique), `email`, `tier`.
*   `Closet`: `id`, `user_id` (FK).

### 3.2 Items & History
*   `ClothingItem`: `id`, `closet_id`, `name`, `category`, `sub_category`, `color`, `s3_key`, `worn_count`, `last_worn_at`, `embedding` (VECTOR 512).
*   `Photo`: `id`, `user_id`, `s3_key`, `file_hash`, `status`, `taken_at`.
*   `ItemMatch`: `id`, `photo_id`, `clothing_item_id`, `confidence_score`, `was_confirmed`, `was_corrected`, `correct_item_id`.

## 4. Response Formatting
The API uses a global `BaseResponse` model that utilizes an `alias_generator` to convert `snake_case` Python attributes to `camelCase` JSON keys for compatibility with the React Native frontend.

## 5. Security
*   **JWT Verification**: Descriptive error messages (e.g., "Invalid token signature (kid mismatch)").
*   **Provider Singletons**: Efficient reuse of S3 and SQS client connections.
