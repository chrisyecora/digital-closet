# Plan: Local S3 Development Environment (MinIO)

## Objective

Establish a local S3-compatible storage solution (MinIO) using `docker-compose` to unblock Phase 2 (Upload Flow) without requiring real cloud infrastructure immediately.

## Context

Phase 2 of the `MASTER_PLAN.md` focuses on the Photo Upload & ML Pipeline. To support this locally, we need a local equivalent to AWS S3. We are splitting the local development mock from the actual AWS SAM cloud infrastructure plan to allow for faster local iteration.

## Guardrails & Assumptions

- **Tooling**: We will use **MinIO** via Docker for local S3 emulation.
- **Local Network Routing**: The Mobile simulator needs to reach the local MinIO instance. The API must return pre-signed URLs using `http://localhost:9000` (or the machine's local IP address) instead of internal docker hostnames (e.g., `minio:9000`), so the mobile app can resolve them.
- **Initialization**: The bucket must be created automatically when `docker-compose up` is run, ensuring a seamless developer experience.

---

## Implementation Steps

### Phase 1: Docker Compose Configuration

- [ ] Edit `docker-compose.yml` to add the `minio` service. Expose ports `9000` (API) and `9001` (Console). Set default credentials (e.g., `MINIO_ROOT_USER=minioadmin`, `MINIO_ROOT_PASSWORD=minioadmin`).
- [ ] Add a `minio-init` service to `docker-compose.yml` that uses the `minio/mc` image. This container should run a script to create the `digital-closet-local` bucket on startup (use `--ignore-existing` for idempotency) and then exit.
- [ ] Add a healthcheck to the `minio` service to ensure it is ready before `minio-init` or the API attempts to connect.

### Phase 2: Environment Configuration

- [ ] Update `api/.env.example` to include the new S3 configuration variables:
  - `S3_ENDPOINT_URL=http://localhost:9000`
  - `S3_BUCKET=digital-closet-local`
  - `AWS_ACCESS_KEY_ID=minioadmin` (or match compose)
  - `AWS_SECRET_ACCESS_KEY=minioadmin` (or match compose)
  - `AWS_REGION=us-east-1` (dummy region for boto3)
- [ ] Ensure the root `.env` file (if used for compose) is also updated with these dummy credentials.

### Phase 3: S3 Client Utility

- [ ] Create `api/s3_client.py`.
- [ ] Implement a shared utility function to initialize `boto3.client('s3')`.
- [ ] **Crucial Logic**: The client must check for the presence of the `S3_ENDPOINT_URL` environment variable. If present (local dev), it MUST configure the `boto3` client to use that endpoint. If absent (cloud), it should fall back to standard AWS routing.
- [ ] Update `api/main.py` to import and utilize this utility, ensuring `POST /photos` (currently a placeholder) is prepared to use it.

---

## Final Verification Wave

- [ ] **Local Storage**: Run `docker compose up -d` and verify the `digital-closet-local` bucket is created automatically without manual intervention.
- [ ] **Console Access**: Verify you can access the MinIO console at `http://localhost:9001` using the configured credentials.
- [ ] **API Initialization**: Restart the FastAPI dev server and ensure it starts up without `boto3` configuration errors related to missing credentials or endpoints.