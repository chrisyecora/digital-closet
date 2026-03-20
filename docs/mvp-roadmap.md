# Digital Closet MVP Roadmap

Based on the system design and project overview, here is the proposed Test-Driven Development (TDD) roadmap for building the Digital Closet MVP. We will follow a strict TDD approach: writing unit tests for expected behavior first, then implementing the logic to make the tests pass, ensuring continuous deployment confidence.

## Phase 1: Foundation & Infrastructure
**Goal:** Set up the local development environment, database, message queue, and basic service scaffolding.
*   **Infrastructure:** Run PostgreSQL (with `pgvector`) and ElasticMQ (SQS emulator) via Docker Compose.
*   **Database:** 
    *   *Test:* Write integration tests verifying database connection and `pgvector` extension availability.
    *   *Implement:* Initialize the database schema using Alembic, covering `users`, `closets`, `clothing_items`, `photos`, and `item_matches` tables. Enable the `vector` extension.
*   **API Service:** 
    *   *Test:* Write a unit test for the `/health` endpoint expecting a 200 OK status.
    *   *Implement:* Scaffold the FastAPI backend with health checks and basic dependency injection for DB and SQS.
*   **Worker Service:** 
    *   *Test:* Write a unit test verifying the ML worker can successfully connect to the local SQS queue and poll for messages.
    *   *Implement:* Scaffold the Python ML worker and configure it to poll the local SQS queue.
*   **Mobile App:** 
    *   *Test:* Write initial unit/component tests for the React Native iOS application verifying the root view renders.
    *   *Implement:* Initialize the React Native iOS application and verify it runs on the simulator.

## Phase 2: Core ML Pipeline (Worker)
**Goal:** Implement the asynchronous image processing logic using TDD.
*   **Image Retrieval:** 
    *   *Test:* Write unit tests mocking S3 to verify fetching logic handles successful and failed downloads correctly.
    *   *Implement:* Logic to fetch uploaded photos from S3 (or a local mock for development).
*   **Detection & Classification (YOLO):** 
    *   *Test:* Write unit tests with dummy images to verify the bounding box generation, cropping, and classification parsing.
    *   *Implement:* Integrate YOLO to detect clothing items in the photo, crop them, and classify their category/sub-category.
*   **Embedding Generation (CLIP):** 
    *   *Test:* Write unit tests with dummy cropped images to verify the 512-dimensional vector embedding generation.
    *   *Implement:* Integrate CLIP to generate vector embeddings for each cropped clothing item.
*   **Similarity Search (pgvector):** 
    *   *Test:* Write unit tests (with a test database) to insert mock embeddings and verify the cosine similarity search returns the correct nearest neighbors based on the `user_id`, `category`, and `sub_category` filters.
    *   *Implement:* The cosine similarity search logic in Postgres.
*   **Matching Logic:** 
    *   *Test:* Write unit tests for the confidence tier logic, covering all three thresholds (`> 0.85`, `0.65 - 0.85`, `< 0.65`) and verifying the expected outputs (auto-match, flag for review, create new).
    *   *Implement:* The confidence tier business logic.

## Phase 3: Backend API Development
**Goal:** Build the API endpoints for the mobile client using TDD.
*   **Photo Upload Flow:** 
    *   *Test:* Write unit tests verifying the endpoint returns a valid pre-signed URL and handles authentication/authorization correctly.
    *   *Implement:* Endpoint to generate pre-signed S3 URLs for direct client uploads.
*   **Upload Confirmation:** 
    *   *Test:* Write unit tests verifying the endpoint correctly parses client payload, drops a message onto the SQS queue, and returns the appropriate success response.
    *   *Implement:* Endpoint for the client to confirm a successful upload.
*   **Closet Data (Read Path):** 
    *   *Test:* Write unit tests verifying the endpoints fetch the user's closet dashboard data correctly, including item counts, wear counts, and dormancy alerts, based on mock DB data.
    *   *Implement:* Endpoints to fetch closet dashboard data.
*   **Match Resolution:** 
    *   *Test:* Write unit tests verifying the endpoint correctly handles user confirmations or corrections and updates the DB state appropriately.
    *   *Implement:* Endpoint to handle user confirmations or corrections for borderline item matches.
*   **Notifications (Stub):** 
    *   *Test:* Write unit tests verifying the notification logic is triggered with the correct payload upon worker completion.
    *   *Implement:* Logic to trigger push notifications (APNs) (can be mocked for MVP).

## Phase 4: Mobile Application (React Native)
**Goal:** Build the user-facing iOS application using TDD.
*   **Camera Integration:** 
    *   *Test:* Write component tests (using React Native Testing Library) to verify camera permissions handling and capture button logic.
    *   *Implement:* Native camera module integration.
*   **Upload Flow:** 
    *   *Test:* Write unit tests verifying the upload service successfully fetches a pre-signed URL and executes the direct S3 upload with proper progress tracking and error handling.
    *   *Implement:* Integrate with the API to get pre-signed URLs and upload photos directly to S3.
*   **Digital Closet Dashboard:** 
    *   *Test:* Write component tests verifying the dashboard renders tracked items correctly, handles filtering logic, and displays wear frequency and dormancy states based on mock data.
    *   *Implement:* UI to display tracked items, wear frequency, and filters.
*   **Match Confirmation UI:** 
    *   *Test:* Write component tests verifying the prompt UI renders correctly for pending matches and handles confirm/correct button actions by calling the correct API service.
    *   *Implement:* UI to prompt users to confirm or correct items.
*   **Push Notifications:** 
    *   *Test:* Write unit tests verifying the local handling of incoming APNs payloads and navigation updates.
    *   *Implement:* APNs integration to receive alerts.

## Phase 5: Integration, Testing & Polish
**Goal:** Ensure end-to-end functionality and prepare for beta usage.
*   **E2E Testing:** Verify the complete flow via automated E2E tests (e.g., using Detox for React Native or a similar suite): App Photo Capture -> S3 Upload -> API Confirmation -> SQS Queue -> Worker Processing (YOLO + CLIP) -> DB Write -> App Dashboard Update.
*   **Accuracy Tuning:** Test the YOLO detection and CLIP similarity matching with real-world outfit photos. Adjust the confidence thresholds (0.85, 0.65) if necessary.
*   **CI/CD Pipeline:** Set up automated CI workflows (e.g., GitHub Actions) to run all unit and integration tests on every pull request, enforcing that tests pass before any merge.

## Future Considerations (Post-MVP)
*   **Monetization / Tiers:** Implement the 6-month history limit for free users and unlimited history for paid users.
*   **Advanced Analytics:** Add co-wear patterns and outfit recommendations.
*   **Infrastructure:** Migrate to AWS (ECS, RDS, actual SQS, APNs).