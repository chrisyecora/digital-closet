# Specifications: Closet Management

## Overview
These specs define the UI and API behavior for the user's digital wardrobe dashboard, wear frequency tracking, and borderline match resolution.

## Requirements

### Dashboard & Navigation
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **CLOSET-UI-001** | **When** the Closet tab is loaded, the Mobile Client **shall** fetch and display a 2-column grid of all items. | [ ] |
| **CLOSET-UI-002** | **When** a category filter is selected, the Mobile Client **shall** display only items matching that category. | [ ] |
| **CLOSET-UI-003** | **Where** an item's `last_worn_at` is older than 30, 60, or 90 days, the Mobile Client **shall** display a "Dormancy" indicator matching the filtered threshold. | [ ] |
| **CLOSET-UI-004** | **When** a user clicks an item, the Mobile Client **shall** display the Item Detail view including its wear history and co-wear patterns. | [ ] |
| **CLOSET-UI-005** | **When** the Dashboard is loaded, the Mobile Client **shall** display "Recent Activity," "Most Worn," "Dormant Items," and "Frequently Worn Together" sections. | [ ] |

### Manual Management
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **CLOSET-UI-006** | **When** a user taps the "+" button, the Mobile Client **shall** display the "Add Item" form with Name, Category, Sub-category, and Color fields. | [ ] |
| **CLOSET-API-004** | **When** a new item is manually added, the API **shall** persist the item record and initialize its `worn_count` to zero. | [ ] |

### Match Resolution
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **CLOSET-UI-007** | **When** a pending `ItemMatch` notification is received, the Mobile Client **shall** display a bottom-sheet confirmation prompt. | [ ] |
| **CLOSET-API-001** | **When** the Mobile Client sends `PATCH /item-matches/{id}` with `{ "status": "confirmed" }`, the system **shall** update the match and increment the item's wear count. | [ ] |
| **CLOSET-API-002** | **When** the Mobile Client sends `PATCH /item-matches/{id}` with `{ "status": "corrected", "clothing_item_id": "uuid" }`, the system **shall** reassign the match and adjust wear counts. | [ ] |

### Closet Insights & Limits
| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **CLOSET-API-003** | **When** stats are requested, the API **shall** return the total item count, top 5 most worn items this month, and co-wear patterns. | [ ] |
| **CLOSET-DB-001** | **Where** multiple distinct photos are logged on the same day, the system **shall** process each photo independently and use per-photo idempotency at the queue/backend layer to prevent duplicate processing of the same photo. | [ ] |
| **CLOSET-SYS-001** | **Where** a user's account has a "Free" tier, the API **shall** restrict access to outfit history older than 6 months. | [ ] |
| **CLOSET-UI-008** | **When** a "Free" user attempts to access history beyond 6 months, the Mobile Client **shall** display the Subscription/Paywall screen. | [ ] |
