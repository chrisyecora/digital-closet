# Low-Level Design: Inference Worker

## 1. Overview
The Inference Worker is an asynchronous Python service that processes outfit photos. It pulls messages from SQS, executes the ML pipeline, perform vector similarity searches, and updates the database. It uses OWL-ViT for zero-shot object detection and CLIP for image embedding and classification.

## 2. Worker Pipeline (Step-by-Step)

### 2.1 Message Consumption & Locking
*   **Trigger**: Polls `photo-uploads` SQS queue.
*   **Atomic Lock**: Before processing, the worker attempts to claim the photo by updating its status in the database.
*   **Decision**: 
    *   If already processing/processed: Skip.
    *   If pending: Proceed with ML inference.

### 2.2 Detection & Classification (OWL-ViT)
*   **Input**: Full-size photo from S3.
*   **Process**: 
    1. Run OWL-ViT to detect a person (for background removal/focus).
    2. Crop the image to the person's bounding box.
    3. Run OWL-ViT again on the cropped image to detect individual clothing items (tops, bottoms, shoes, etc.).
    4. Apply IoU-based deduplication and category-based filtering (highest confidence per category).
*   **Output**: List of `{ bounding_box, category, crop_image }`.

### 2.3 Embedding & Classification (CLIP)
*   **Input**: `crop_image` from OWL-ViT.
*   **Process**: 
    1. Generate a 512-dimension normalized vector embedding using CLIP.
    2. Perform zero-shot classification for sub-category and color using CLIP text prompts.
*   **Output**: `vector_512`, `sub_category`, `color`, `predicted_name`.

### 2.4 Similarity Search (pgvector)
*   **Input**: `closet_id`, `category`, `vector_512`.
*   **SQL Query**: Search is scoped by `category` and `closet_id` using cosine distance.
    ```sql
    SELECT id, embedding <=> :query_embedding AS distance
    FROM clothing_items
    WHERE closet_id = :closet_id
      AND category = :category
    ORDER BY distance ASC
    LIMIT 1;
    ```

### 2.5 Logic Branching (Distance Tiers)
*   **Auto-Match (< 0.12 distance)**: 
    *   Match to existing `clothing_item_id`.
    *   Increment `worn_count`, update `last_worn_at`.
    *   Create `ItemMatch` record.
*   **New Item (>= 0.12 distance)**:
    *   Create NEW `clothing_item` record with `worn_count = 1` and `last_worn_at = NOW()`.
    *   Upload the cropped item image to S3: `user/{user_id}/crops/{crop_id}.jpg`.
    *   Create `ItemMatch` record.

## 3. Concurrency & Performance
*   **Resource Reuse**: Uses singleton providers for S3 and SQS to minimize connection overhead.
*   **Atomic Writes**: All DB updates for a single photo (items, matches, photo status) are executed within a single transaction.

## 4. Resilience & Idempotency
*   **Upload Idempotency**: Handled at the API level via `file_hash`.
*   **Worker Idempotency**: Before creating matches or items, the worker verifies that a match for the specific photo and item hasn't already been recorded.
*   **Status Gate**: Final database update sets status to `processed` or `failed`.
