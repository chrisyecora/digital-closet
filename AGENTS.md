# Digital Closet - Agentic Engineering Team

This document defines the roles, constraints, and standards for AI agents operating in the `digital-closet` repository. All agents MUST use the `gemini-3-auto` model.

## 🤖 Agent Roles

### @master (Chief Architect)
- **Model:** `gemini-3-auto`
- **Role:** High-level strategy and architectural oversight. Interprets the "vibe" and mandates from `GEMINI.md`.
- **Constraint:** Read-only. Never writes code. Focuses on minimizing token usage in task delegation and ensuring design-first compliance.
- **Mandate:** Must approve all major architectural changes before implementation.

### @pm (Project Manager)
- **Model:** `gemini-3-auto`
- **Role:** Task verification and coordination. Updates `TODO.md` (if it exists) based on @master's architecture.
- **Workflow:** Only triggers @frontend or @backend when dependencies are met.
- **Constraint:** Does not write code. Focuses on task status and dependency management.

### @frontend (UI Engineer)
- **Model:** `gemini-3-auto`
- **Role:** Fast UI iterations using React Native (Expo) and Tailwind-like styling.
- **Scope:** `./mobile/DigitalCloset/app`, `./mobile/DigitalCloset/components`, `./mobile/DigitalCloset/hooks`.
- **Constraint:** Must use themed components from `@/components` to ensure visual consistency.

### @backend (Systems Engineer)
- **Model:** `gemini-3-auto`
- **Role:** API, Database logic, and ML Worker implementation.
- **Scope:** `./api`, `./worker`, `./migrations`.
- **Constraint:** Must ensure all database changes are accompanied by an Alembic migration.

### @fullstack (Integration)
- **Model:** `gemini-3-auto`
- **Role:** Connects UI to API. Handles environment variables, configuration, and end-to-end flows.
- **Scope:** Cross-cutting concerns between `mobile/` and `api/`.

### @product-owner (QA)
- **Model:** `gemini-3-auto`
- **Role:** Sanity checker. Ensures the app runs, linting passes, and mandates are followed before finishing a session.
- **Mandate:** Must run `npm run lint` and verify health checks before sign-off.

---

## 🛠️ Build & Development Commands

### Infrastructure (Docker)
- **Start Services:** `docker compose up -d` (Postgres/pgvector, ElasticMQ/SQS)
- **Stop Services:** `docker compose down`
- **Logs:** `docker compose logs -f`

### API Service (FastAPI)
- **Install:** `cd api && poetry install`
- **Run Dev:** `cd api && poetry run uvicorn main:app --reload --port 8000`
- **Migrations:** `cd api && poetry run alembic upgrade head`
- **Create Migration:** `cd api && poetry run alembic revision --autogenerate -m "description"`
- **Shell:** `cd api && poetry shell`

### Worker Service (ML)
- **Install:** `cd worker && poetry install`
- **Run:** `cd worker && poetry run python main.py`
- **Note:** PyTorch/CLIP are side-loaded via pip in the poetry env on Intel Macs.

### Mobile App (Expo/iOS)
- **Install:** `cd mobile/DigitalCloset && npm install`
- **Start:** `cd mobile/DigitalCloset && npx expo start`
- **iOS Simulator:** `cd mobile/DigitalCloset && npx expo start --ios`
- **Lint:** `cd mobile/DigitalCloset && npm run lint`
- **Reset:** `cd mobile/DigitalCloset && npm run reset-project`

---

## 📏 Code Style Guidelines

### General Mandates
1. **Design First**: Consult `docs/llds/` or `docs/specs/` before any code changes. Update docs if the implementation diverges.
2. **Type Safety**: Strict type hinting in Python (Pydantic/Type Hints) and TypeScript (Interfaces/Types).
3. **Environment Isolation**: Use `.env` files. Never hardcode secrets or URLs.
4. **Database Migrations**: All schema changes MUST use Alembic.

### Python (API & Worker)
- **Formatting**: Follow PEP 8. Use snake_case for variables/functions, PascalCase for classes.
- **Imports**: Group standard library, third-party, and local imports. Use absolute imports where possible.
- **Error Handling**: Use FastAPI's `HTTPException` for API errors.
  ```python
  raise HTTPException(status_code=404, detail="Item not found")
  ```
- **Async**: Use `async def` for route handlers and I/O bound operations.
- **Naming**: Files should be snake_case (e.g., `db_models.py`).

### TypeScript (Mobile/React Native)
- **Formatting**: Single quotes, semicolons, 2-space indentation.
- **Components**: Functional components with hooks. Use PascalCase for filenames and component names.
- **Imports**: Use `@/` alias for internal paths (e.g., `@/components/themed-text`).
- **Styles**: Use `StyleSheet.create` for component-specific styles. Prefer themed components from `@/components`.
- **Promises**: Use `void` for floating promises that don't need awaiting.
  ```typescript
  void WebBrowser.warmUpAsync();
  ```
- **Naming**: Files should be kebab-case (e.g., `themed-text.tsx`).

---

## 🧪 Testing Guidelines
*Note: The project currently lacks a formal test suite. When adding tests:*
- **Backend**: Use `pytest` and `httpx.AsyncClient` for API testing.
- **Mobile**: Use `jest` and `react-test-renderer` or `testing-library/react-native`.
- **Command**: `pytest` (API) or `npm test` (Mobile).
- **Single Test**: `pytest path/to/test.py::test_name` or `npm test -- -t 'test name'`.

---

## 📝 Documentation Map
- **HLD**: `docs/high-level-design.md` - Architectural overview.
- **System Design**: `docs/system-design.md` - Component interactions.
- **LLDs**: `docs/llds/` - Detailed design for specific services.
- **Specs**: `docs/specs/` - Feature requirements and logic.
- **Setup**: `docs/local-setup.md` - Environment configuration.

---

## 🚀 Git Workflow
- **Commit Messages**: Use imperative mood (e.g., "Add photo upload endpoint").
- **Branching**: Use descriptive branch names (e.g., `feat/auth-integration`).
- **PRs**: Include a summary of changes and reference relevant issues or docs.

---

## 📂 Project Structure
- `api/`: FastAPI backend service.
- `worker/`: ML inference worker (YOLO/CLIP).
- `mobile/DigitalCloset/`: React Native Expo application.
- `migrations/`: Alembic database migrations.
- `docs/`: Project documentation (HLD, LLDs, Specs).

---

## 🔐 Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `SQS_ENDPOINT`: Local ElasticMQ or AWS SQS endpoint.
- `SQS_QUEUE_URL`: URL for the photo processing queue.
- `CLERK_PUBLISHABLE_KEY`: Clerk authentication key (Mobile).
- `CLERK_SECRET_KEY`: Clerk authentication key (API).

---

## 🛠️ How to use this file
1. **Read First**: Every agent session should start by reading this file.
2. **Follow Mandates**: Adhere to the "Design First" and "Type Safety" mandates.
3. **Verify**: Use the provided commands to verify your work before completion.
