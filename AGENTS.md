# Digital Closet - Agentic Engineering Team

This document outlines the roles, constraints, testing procedures, and standards for AI agents operating in the `digital-closet` repository. Read this completely before writing code.

---

## 🛠️ Build, Lint, and Test Commands

**Agents must verify changes before completion.** Execute linting and tests immediately after modifying code.

### 🐍 Backend (API & Worker)
- **Install dependencies:** `cd api && poetry install` or `cd worker && poetry install`
- **Run dev server:** `cd api && poetry run uvicorn main:app --reload --port 8000`
- **Run migrations:** `cd api && poetry run alembic upgrade head`
- **Generate migration:** `cd api && poetry run alembic revision --autogenerate -m "description"`
- **Linting:** (Use Ruff if installed, otherwise PEP8 rules) `cd api && poetry run ruff check .` and `poetry run ruff format .`
- **Type Checking:** `cd api && poetry run mypy .`

**🧪 Running Python Tests (pytest)**
- **All tests:** `cd api && poetry run pytest`
- **Single test file:** `cd api && poetry run pytest tests/test_items.py`
- **Single test function (CRITICAL for agents):** `cd api && poetry run pytest tests/test_items.py::test_create_item`
- **With verbose output (for debugging):** `cd api && poetry run pytest -vv -s tests/test_items.py::test_create_item`

### 📱 Frontend (Mobile App - Expo/React Native)
- **Install dependencies:** `cd mobile/DigitalCloset && npm install`
- **Start Expo Server:** `cd mobile/DigitalCloset && npx expo start`
- **Linting:** `cd mobile/DigitalCloset && npm run lint`

**🧪 Running TypeScript Tests (Jest)**
- **All tests:** `cd mobile/DigitalCloset && npm test`
- **Single test file:** `cd mobile/DigitalCloset && npm test -- path/to/file.test.tsx`
- **Single test case (CRITICAL for agents):** `cd mobile/DigitalCloset && npm test -- -t "should render correctly"`

### 🐳 Infrastructure
- **Start Services (Postgres, ElasticMQ):** `docker compose up -d`

---

## 📏 Code Style Guidelines

Agents must strictly mimic the surrounding style. Do not introduce new libraries without explicit need.

### 🐍 Python (API & Worker - FastAPI/SQLAlchemy)
1. **Formatting:** Follow strict PEP 8. Use standard 4-space indentation. 
2. **Naming Conventions:**
   - **Variables/Functions:** `snake_case` (e.g., `process_image_data`)
   - **Classes:** `PascalCase` (e.g., `DatabaseManager`)
   - **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
   - **File Names:** `snake_case.py` (e.g., `db_models.py`)
3. **Imports:**
   - Group sequentially: Standard library imports -> Third-party imports -> Local application imports.
   - Use absolute imports over relative imports where feasible (`from api.core.config import settings`).
4. **Types:** Strict type hinting is mandatory (`Pydantic` models for validation, `typing` for function signatures). Use modern Python 3.12+ features (e.g., `list[str]` instead of `List[str]`).
5. **Error Handling:** 
   - Use FastAPI's `HTTPException` for routing errors: `raise HTTPException(status_code=404, detail="Not found")`
   - Handle external API/DB failures with `try/except` and log errors appropriately. Do not swallow exceptions blindly.
6. **Async/Await:** Use `async def` for all API route handlers, DB queries, and external I/O bound operations.

### 📘 TypeScript (Mobile - React Native/Expo)
1. **Formatting:** Use Prettier rules if applicable. 2-space indentation, single quotes (`'`), and mandatory semicolons (`;`).
2. **Naming Conventions:**
   - **Components/Interfaces:** `PascalCase` (e.g., `UserProfile`, `ButtonProps`)
   - **Variables/Functions/Hooks:** `camelCase` (e.g., `handlePress`, `useAuth`)
   - **File Names:** `kebab-case.tsx` (e.g., `themed-text.tsx`, `user-profile.ts`)
3. **Imports:**
   - Sort standard library -> Third-party (React/Expo) -> Internal components.
   - Use absolute path aliases when possible: `@/components/`, `@/hooks/`.
