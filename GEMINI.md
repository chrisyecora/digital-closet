# Digital Closet - AI-Powered Closet Management

This project is a comprehensive closet management system utilizing machine learning for image processing and vector search. It features a FastAPI backend, a dedicated machine learning worker, and a React Native mobile application.

## Project Overview

*   **API (`/api`)**: A FastAPI-based service handling business logic, user management, and health checks.
*   **Worker (`/worker`)**: A high-performance Python service dedicated to ML tasks, including object detection (YOLO) and image embedding (CLIP).
*   **Mobile (`/mobile`)**: A React Native application for user interaction, optimized for iOS.
*   **Database**: PostgreSQL with the `pgvector` extension for efficient vector similarity searches.
*   **Message Queue**: SQS (ElasticMQ) for asynchronous task processing between the API and Worker.
*   **Infrastructure**: Managed locally via Docker Compose, including PostgreSQL and SQS.

## Tech Stack

*   **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic.
*   **Worker/ML**: PyTorch (CPU), Ultralytics YOLO, OpenAI CLIP.
*   **Mobile**: React Native.
*   **Infra**: Docker, Docker Compose, ElasticMQ (SQS), PostgreSQL (pgvector).
*   **Dev Tools**: Poetry (Python dependency management).

## Local Development

Detailed setup instructions can be found in `docs/local-setup.md`.

### Infrastructure (Docker)
Start the local database and SQS emulator:
```bash
docker compose up -d
```

### API Service
```bash
cd api
poetry install
poetry run uvicorn main:app --reload
```
The health check is available at `http://localhost:8000/health`.

### Worker Service
The worker requires a specific setup on Intel Macs due to PyTorch/Poetry incompatibilities. ML libraries are installed via `pip` into the Poetry environment.
```bash
cd worker
poetry env use python3.12
poetry install
# Note: ML dependencies (torch, torchvision, ultralytics, clip) are side-loaded via pip
poetry run python main.py
```

### Mobile App (iOS)
```bash
cd mobile/DigitalCloset
npx react-native run-ios
```

## Development Conventions

*   **Environment Variables**: Managed via a root `.env` file, loaded by Python services using `python-dotenv`.
*   **Dependency Management**: Use `poetry` for all Python dependencies. If a dependency is incompatible with Poetry (like PyTorch on Intel Mac), install it into the environment using `poetry run pip install`.
*   **Database Migrations**: Managed via Alembic (setup in progress).
*   **Asynchronous Tasks**: Communication between the API and Worker happens via SQS queues defined in `elasticmq.conf`.
*   **Vector Search**: All item embeddings are stored as `vector` types in PostgreSQL for similarity matching.
