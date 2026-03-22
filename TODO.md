# Digital Closet - Project TODOs

## 🛡️ Verification & Validation Protocol (MANDATORY)
1. **Step Verification**: After each individual task (e.g., 1.1.1) is completed, it must be verified using `lsp_diagnostics`, manual QA (via Bash/CLI), and relevant tests.
2. **Subphase Pause**: After each subphase (e.g., Phase 1.1) is fully completed and verified, the agent **MUST PAUSE** and wait for explicit user validation before proceeding to the next subphase.
3. **Course Correction**: If validation fails or requirements shift, the plan must be adjusted before resuming.

---

## Phase 1: Foundation (Auth & Infrastructure)
### 1.1 Frontend Authentication (Clerk & Expo)
- [x] 1.1.1 Integrate Clerk Expo SDK for SignIn/SignUp flows.
- [x] 1.1.2 Implement OAuth providers (Apple/Google) via `expo-auth-session`.
- [x] 1.1.3 Configure `expo-secure-store` for secure local JWT storage.
- [x] 1.1.4 Implement automatic navigation routing/redirect to login on session expiry.
- [x] **PAUSE FOR USER VALIDATION (Phase 1.1)**

### 1.2 Backend Authentication (FastAPI)
- [x] 1.2.1 Implement JWT verification middleware against Clerk JWKS.
- [x] 1.2.2 Create the `users` table in PostgreSQL.
- [x] 1.2.3 Implement webhook or middleware logic to create a user record in the `users` table on first successful auth.
- [x] **PAUSE FOR USER VALIDATION (Phase 1.2)**

### 1.3 Database Setup
- [x] 1.3.1 Provision PostgreSQL database.
- [x] 1.3.2 Enable and configure the `pgvector` extension for embedding storage.
- [x] **PAUSE FOR USER VALIDATION (Phase 1.3)**

---

## Phase 2: Core Pipeline (Photo Upload & ML)
### 2.1 Upload Flow (S3 & API)
- [ ] 2.1.1 Create `POST /photos` endpoint to generate pre-signed S3 URLs.
- [ ] 2.1.2 Implement background photo upload from the React Native client.
- [ ] 2.1.3 Create `PATCH /photos/{id}` endpoint to confirm upload and publish a message to SQS.
- [ ] **PAUSE FOR USER VALIDATION (Phase 2.1)**

### 2.2 ML Processing Worker (SQS, YOLO, CLIP)
- [ ] 2.2.1 Set up SQS consumer with atomic locking to prevent duplicate processing.
- [ ] 2.2.2 Implement S3 fetch logic within the worker.
- [ ] 2.2.3 Integrate YOLO model to detect clothing items and crop the image.
- [ ] 2.2.4 Integrate CLIP model to generate 512-dimensional embeddings from the cropped images.
- [ ] 2.2.5 Ensure complete idempotency across the worker pipeline.
- [ ] **PAUSE FOR USER VALIDATION (Phase 2.2)**

### 2.3 Vector Matching Engine (pgvector)
- [ ] 2.3.1 Implement cosine similarity search using `pgvector`.
- [ ] 2.3.2 Apply confidence-based routing logic (> 0.85 auto-match, 0.65 - 0.85 pending, < 0.65 new item).
- [ ] **PAUSE FOR USER VALIDATION (Phase 2.3)**

---

## Phase 3: UI/UX (Onboarding & Closet Management)
### 3.1 Onboarding Flow
- [ ] 3.1.1 Build Welcome screen highlighting the app's value proposition.
- [ ] 3.1.2 Implement OS Permission requests (Camera, Notifications) with clear UI explanations on first signup.
- [ ] 3.1.3 Create the optional "Seed Your Closet" initial upload step.
- [ ] 3.1.4 Design and implement an engaging Empty State for the Home screen.
- [ ] **PAUSE FOR USER VALIDATION (Phase 3.1)**

### 3.2 Closet Dashboard
- [ ] 3.2.1 Build the main 2-column grid layout for clothing items.
- [ ] 3.2.2 Implement category filters (e.g., Tops, Bottoms, Shoes).
- [ ] 3.2.3 Add visual dormancy indicators for items unworn for 30, 60, and 90 days.
- [ ] **PAUSE FOR USER VALIDATION (Phase 3.2)**

### 3.3 Item Management
- [ ] 3.3.1 Build the Item Detail view displaying wear history and co-wear patterns.
- [ ] 3.3.2 Create a manual "Add Item" form as a fallback to the ML pipeline.
- [ ] **PAUSE FOR USER VALIDATION (Phase 3.3)**

### 3.4 Match Resolution
- [ ] 3.4.1 Build a bottom-sheet UI for users to confirm/reject "pending" matches (0.65 - 0.85 confidence).
- [ ] 3.4.2 Connect the bottom-sheet to the `PATCH /item-matches/{id}` endpoint.
- [ ] **PAUSE FOR USER VALIDATION (Phase 3.4)**

---

## Phase 4: Advanced Features (Insights & Monetization)
### 4.1 Push Notifications
- [ ] 4.1.1 Integrate APNs (Apple Push Notification service).
- [ ] 4.1.2 Trigger push notifications to the user when the asynchronous ML pipeline completes processing their photos.
- [ ] **PAUSE FOR USER VALIDATION (Phase 4.1)**

### 4.2 Analytics & Insights
- [ ] 4.2.1 Build the Insights view showing total closet count.
- [ ] 4.2.2 Calculate and display the "Top 5 Most Worn" items.
- [ ] 4.2.3 Analyze and display "Co-wear patterns" (items frequently worn together).
- [ ] **PAUSE FOR USER VALIDATION (Phase 4.2)**

### 4.3 Monetization (Paywall)
- [ ] 4.3.1 Implement logic to enforce a 6-month wear history limit for the "Free" tier.
- [ ] 4.3.2 Build the Paywall UI to upsell users attempting to view history beyond 6 months or access premium insights.
- [ ] **PAUSE FOR USER VALIDATION (Phase 4.3)**