4. **Types:** 
   - Strictly type all props, state, and function returns. Avoid `any`. Use `interface` over `type` for object definitions where possible.
5. **Components & Styling:**
   - Use Functional Components with hooks.
   - Use `StyleSheet.create` for component-specific styles. Do not use inline styles unless necessary for dynamic layout.
   - Utilize existing themed components from `@/components` to ensure visual consistency.
6. **Error Handling & Promises:**
   - Handle promise rejections using `try/catch` in async functions.
   - Use the `void` operator for floating promises (e.g., `void WebBrowser.warmUpAsync();`).

---

## 🤖 Agent Roles & Constraints

- **@master (Chief Architect):** Read-only. Strategic oversight. Must approve major structural changes. Consults `docs/llds/`.
- **@frontend (UI Engineer):** Builds React Native (Expo) iterations. Scoped to `./mobile/DigitalCloset/`. Relies on `@/components`.
- **@backend (Systems Engineer):** FastAPI and ML logic. Scoped to `./api/`, `./worker/`, and `./migrations/`. Always uses Alembic for DB changes.
- **@fullstack (Integration):** Wires the UI to the API. Handles env configs safely.
- **@product-owner (QA):** Agentic sanity checker. Ensures the app compiles, runs, and linting passes before concluding a session.

---

## 🔐 Environment & Mandates

1. **Design First:** Read `docs/llds/` or `docs/specs/` before executing code changes.
2. **Environment Variables:** Reference `.env`. Never hardcode keys like `CLERK_SECRET_KEY` or `DATABASE_URL`.
3. **Database Migrations:** You MUST use Alembic for any SQLAlchemy model changes.
4. **No Chitchat Comments:** Add code comments only for complex logic ("why" not "what"). Do not use comments to explain changes to the user.
5. **Revert Rule:** Do not revert changes unless they break the build/tests or the user explicitly commands it.

---

## 📝 Documentation Map
- **HLD:** `docs/high-level-design.md` - Architectural overview.
- **System Design:** `docs/system-design.md` - Component interactions.
- **LLDs:** `docs/llds/` - Detailed design for specific services (always read these before beginning).
- **Specs:** `docs/specs/` - Feature requirements and logic.
- **Setup:** `docs/local-setup.md` - Environment configuration.

---

## 🚀 Git Workflow & Version Control
1. **Commit Messages:** Use the imperative mood (e.g., "Add photo upload endpoint", "Fix navigation bug in wardrobe"). Keep the first line under 72 characters.
2. **Commit Granularity:** Make atomic, logical commits. Do not lump unrelated changes together.
3. **Branching:** Use descriptive branch names like `feat/auth-integration`, `fix/camera-permissions`, or `chore/dependency-updates`.
4. **Pull Requests:** Provide a clear summary of changes, reasoning, and any follow-up tasks required.

---

## 📂 Repository Structure & Purpose
- `api/`: The backend core. Contains FastAPI routes, SQLAlchemy models, Pydantic schemas, and external API integrations.
- `worker/`: Background jobs and ML processing logic (e.g., PyTorch, YOLO, CLIP, Background task runners).
- `mobile/DigitalCloset/`: The frontend application powered by React Native Expo and Expo Router.
- `docs/`: Comprehensive documentation suite containing specs, designs, and architectural decisions.
- `migrations/`: Holds Alembic database migrations. Do not manually edit generated migration logic without testing.

---

## 🛑 Tooling & Model Constraints
- **Context7 MCP:** Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
- Avoid conversational filler in code. Your output must strictly be the necessary solution to the user's problem.
- When you do an open-ended search, use tools efficiently and parallelize operations (e.g., globbing multiple files at once).
- Do not make broad assumptions about unread files. Always `read` before you `edit`.
- **Cursor/Copilot Defaults:** Adhere to common IDE conventions, formatters, and auto-completions as configured in `.vscode` or specific workspace files. Ensure that the generated code is seamlessly compatible with Copilot and Cursor autocomplete workflows.

