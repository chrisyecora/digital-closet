# Digital Closet

Digital Closet is a mobile-first iOS application that uses AI-powered computer vision to build an intelligent, living wardrobe tracker. It aims to solve the "closet visibility" problem—where users repeatedly wear the same items while others go untouched for months—by letting the camera do the work.

## 🌟 The Vision

Most people own far more clothing than they actively wear. Existing wardrobe trackers fail because they require tedious manual data entry. Digital Closet replaces manual logging with a daily outfit photo, using AI to identify, categorize, and match garments to previous wear events.

The result is a zero-effort dashboard that surfaces:
- **Wear Frequency**: What are your most (and least) loved items?
- **Dormancy Alerts**: Which items haven't been touched in 30, 60, or 90 days?
- **Co-wear Patterns**: What items do you consistently pair together?

## 🚀 Core Pillars

### 1. Daily Photo Logging
Users snap a single photo of their outfit. Whether it's a mirror selfie, a flat lay, or a torso shot, the system is designed to handle unconstrained formats.

### 2. AI Clothing Detection (YOLO)
The system automatically detects individual clothing items and classifies them by category (top, bottom, shoes, etc.), color, and fit.

### 3. Instance Matching (CLIP + pgvector)
This is the core differentiator. Using OpenAI CLIP embeddings and `pgvector` similarity search, the system determines if a detected item is the *exact same physical garment* seen in a previous photo. This allows for precise wear tracking without manual tagging.

### 4. Intelligent Dashboard
A data-rich view of your wardrobe that highlights your style patterns and identifies "closet bloat" through dormancy flags.

## 🏗️ High-Level Architecture

The project is built with a focus on offloading heavy ML inference from the mobile device to a scalable, event-driven backend:

- **iOS App**: React Native (iOS-first experience).
- **FastAPI Gateway**: Orchestrates uploads, reads, and user management.
- **Inference Pipeline**: Asynchronous Python workers using YOLO for detection and CLIP for embedding generation.
- **Vector Database**: PostgreSQL with `pgvector` for native, high-performance similarity search.
- **Messaging**: SQS-based decoupling to handle bursty upload traffic gracefully.

## 🛠️ Tech Stack

- **ML**: PyTorch, Ultralytics YOLO, OpenAI CLIP.
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic.
- **Infrastructure**: AWS (S3, SQS, RDS, ECS), Docker Compose.
- **Mobile**: React Native.

---

*For technical implementation details and local development instructions, see [docs/local-setup.md](docs/local-setup.md).*
