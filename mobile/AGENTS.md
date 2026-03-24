# Frontend Development Guidelines

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

## Blur & Tra
