# Frontend Agent Guidelines

## Stack

- **Framework:** Expo (SDK 54) with Expo Router v6
- **Language:** TypeScript (strict)
- **Styling:** StyleSheet.create
- **Auth:** Clerk (`@clerk/expo`)
- **Navigation:** Expo Router (file-based) + `@react-navigation/native-stack`
- **React:** 19.1.0

---

## Core Principle

Always prefer native-feeling implementations over default React Native components. The goal is for users to never suspect the app is built in React Native.

---

## Navigation

- Always use Expo Router for all routing — never manually configure React Navigation stacks
- Use `expo-router` file-based routing conventions: `app/` directory, `_layout.tsx` files, `(tabs)/` groups
- Use `@react-navigation/native-stack` (already installed) for nested navigators when needed
- Always enable `react-native-screens` — it is already configured via Expo Router but ensure `enableScreens()` is not disabled anywhere
- Use native stack transitions — never JS-driven transitions

---

## Animations & Gestures

- Use `react-native-reanimated` v4 (already installed) for ALL animations — it runs on the UI thread
- Use `react-native-gesture-handler` (already installed) for ALL swipe and touch interactions
- Wrap the root layout with `GestureHandlerRootView` — this must be the outermost wrapper in `app/_layout.tsx`
- Use shared element transitions between closet grid and item detail screens

---

## Haptics

- Use `expo-haptics` (already installed) on every meaningful interaction
- Apply to: button taps, confirmations, successful photo uploads, item match confirmations, tab switches
- This is one of the highest impact details for native feel — never skip it
- Use `Haptics.impactAsync(ImpactFeedbackStyle.Light)` for taps, `Medium` for confirmations, `Heavy` for destructive actions

---

## Lists & Scroll Performance

- Always use `@shopify/flash-list` (already installed) instead of FlatList for any scrollable list
- This is mandatory for the closet grid — default FlatList will degrade as the closet grows
- Always provide `estimatedItemSize` prop to FlashList

---

## Bottom Sheets & Modals

- Use `@gorhom/bottom-sheet` v5 (already installed) for ALL bottom sheet interactions
- Apply to: low confidence match confirmation prompt, item pickers, filter menus
- Always wrap with `BottomSheetModalProvider` in the root layout

---

## Blur & Transparency Effects

- Use `expo-blur` (already installed) for frosted glass / translucent UI elements
- Apply to: sidebar overlay, bottom sheet backgrounds, tab bar if floating

---

## Images

- Always use `expo-image` (already installed) instead of the default React Native Image component
- Enables: better caching, faster loading, blurhash placeholders for graceful fade-in
- Never let images pop in — always pass a `placeholder` prop with a blurhash string
- Use `contentFit="cover"` for clothing item thumbnails

---

## Camera & Photo Upload

- Use `react-native-vision-camera` v4 (already installed) for the live camera viewfinder — it is more performant than `expo-camera` for this use case
- Use `expo-image-picker` (already installed) for choosing from the photo library
- Upload photos to S3 via pre-signed URL — never route large files through the API

---

## Forms & Keyboard Handling

- Use `react-native-keyboard-controller` (already installed) for all screens with input fields
- Never use the default `KeyboardAvoidingView` — it produces janky behavior

---

## Safe Areas & Status Bar

- Always wrap screens with `react-native-safe-area-context` (already installed)
- Use `useSafeAreaInsets()` hook — never hardcode padding for notches or home indicator
- Content must never clip under the notch, Dynamic Island, or home indicator
- Use `expo-status-bar` (already installed) and match status bar style to each screen's background

---

## Lottie Animations

- Use `lottie-react-native` (already installed) for loading states and success animations
- Apply to: photo processing confirmation screen, outfit logged success state

---

## Styling

- Always use `StyleSheet.create` — never inline style objects
- Define a global theme file at `src/theme/index.ts` with colors, spacing, font sizes, border radii
- Never hardcode color hex values or pixel values inline — always reference theme constants
- Use a consistent spacing scale: `4, 8, 12, 16, 24, 32, 48, 64`
- Always account for dynamic text sizes — use relative font sizes not fixed

---

## Component Architecture

- Build components as small, single-responsibility units
- Never put business logic inside UI components — keep components dumb, logic in hooks
- Always create custom hooks for stateful logic (e.g. `useCloset`, `usePhotoUpload`, `useItemMatch`)
- Co-locate component files with their styles in a folder per component:

```
components/
  ClosetGrid/
    ClosetGrid.tsx
    ClosetGrid.styles.ts
    useClosetGrid.ts
```

---

## State Management

- Use Zustand for global UI state — lightweight, no boilerplate
- Use React Query (`@tanstack/react-query`) for all server state
- Keep server state separate from UI state
- Never store derived data in state — compute it on the fly
- Never manually manage fetch loading/error state with `useState`

---

## API Communication

- Centralize all API calls in a `services/` layer — never call fetch directly from a component or screen
- Always handle loading, success, and error states for every API call
- Use React Query's caching and background refetch

---

## TypeScript

- Strict mode is already enabled — maintain it
- No `any` types ever
- Define types for every API response, component prop, and piece of global state
- Keep API response types in `services/`, component prop types co-located with the component

---

## File & Folder Structure

```
app/                        # Expo Router screens (file-based routing)
  (tabs)/
    index.tsx               # Home / Dashboard
    closet.tsx              # Closet grid
  camera.tsx                # Camera / upload screen
  item/[id].tsx             # Item detail
  _layout.tsx               # Root layout
src/
  components/               # Shared reusable components
  hooks/                    # Global custom hooks
  services/                 # API calls and backend communication
  store/                    # Zustand global state
  theme/                    # Colors, spacing, typography constants
  types/                    # Shared TypeScript types
  utils/                    # Helper functions
```

---

## Error & Loading States

- Every screen that fetches data must have three states: loading (skeleton), error, and success
- Never leave a screen blank while data loads — always show a skeleton placeholder
- Use `expo-image` blurhash placeholders for image loading states
- Always show user-friendly error messages — never expose raw error strings to the UI

---

## Accessibility

- Always add `accessibilityLabel` to touchable elements that have no visible text (icon buttons)
- Ensure tappable elements meet the 44×44pt minimum touch target size Apple recommends
- Use `accessibilityRole` and `accessibilityHint` where appropriate

---

## Empty States

- Every screen must have a designed empty state — never render a blank screen
- Key empty states: Home (no photos yet), Closet (no items), Item Detail outfit history, Dormant Items

---

## Dependency Reference

| Purpose           | Library                            |
| ----------------- | ---------------------------------- |
| Routing           | `expo-router`                      |
| Native screens    | `react-native-screens`             |
| Animations        | `react-native-reanimated` v4       |
| Gestures          | `react-native-gesture-handler`     |
| Haptics           | `expo-haptics`                     |
| Lists             | `@shopify/flash-list`              |
| Bottom sheets     | `@gorhom/bottom-sheet` v5          |
| Blur effects      | `expo-blur`                        |
| Images            | `expo-image`                       |
| Camera viewfinder | `react-native-vision-camera`       |
| Photo library     | `expo-image-picker`                |
| Keyboard          | `react-native-keyboard-controller` |
| Safe areas        | `react-native-safe-area-context`   |
| Status bar        | `expo-status-bar`                  |
| Lottie animations | `lottie-react-native`              |
| Auth              | `@clerk/expo`                      |
| Global state      | `zustand`                          |
| Server state      | `@tanstack/react-query`            |
