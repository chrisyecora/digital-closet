# Low-Level Design: Mobile Client (iOS)

## 1. Overview
The Mobile Client is a React Native iOS application designed for high-frequency outfit logging and wardrobe analytics. It follows a clean, iOS-native aesthetic with a focus on asynchronous processing and glanceable insights.

## 2. Navigation & Global UI

### 2.1 Navigation Structure (Bottom Tabs)
1.  **Home**: Dashboard for insights and recent activity.
2.  **Camera**: Visually distinct center tab for capturing/uploading outfits.
3.  **Closet**: Grid view of all identified clothing items.

### 2.2 Global Header & Sidebar
*   **Header**: Displays the app logo (left) and user profile picture (right).
*   **Sidebar**: Tapping the profile picture slides in a right-aligned menu for Profile, Settings, Subscription, and Logout.

## 3. Screens & Features

### 3.1 Onboarding Flow
*   **Welcome**: Value prop and entry point.
*   **Auth (Clerk)**: Social (Apple/Google) and email/password authentication.
*   **Permissions**: Sequential request for Camera and Push Notification access.
*   **Seed Closet**: Optional step to manually add items before the first photo. Recommendation to skip for now and take outfit of the day pictures to not overwhelm.

### 3.2 Home (Dashboard)
*   **Recent Activity**: Cards for the last 3 outfit photos.
*   **Most Worn**: Horizontal scroll of top 5 items this month.
*   **Dormant Items**: Filtering by 30/60/90 days of inactivity.
*   **Frequently Worn Together**: AI-surfaced co-wear patterns.

### 3.3 Camera & Processing
*   **Viewfinder**: Powered by `react-native-vision-camera`.
*   **Actions**: Capture button + "Choose from Library" (Gallery access).
*   **Preview**: "Use Photo" triggers S3 upload and processing; "Retake" resets.
*   **Async Processing UI**: Immediate confirmation screen with a link to the Closet.

### 3.4 Closet & Item Management
*   **Closet Grid**: 2-column grid with category filter chips and dormancy badges.
*   **Manual Add (FAB)**: Dedicated form to add items (photo, name, category, color).
*   **Item Detail**: Displays wear history, "Worn With" suggestions, and edit/delete actions.

### 3.5 Match Resolution
*   **Confirmation Prompt**: Bottom-sheet modal triggered by push notifications for 0.65 - 0.85 confidence matches.

## 4. Technical Architecture

### 4.1 State & Data Management
*   **Auth**: Managed via Clerk's React Native SDK.
*   **Server State**: `TanStack Query` (React Query) for fetching closet data and dashboard stats with optimistic updates.
*   **Image Handling**: `react-native-fast-image` for high-performance grid rendering.

### 4.2 Background & Connectivity
*   **Uploads**: Uses `react-native-background-upload` to ensure S3 transfers continue even if the app is minimized.
*   **Offline Support**: Captures are queued locally and uploaded once a connection is detected via `react-native-netinfo`.

## 5. Security & Permissions
*   **Keychain**: JWT session tokens stored securely via iOS Keychain.
*   **Privacy**: Minimal permission requests (Camera, Photo Library, Notifications).
