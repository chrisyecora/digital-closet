# Low-Level Design: Mobile Client (iOS)

## 1. Overview
The Mobile Client is a React Native iOS application designed for high-frequency outfit logging and wardrobe analytics. It is built using the **Expo** framework to leverage a high-performance, modular technical stack and unified development workflow. The client communicates with the FastAPI backend using `camelCase` JSON contracts.

## 2. Navigation & Global UI

### 2.1 Navigation Structure (Expo Router)
The app uses **Expo Router** for file-based routing, providing automatic deep linking and type-safe navigation.
1.  **Home**: `(tabs)/index.tsx` - Dashboard for insights and recent activity.
2.  **Camera**: `(tabs)/camera.tsx` - Visually distinct center tab for capturing/uploading outfits.
3.  **Closet**: `(tabs)/closet.tsx` - Grid view of all identified clothing items.

## 3. Screens & Features

### 3.1 Onboarding Flow
*   **Welcome**: Value prop and entry point.
*   **Auth (Clerk)**: Integrated via `@clerk/clerk-expo` for seamless social and email authentication.
*   **Permissions**: Sequential request for Camera access using modular permission hooks.

### 3.2 Home (Dashboard)
*   **Recent Activity**: Cards for the last 3 outfit photos.
*   **Dormant Items**: Highlighting items unworn for 60+ days.

### 3.3 Camera & Processing
*   **Viewfinder**: Powered by **expo-camera**.
*   **Actions**: Capture button + "Choose from Library" (Gallery access).
*   **Upload Flow**:
    1. `POST /photos`: Create record, optionally sending a `file_hash` for idempotency.
    2. S3 Upload: Perform a binary `PUT` request to the provided `uploadUrl`.
    3. `POST /photos/{id}/confirm`: Notify backend to start ML processing.
*   **Async Processing UI**: Immediate confirmation screen with a link to the Closet.

### 3.4 Closet & Item Management
*   **Closet Grid**: 2-column grid with category filter chips and dormancy indicators.
*   **Item Detail**: Displays wear history, category, color, and provides delete actions.

## 4. Technical Architecture

### 4.1 State & Data Management
*   **Navigation**: **Expo Router** (File-based routing).
*   **Auth**: Managed via **Clerk's Expo SDK**.
*   **Server State**: `TanStack Query` (React Query) for fetching items and photo status.
*   **API Client**: Custom `apiRequest` utility that handles authentication headers and error parsing.
*   **Response Formatting**: Consumes `camelCase` JSON from the API (e.g., `imageUrl`, `wornCount`, `lastWorn`).

### 4.2 Background & Connectivity
*   **Uploads**: Currently uses standard `fetch` with binary blobs for S3 uploads.
*   **Push Notifications**: (Future) Managed via **expo-notifications**.

## 5. Security & Permissions
*   **Secure Storage**: JWT session tokens stored securely via **expo-secure-store**.
*   **Permissions**: Minimal permission requests using module-specific APIs.
