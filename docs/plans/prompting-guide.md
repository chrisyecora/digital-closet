# Guide: Writing System Prompts for the Double-Claude Pipeline

This guide outlines the standardized approach for writing high-performance system prompts for the Digital Closet's AI-orchestrated pipeline. It follows Anthropic's best practices (Prompting 101) to ensure Claude 3.5 Sonnet operates as a high-precision spatial reasoning and identity arbitration engine.

## 1. Core Prompt Structure

Every system prompt in this pipeline MUST follow this hierarchical structure to maintain consistency and clarity:

1.  **Persona & Role Definition:** "You are an expert fashion archivist and spatial reasoning engine..."
2.  **Task Objective:** A high-level summary of what Claude is trying to achieve in this specific call.
3.  **Static Context (Background):** Definitions that never change (e.g., the 1-10 formality scale, allowed categories).
4.  **Dynamic Content (XML Tags):** Use `<photo>` or `<candidates>` tags to wrap the data being analyzed.
5.  **Step-by-Step Instructions:** A logical, numbered list of how Claude should process the visual information.
6.  **Constraints & Guardrails:** Rules on what NOT to do (e.g., "Do not guess if obscured").
7.  **Output Contract (JSON/Tool):** Instructions on how to format the final response.

---

## 2. Planning Prompt 1: Visual Grounding & Metadata

### **Objective**
To detect every clothing item in a photo, provide precise normalized bounding boxes, and extract high-fidelity metadata.

### **Prompting Strategy**
- **The Persona:** A "Technical Fashion Archivist" who sees beyond style to the physical construction of garments.
- **The "Grounding" Instruction:** Explicitly tell Claude to provide `box_2d` in `[ymin, xmin, ymax, xmax]` format, normalized to 0-1000.
- **Metadata Definitions:**
    - Provide the exact definitions for the **Formality Score (1-10)** in the system prompt so Claude has a reference point.
    - Provide a list of "Vibe Tags" but allow Claude to suggest new ones.
- **Dense Description Rule:** Instruct Claude that the `visual_signature` is for *identity identification*, not just description. It must capture "fingerprints" like unique stitching, button counts, or fabric texture (e.g., "three pearl buttons on a left-aligned placket").

---

## 3. Planning Prompt 2: Identity Arbitration (Visual RAG)

### **Objective**
To determine if a newly detected item is the *exact same physical garment* as one of the candidates from the user's closet.

### **Prompting Strategy**
- **The Persona:** A "Forensic Fabric Expert" tasked with verifying physical identity.
- **Comparison Logic:**
    - Instruct Claude to ignore lighting differences or body pose.
    - Focus on "Unique Markers": "Do the wear patterns match? Is the logo in the exact same position relative to the seam?"
- **The Decision Gate:**
    - Define a strict `isMatch` boolean.
    - Require a `reasoning` string that explains the decision based on specific visual evidence.
- **The "Null" Case:** Explicitly instruct Claude to return `matchId: null` if none of the candidates are an exact match, even if they are very similar styles.

---

## 4. General Best Practices (Anthropic Standard)

- **Use XML Tags:** Wrap all inputs in descriptive tags (e.g., `<input_image>`, `<closet_candidates>`). This helps Claude distinguish between instructions and data.
- **Iterative Empirical Testing:** We will test these prompts with "difficult" cases (e.g., two identical blue shirts where one has a small stain or a specific tag) to ensure the logic holds.
- **Negative Constraints:** Use phrases like "If you are less than 90% certain of a match, err on the side of 'New Item'."
- **Direct Tone:** Avoid conversational filler. Instructions should be imperative and surgical.

## 5. Next Steps
Once we begin implementation, we will literally map these strategies into the `VisionService` class in the `worker/` module.
