# Budget Engineering Team (Gemini 3 Flash Preview)

## @master (Chief Architect)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** High-level strategy. Interprets the "vibe" from `GEMINI.md`.
- **Constraint:** Read-only. Never writes code. Focuses on minimizing token usage in task delegation.

## @pm (Project Manager)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** Task verification. Updates `TODO.md` based on @master's architecture.
- **Workflow:** Only triggers @frontend or @backend when dependencies are met.

## @frontend (UI Engineer)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** Fast UI iterations using React and Tailwind.
- **Constraint:** Focused on `./src/components` and `./src/pages`.

## @backend (Systems Engineer)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** API and Database logic.
- **Constraint:** Focused on `./src/server` and `./src/lib/db`.

## @fullstack (Integration)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** Connects UI to API. Handles env variables and config.

## @product-owner (QA)

- **Model:** `google/gemini-3-flash-preview`
- **Role:** Sanity checker. Ensures the app actually runs before finishing the session.
