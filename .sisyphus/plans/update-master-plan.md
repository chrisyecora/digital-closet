# Plan: Update Specs and MASTER_PLAN.md for Alignment

## Objective
Update `docs/specs/closet-management-specs.md` to remove the daily wear count limit, and update `docs/MASTER_PLAN.md` to perfectly map to all active requirements without introducing false constraints.

## Context
- `PHOTO-DB-002`: The +0.05 confidence boost for `sub_category` matches in pgvector search.
- **`CLOSET-DB-001` (UPDATED)**: Each photo is processed independently. Multiple distinct photos logged in the same day will increment the `worn_count` independently. Idempotency is handled at the queue/backend level per photo, so duplicate processing of the *same* photo is prevented, but separate outfits worn on the same day will count correctly.
- `CLOSET-UI-005`: Specific dashboard sections ("Recent Activity", "Most Worn", "Dormant Items", "Frequently Worn Together").
- `CLOSET-API-004`: API requirement to initialize `worn_count` to zero when persisting manually added items.
- `CLOSET-API-002`: Match Resolution API needs to support the `"corrected"` status with a specific `clothing_item_id`.

## Implementation Steps

### Phase 1: Update Specifications
- [x] Edit `docs/specs/closet-management-specs.md` > `CLOSET-DB-001`
  - [x] Change the requirement to: "**Where** multiple distinct photos are logged, the system **shall** increment the `worn_count` for an item independently for each photo, relying on queue idempotency to prevent duplicate processing of the same photo."

- [x] Phase 2.1 Backend S3 presigned URL generation and wiring to POST /photos
- [x] Edit `docs/MASTER_PLAN.md` > `Phase 2.3 Vector Matching Engine (pgvector)`
  - [x] Add the `+0.05` confidence boost logic if the detected `sub_category` matches the database record (ref: `PHOTO-DB-002`).
  - [x] **Ensure that no "once per day" limit is added to the routing logic.**

### Phase 3: Update MASTER_PLAN.md (UI/UX)
- [x] Edit `docs/MASTER_PLAN.md` > `Phase 3.2 Closet Dashboard`
  - [x] Explicitly list the required dashboard sections: "Recent Activity", "Most Worn", "Dormant Items", and "Frequently Worn Together" (ref: `CLOSET-UI-005`).
- [x] Edit `docs/MASTER_PLAN.md` > `Phase 3.3 Item Management`
  - [x] Add the backend requirement that manually added items must initialize with a `worn_count` of zero (ref: `CLOSET-API-004`).
- [x] Edit `docs/MASTER_PLAN.md` > `Phase 3.4 Match Resolution`
  - [x] Expand the endpoint description to explicitly support both `"confirmed"` and `"corrected"` statuses.
  - [x] Specify that `"corrected"` status must include a `clothing_item_id` for manual reassignment and wear count adjustment (ref: `CLOSET-API-002`).

## Final Verification Wave
- [x] **Specs Check**: Review `CLOSET-DB-001` to ensure the daily limit is removed. Review `docs/MASTER_PLAN.md` to ensure the remaining gaps are explicitly represented.
- [x] **Formatting Check**: Ensure the markdown structure (checkboxes, indentation, headings) remains perfectly intact and matches the surrounding style.
