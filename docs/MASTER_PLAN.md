# Digital Closet - Master Plan

## Architecture Overview
This plan outlines the development phases for the Digital Closet application, built on the following technology stack:
- **Frontend**: React Native (Expo)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with `pgvector`
- **Infrastructure**: AWS S3 (Storage), AWS SQS (Message Queue)
- **Machine Learning**: YOLO (Detection/Cropping), CLIP (512-dim Embeddings)
- **Authentication**: Clerk

---

## 🛡️ Verification & Validation Protocol (MANDATORY)
To ensure maximum precision and alignment, the following protocol MUST be followed:
1. **Step Verification**: After each individual task (e.g., 1.1.1) is completed, it must be verified using `lsp_diagnostics`, manual QA (via Bash/CLI), and relevant tests.
2. **Subphase Pause**: After each subphase (e.g., Phase 1.1) is fully completed and verified, the agent **MUST PAUSE** and wait for explicit user validation before proceeding to the next subphase.
3. **Course Correction**: If validation fails or requirements shift, the plan must be adjusted before resuming.

---

## Phase 1: Foundation (Auth & Infrastructure)
*Focus: Establishing secure user access, database schemas, and core API connectivity.*

- [x] **1.1 Frontend Authentication (Clerk & Expo)**
  - [x] Integrate Clerk Expo SDK for SignIn/SignUp flows.
  - [x] Implement OAuth providers (Apple/Google) via `expo-auth-session`.
  - [x] Configure `expo-secure-store` for secure local JWT storage.
  - [x] Implement automatic navigation routing/redirect to login on session expiry.
- [x] **1.2 Backend Authentication (FastAPI)**
  - [x] Implement JWT verification middleware against Clerk JWKS.
  - [x] Create the `users` table in PostgreSQL.
  - [x] Implement webhook or middleware logic to create a user record in the `users` table on first successful auth and initialize an empty closet.
- [x] **1.3 Database Setup**
  - [x] Provision PostgreSQL database.
  - [x] Enable and configure the `pgvector` extension for embedding storage.

## Phase 2: Core Pipeline (Photo Upload & ML)
*Focus: Building the asynchronous photo processing, object detection, and vector matching engine.*

- [ ] **2.1 Upload Flow (S3 & API)**
  - [ ] Create `POST /photos` endpoint to generate pre-signed S3 URLs.
  - [ ] Implement background photo upload from the React Native client.
  - [ ] Create `PATCH /photos/{id}` endpoint to confirm upload and publish a message to SQS.
- [ ] **2.2 ML Processing Worker (SQS, YOLO, CLIP)**
  - [ ] Set up SQS consumer with atomic locking to prevent duplicate processing.
  - [ ] Implement S3 fetch logic within the worker.
  - [ ] Integrate YOLO model to detect clothing items and crop the image.
  - [ ] Integrate CLIP model to generate 512-dimensional embeddings from the cropped images.
  - [ ] Ensure complete idempotency across the worker pipeline.
- [ ] **2.3 Vector Matching Engine (pgvector)**
  - [ ] Implement cosine similarity search using `pgvector` scoped by `user_id` and `category`.
  - [ ] Apply confidence-based routing logic with a `+0.05` boost if detected `sub_category` matches:
    - [ ] `> 0.85`: Auto-match to existing item (increment `worn_count` independently for each photo).
    - [ ] `0.65 - 0.85`: Flag as pending (requires user confirmation).
    - [ ] `< 0.65`: Create as a completely new item.

## Phase 3: UI/UX (Onboarding & Closet Management)
*Focus: Delivering the core user experience, from first launch to daily closet management.*

- [ ] **3.1 Onboarding Flow**
  - [ ] Build Welcome screen highlighting the app's value proposition.
  - [ ] Implement OS Permission requests (Camera, Notifications) with clear UI explanations on first signup.
  - [ ] Create the optional "Seed Your Closet" initial upload step.
  - [ ] Design and implement an engaging Empty State for the Home screen.
- [ ] **3.2 Closet Dashboard**
  - [ ] Build the main 2-column grid layout for clothing items.
  - [ ] Implement dashboard sections: "Recent Activity", "Most Worn", "Dormant Items", and "Frequently Worn Together".
  - [ ] Implement category filters (e.g., Tops, Bottoms, Shoes).
  - [ ] Add visual dormancy indicators for items unworn for 30, 60, and 90 days.
- [ ] **3.3 Item Management**
  - [ ] Build the Item Detail view displaying wear history and co-wear patterns.
  - [ ] Create a manual "Add Item" form as a fallback to the ML pipeline (Name, Category, Sub-category, Color).
  - [ ] Implement API logic to persist manually added items with an initial `worn_count` of zero.
- [ ] **3.4 Match Resolution**
  - [ ] Build a bottom-sheet UI for users to confirm/reject "pending" matches (0.65 - 0.85 confidence).
  - [ ] Connect the bottom-sheet to the `PATCH /item-matches/{id}` endpoint.
  - [ ] Support both `"confirmed"` status and `"corrected"` status (with a `clothing_item_id`) for manual reassignment and wear count adjustment.

## Phase 4: Advanced Features (Insights & Monetization)
*Focus: User retention features, push notifications, and revenue generation.*

- [ ] **4.1 Push Notifications**
  - [ ] Integrate APNs (Apple Push Notification service).
  - [ ] Trigger push notifications to the user when the asynchronous ML pipeline completes processing their photos.
- [ ] **4.2 Analytics & Insights**
  - [ ] Build the Insights view showing total closet count.
  - [ ] Calculate and display the "Top 5 Most Worn" items.
  - [ ] Analyze and display "Co-wear patterns" (items frequently worn together).
- [ ] **4.3 Monetization (Paywall)**
  - [ ] Implement logic to enforce a 6-month wear history limit for the "Free" tier.
  - [ ] Build the Paywall UI to upsell users attempting to view history beyond 6 months or access premium insights.
