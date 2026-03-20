# Low-Level Design: Inference Worker

## 1. Overview
The Inference Worker is an asynchronous Python service that processes outfit photos. It pulls messages from SQS, executes the ML pipeline, perform vector similarity searches, and updates the database.

## 2. Worker Pipeline (Step-by-Step)

### 2.1 Message Consumption & Locking
*   **Trigger**: Polls `photo-uploads` SQS queue.
*   **Atomic Lock**: Before processing, the worker attempts to claim the photo:
    ```sql
    UPDATE photos 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = :photo_id AND status = 'pending_processing'
    RETURNING id;
    ```
*   **Decision**: 
    *   If 0 rows: Skip (another worker is already processing).
    *   If 1 row: Proceed with ML inference.

### 2.2 Detection & Classification (YOLOv11)
*   **Input**: Full-size photo from S3.
*   **Process**: 
    1. Run YOLO object detection.
    2. Filter detections for clothing categories.
    3. Generate crops for each detected item.
*   **Output**: List of `{ bounding_box, category, sub_category, crop_image }`.

### 2.3 Embedding Generation (CLIP)
*   **Input**: `crop_image` from YOLO.
*   **Process**: Generate a 512-dimension normalized vector embedding using CLIP's image encoder.
*   **Output**: `vector_512`.

### 2.4 Similarity Search (pgvector)
*   **Input**: `user_id`, `category`, `sub_category`, `vector_512`.
*   **SQL Query**: Search is scoped by `category` only to prevent "sub-category silos."
    ```sql
    SELECT id, sub_category, embedding <=> :query_embedding AS distance
    FROM clothing_items
    WHERE closet_id = (SELECT id FROM closets WHERE user_id = :user_id)
      AND category = :category
    ORDER BY distance ASC
    LIMIT 3; -- Fetch top 3 to allow for sub-category boosting
    ```
*   **Confidence Calculation**: 
    1. Base Score: `1.0 - distance` (cosine similarity).
    2. Sub-category Boost: If `detected_sub_category == db_sub_category`, add `+0.05` to the score.
    3. Final Score: `min(1.0, base_score + boost)`.

### 2.5 Logic Branching (Confidence Tiers)
All tiers result in an `ItemMatch` record to ensure a complete audit trail and idempotency.

*   **Tier 1 (> 0.85)**: 
    *   Match to existing `clothing_item_id`.
    *   Increment `worn_count`, update `last_worn_at`.
    *   Create `ItemMatch` with `status="confirmed"`, `was_confirmed=True`.
*   **Tier 2 (0.65 - 0.85)**:
    *   Match to existing `clothing_item_id`.
    *   Increment `worn_count`, update `last_worn_at`.
    *   Create `ItemMatch` with `status="pending"`, `was_confirmed=False`.
*   **Tier 3 (< 0.65)**:
    *   Create NEW `clothing_item` record.
    *   Create `ItemMatch` with `status="confirmed"`, `clothing_item_id` pointing to the NEW item.

## 3. Concurrency & Performance
*   **Parallel Inference**: The worker will use `asyncio.gather` to process all detected items in a photo concurrently.
*   **Atomic Writes**: All DB updates for a single photo (items, matches, photo status) MUST be executed within a single ACID transaction.

## 4. Resilience & Idempotency
*   **Compute Cost Optimization**: The "Atomic Lock" in step 2.1 ensures that GPU-bound tasks (YOLO/CLIP) are executed only once per photo, even if SQS delivers the message multiple times.
*   **Status Gate**:
    1.  **Pre-ML Check**: Atomically set `status = 'processing'`. Skip if already `processing` or `processed`.
    2.  **Post-ML Check**: Final transaction (Section 3) verifies `status` again before commit.
*   **Visibility Timeout**: 90 seconds (sqs).
*   **Retry Policy**: SQS automatically retries on failure (up to 3 times).
*   **Dead Letter Queue (DLQ)**: Photos failing processing 3 times move to `photo-uploads-dlq`.


