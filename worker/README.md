# ML Worker (Phase 2.2) - Local Development

This directory contains the ML Worker that handles asynchronous processing of clothing items from uploaded photos in the **local development environment**.

## Local Infrastructure
The worker interacts with the following local services (managed via `docker-compose.yml`):
- **MinIO**: Local S3-compatible storage for photos.
- **ElasticMQ**: Local SQS-compatible message queue for processing tasks.
- **PostgreSQL**: Local database with `pgvector` for storing embeddings.

## Components
- `ml_worker.py`: Entrypoint for the worker process.
- `.sisyphus/plans/phase-2-2-ml-worker-detailed.md`: Detailed plan for local implementation.
- `.sisyphus/plans/phase-2-2-ml-worker-todos.md`: Granular to-do items for local development.

## Prerequisites
- Python 3.12
- Dependencies: `torch`, `torchvision`, `clip`, `ultralytics`, `pillow`, `boto3`.
- Local infrastructure running: `docker compose up -d`.

## Development
1. Ensure Phase 2.1 (Upload Flow) is functional.
2. Configure environment variables in `.env` to point to local services (e.g., `S3_ENDPOINT_URL=http://localhost:9000`).
3. Run the worker: `poetry run python ml_worker.py`.
