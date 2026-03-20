# Low-Level Design: Mobile Client (iOS)

## 1. Overview
The Mobile Client is a React Native iOS application designed for high-frequency outfit logging and wardrobe analytics. It is built using the **Expo** framework to leverage a high-performance, modular technical stack and unified development workflow.

## 2. Navigation & Global UI

### 2.1 Navigation Structure (Expo Router)
The app uses **Expo Router** for file-based routing, providing automatic deep linking and type-safe navigation.
1.  **Home**: `(tabs)/index.tsx` - Dashboard for insights and recent activity.
2.  **Camera**: `(tabs)/camera.tsx` - Visually distinct center tab for capturing/uploading outfits.
3.  **Closet**: `(tabs)/closet/index.tsx` - Grid view of all identified clothing items.

### 2.2 Global Header & Sidebar
*   **Header**: Displays the app logo (left) and user profile picture (right).
*   **Sidebar**: Tapping the profile picture slides in a right-aligned menu for Profile, Settings, Subscription, and Logout. UI polish enhanced with **expo-blur** for translucent backgrounds.

## 3. Screens & Features

### 3.1 Onboarding Flow
*   **Welcome**: Value prop and entry point.
*   **Auth (Clerk)**: Integrated via `@clerk/clerk-expo` for seamless social and email authentication.
*   **Permissions**: Sequential request for Camera and Push Notification access using modular permission hooks.
*   **Seed Closet**: Optional step to manually add items before the first photo.

### 3.2 Home (Dashboard)
*   **Recent Activity**: Cards for the last 3 outfit photos.
*   **Most Worn**: Horizontal scroll of top 5 items this month.
*   **Dormant Items**: Filtering by 30/60/90 days of inactivity.
*   **Frequently Worn Together**: AI-surfaced co-wear patterns.

### 3.3 Camera & Processing
*   **Viewfinder**: Powered by **expo-camera** for robust, cross-device capture.
*   **Actions**: Capture button (enhanced with **expo-haptics**) + "Choose from Library" (Gallery access).
*   **Preview**: "Use Photo" triggers S3 upload and processing; "Retake" resets.
*   **Async Processing UI**: Immediate confirmation screen with a link to the Closet.

### 3.4 Closet & Item Management
*   **Closet Grid**: 2-column grid with category filter chips and dormancy badges.
*   **Manual Add (FAB)**: Dedicated form to add items (photo, name, category, color).
*   **Item Detail**: Displays wear history, "Worn With" suggestions, and edit/delete actions.

### 3.5 Match Resolution
*   **Confirmation Prompt**: Bottom-sheet modal triggered by **expo-notifications** for 0.65 - 0.85 confidence matches.

## 4. Technical Architecture

### 4.1 State & Data Management
*   **Navigation**: **Expo Router** (File-based routing).
*   **Auth**: Managed via **Clerk's Expo SDK** (`@clerk/clerk-expo`).
*   **Server State**: `TanStack Query` (React Query) for fetching closet data and dashboard stats.
*   **Image Handling**: **expo-image** for high-performance grid rendering, blurhash support, and aggressive caching.
*   **Camera**: **expo-camera** for standard high-resolution photo capture.
*   **Icons**: **@expo/vector-icons** for consistent, pre-built iconography.
*   **Haptics**: **expo-haptics** for tactile feedback on primary actions.

### 4.2 Background & Connectivity
*   **Uploads**: Uses **expo-file-system** with `FileSystem.createUploadTask` (sessionType: BACKGROUND) to ensure S3 transfers continue even if the app is minimized.
*   **Push Notifications**: Managed via **expo-notifications** for real-time match resolution alerts.
*   **Offline Support**: Connection detection via **expo-network**.

## 5. Security & Permissions
*   **Secure Storage**: JWT session tokens stored securely via **expo-secure-store**.
*   **Permissions**: Minimal permission requests using module-specific APIs:
    *   `Camera.requestCameraPermissionsAsync()`
    *   `MediaLibrary.requestPermissionsAsync()`
    *   `Notifications.requestPermissionsAsync()`
