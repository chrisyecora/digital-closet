# Frontend Development Guidelines

## Core Principle
Always prefer native-feeling implementations over default React Native components.
The goal is for users to never suspect the app is built in React Native.

---

## Navigation
- Always use `@react-navigation/native-stack` — never the JS stack
- Enable `react-native-screens` — renders screens as native UIKit view controllers
- Use native stack transitions for all screen pushes and pops

---

## Animations & Gestures
- Use `react-native-reanimated` v3 for all animations — runs on the UI thread not the JS thread
- Use `react-native-gesture-handler` for all swipe and touch interactions
- Implement shared element transitions between the closet grid and item detail screen

---

## Haptics
- Use `expo-haptics` on every meaningful interaction
- Apply to: button taps, confirmations, successful photo uploads, item match confirmations
- This is one of the highest impact details for native feel — never skip it

---

## Lists & Scroll Performance
- Always use `@shopify/flash-list` instead of FlatList for any scrollable list
- This is mandatory for the closet grid — default FlatList will degrade as the closet grows

---

## Bottom Sheets & Modals
- Use `@gorhom/bottom-sheet` for all bottom sheet interactions
- Apply to: low confidence match confirmation prompt, item pickers, filter menus

---

## Blur & Transparency Effects
- Use `expo-blur` for frosted glass / translucent UI elements
- Apply to: sidebar overlay, bottom sheet backgrounds, tab bar if floating

---

## Images
- Always use `expo-image` instead of the default React Native Image component
- Enables: better caching, faster loading, blurhash placeholders for graceful fade-in
- Never let images pop in — always use a placeholder

---

## Forms & Keyboard Handling
- Use `react-native-keyboard-controller` for all screens with input fields
- Never use the default KeyboardAvoidingView — it produces janky behavior

---

## Safe Areas & Status Bar
- Always wrap screens with `react-native-safe-area-context`
- Content must never clip under the notch, Dynamic Island, or home indicator
- Match status bar style to the background color of each screen

---

## Dependency Reference

| Purpose | Library |
|---------|---------|
| Navigation | `@react-navigation/native-stack` |
| Native screens | `react-native-screens` |
| Animations | `react-native-reanimated` v3 |
| Gestures | `react-native-gesture-handler` |
| Haptics | `expo-haptics` |
| Lists | `@shopify/flash-list` |
| Bottom sheets | `@gorhom/bottom-sheet` |
| Blur effects | `expo-blur` |
| Images | `expo-image` |
| Keyboard | `react-native-keyboard-controller` |
| Safe areas | `react-native-safe-area-context` |