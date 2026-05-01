# Architectural Evolution: The "Double-Claude" Orchestrated Pipeline

This document captures the final technical plan to migrate the Digital Closet ML pipeline to a high-fidelity, LLM-orchestrated system. This architecture replaces flaky local detection with high-reasoning Visual Grounding and Identity Arbitration using **Claude 3.5 Sonnet**.

## 1. Problem Statement
- **Detection Noise:** Local models (OWL-ViT, YOLO) struggle with garment overlaps (e.g., tucked shirts) and complex backgrounds, leading to poor crops.
- **Metadata Poverty:** Standard CV models only provide generic categories (e.g., "top"), which is insufficient for building an intelligent style agent.
- **Matching Ambiguity:** Cosine similarity on embeddings can identify "similar" items but fails to verify "identical" physical garments.

## 2. The Solution: Double-Claude Orchestration
We will implement a 4-step pipeline that uses Claude 3.5 Sonnet as both the "Eyes" (Grounding) and the "Judge" (Arbitration).

### Step 1: Visual Grounding & Scene Reasoning (Cloud)
- **Model:** Claude 3.5 Sonnet (via Anthropic Tool Use).
- **Task:** Act as a high-precision object detector and metadata engine.
- **Process:** Send the raw photo to Claude.
- **Output:** A structured JSON list of items containing:
    - `box_2d`: Precise [ymin, xmin, ymax, xmax] coordinates.
    - `metadata`: Rich details (Material, exact color, pattern, sub-category, brand guess).
- **Benefit:** Claude's spatial reasoning handles overlaps and folds far better than specialized CV models.

### Step 2: Surgical Retrieval (Local)
- **Model:** Python (PIL) + CLIP + pgvector.
- **Task:** Efficiently fetch the most likely candidates from the existing closet.
- **Process:** 
    1. Perform surgical crops using Claude's `box_2d` coordinates.
    2. Generate a CLIP embedding for each crop.
    3. Query the database for the **Top 5 candidates** in that category.

### Step 3: Identity Arbitration (Cloud)
- **Model:** Claude 3.5 Sonnet.
- **Task:** Perform high-precision verification (Visual RAG).
- **Process:** Send Claude a multi-image request containing the **New Item Crop** and **thumbnails of the Top 5 candidates**.
- **Prompt:** "Which of these 5 candidate images, if any, is the *exact same physical garment* as the new detection? Look for unique wear patterns, tags, or texture."
- **Output:** `match_id` or `null`.

### Step 4: High-Fidelity Persistence (Database)
- **Logic:**
    - **If Match Found:** Increment `worn_count`, update `last_worn_at`, and enrich the existing record with any new metadata Claude provided.
    - **If No Match:** Create a new `ClothingItem` record using the rich metadata from Step 1.

## 3. Implementation Plan

### Phase 1: Environment & Schema
1.  **Environment:** Ensure `ANTHROPIC_API_KEY` is in `.env`.
2.  **Dependencies:** Add `anthropic` to `worker/pyproject.toml`.
3.  **Schema Definition:** Create Pydantic models for the "Detection Tool" and "Arbitration Response."

### Phase 2: Worker Refactor (The "Double-Claude" Loop)
1.  **Refactor `process_image`:** 
    - Implement `get_grounded_items_from_claude()` (The Step 1 call).
    - Implement `identify_exact_match_from_claude()` (The Step 3 call).
2.  **Surgical Cropping:** Use standard PIL logic to execute the crops based on Claude's grounding.
3.  **Local Retrieval:** Standardize the CLIP retrieval to always return a fixed-size candidate list (e.g., Top 5).

### Phase 3: Validation & Portfolio
1.  **Mocking:** Heavily mock the Anthropic responses in `api/tests/` to allow for free, repeatable testing.
2.  **Impact:** This system provides the **High-Fidelity Knowledge Base** required to build a conversational Style Agent in the next major phase.

## 4. Resume & Portfolio Signal
- **LLM-Based Visual Grounding:** Using LLMs for complex coordinate-based spatial tasks.
- **Advanced Orchestration:** Building a multi-stage pipeline that bridges local CV (CLIP) with cloud reasoning (Claude).
- **High-Precision Identity Verification:** Solving the "Identity Problem" in CV using Visual Retrieval Augmented Generation (Visual RAG).
