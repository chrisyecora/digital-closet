## Closet Management Specs Update (CLOSET-DB-001)
- Updated CLOSET-DB-001 to reflect per-photo independence and idempotency.
- Removed the daily cap on wear count increments.
- Documented that the system uses per-photo idempotency at the queue/backend layer to prevent duplicate processing.
