# Digital Closet — Screen Specs for Figma

---

## Overview

Digital Closet is a mobile-first iOS app that automatically builds a user's digital wardrobe from daily outfit photos. The AI identifies clothing items, tracks how often each piece is worn, and surfaces insights about wardrobe usage.

Target platform: iOS

---

## Navigation Structure

### Bottom Tab Bar — 3 tabs:

1. **Home** (home icon)
2. **Camera** (camera icon — visually distinct, stands out from other tabs)
3. **Closet** (hanger icon)

### Global Header:

- App name or logo — top left
- Profile picture — top right, tappable
- Tapping profile picture opens a **sidebar** that slides in from the right with:
  - User name and email
  - Profile
  - Settings
  - Subscription / upgrade
  - Log out

---

## Screens

---

### 1. Onboarding — Welcome

**Purpose:** First impression, explain the value prop, get the user to sign up.

**Elements:**

- Full screen background — lifestyle photo or illustration of a stylish closet
- App name: "Digital Closet"
- Tagline: "Your wardrobe, finally organized."
- CTA button: "Get Started"
- Secondary link: "Already have an account? Log in"

---

### 2. Onboarding — Sign Up / Log In

**Purpose:** Account creation and authentication.

**Elements:**

- Email input field
- Password input field
- CTA button: "Create Account"
- Divider: "or"
- Sign in with Apple button
- Sign in with Google button
- Toggle: "Already have an account? Log in"

---

### 3. Onboarding — Permissions

**Purpose:** Request camera and notification permissions before entering the app.

**Two sequential permission screens:**

#### 3a. Camera Permission

- Icon: camera
- Heading: "Allow camera access"
- Body: "Digital Closet uses your camera to identify and track your clothing items."
- CTA: "Allow Camera Access"
- Secondary: "Not Now"

#### 3b. Notification Permission

- Icon: bell
- Heading: "Stay in the loop"
- Body: "We'll notify you when your outfit has been processed and your closet is updated."
- CTA: "Allow Notifications"
- Secondary: "Not Now"

---

### 4. Onboarding — Seed Your Closet (Optional)

**Purpose:** Let users manually add items before taking their first photo. Skippable.

**Elements:**

- Heading: "Want to start with your closet?"
- Body: "Add items you already own, or just start taking photos and we'll figure it out."
- CTA button: "Add Items Manually"
- Secondary button: "Skip, I'll take a photo"
- If "Add Items Manually" tapped → goes to Add Item screen (see screen 11)

---

### 5. Home — Empty State (New User)

**Purpose:** Entry point for new users before any photos have been taken.

**Elements:**

- Global header with profile picture
- Greeting: "Good morning, [name]."
- Empty state illustration: simple closet or hanger graphic
- Body text: "Take your first outfit photo to get started."
- Bottom tab bar

---

### 6. Home — Active State (Dashboard)

**Purpose:** The main dashboard. Shows wardrobe insights and recent activity for returning users.

**Elements:**

- Global header with profile picture
- Greeting: "Good morning, [name]."
- Section: "Recent Activity"
  - Last 3 outfit photos shown as cards
  - Each card: thumbnail, date, number of items identified
  - Tapping a card goes to the outfit detail
- Section: "Most Worn"
  - Horizontal scroll of the user's top 5 most worn items this month
  - Each item: thumbnail, name, wear count
- Section: "Dormant Items"
  - Items not worn in 30+ days
  - Sub-filters: 30 days, 60 days, 90 days
  - Each item shows days since last worn
- Section: "Frequently Worn Together"
  - Pairs of items the user commonly wears together
  - Shown as paired item thumbnails side by side
- Bottom tab bar

---

### 7. Camera Screen

**Purpose:** Capture or upload today's outfit photo.

**Triggered by:** Tapping the camera tab in the bottom nav.

**Elements:**

- Full screen camera viewfinder
- Capture button — large, centered at the bottom
- "Choose from Library" button — bottom left, secondary
- Close / back button — top left
- Helper text at top: "Take a photo of your outfit today"

**After capture or image selected:**

- Preview screen with:
  - "Use Photo" button → triggers upload and processing
  - "Retake" / "Choose Different" button

---

### 8. Processing State

**Purpose:** Communicate to the user that their photo is being processed asynchronously.

**Elements:**

- Confirmation screen shown immediately after "Use Photo" is tapped
- Checkmark icon
- Heading: "Photo uploaded!"
- Body: "We're identifying your items. We'll notify you when your closet is updated."
- CTA: "Go to My Closet"
- Processing is async — user is not waiting on this screen

---

### 9. Confirmation Prompt — Low Confidence Match

**Purpose:** One tap user confirmation for low confidence item matches.

**Triggered by:** Push notification or badge indicator when a low confidence match needs review.

**Elements:**

- Bottom sheet overlay
- Item crop image — the specific garment detected
- Heading: "Is this your [item name]?"
- Example: "Is this your Navy Crewneck Sweater?"
- Two buttons:
  - "Yes, that's it" (primary)
  - "No, it's different" (secondary)
- If "No" tapped → closet item picker appears so user can select the correct item or create a new one

---

### 10. Closet — Main View

**Purpose:** Browse all clothing items the app has identified.

**Elements:**

- Screen title: "My Closet"
- Filter bar below title:
  - Filter chips: All, Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories
- 2 column grid of clothing items
  - Each cell: item thumbnail, item name, worn count badge (e.g. "Worn 12x")
  - Items not worn in 30+ days show a subtle dormancy indicator
- Floating action button "+" to manually add an item
- Bottom tab bar

---

### 11. Closet — Item Detail

**Purpose:** View full details and history for a single clothing item.

**Elements:**

- Back button
- Item image — large, top of screen
- Item name (editable inline)
- Category and sub-category tags
- Color tag
- Stats row:
  - Worn count
  - Last worn date
  - First logged date
- Section: "Outfit History"
  - Horizontal scroll of outfit photos this item has appeared in
  - Each photo shows the date worn
- Section: "Worn With"
  - Grid of items frequently co-worn with this item
- Edit button — update name, category, color, description
- Delete button — remove item from closet

---

### 12. Add Item Manually

**Purpose:** Allow users to manually add a clothing item.

**Elements:**

- Screen title: "Add Item"
- Photo upload field: "Add a photo" (optional)
- Text fields:
  - Item name (required)
  - Category (dropdown: Top, Bottom, Dress, Outerwear, Shoes, Accessory)
  - Sub-category (dropdown, options populate based on category selected)
  - Color (text input or color picker)
  - Description (optional, free text)
- CTA: "Save Item"
- Cancel button

---

### 13. Sidebar — Profile & Settings

**Purpose:** Account management and settings. Accessed by tapping the profile picture in the top right corner of any screen.

**Triggered by:** Tapping profile picture → sidebar slides in from the right.

**Elements:**

- User avatar and name at the top of the sidebar
- User email below name
- Menu options:
  - Profile — edit name, photo
  - Settings — notification preferences
  - Subscription — current plan, upgrade option
  - Restore Purchases
  - Log Out
- Tap outside sidebar or swipe right to dismiss

---

### 14. Subscription Screen

**Purpose:** Show current plan and convert free users to paid.

**Accessed from:** Sidebar → Subscription, or triggered automatically when user hits the 6 month history limit.

**Elements:**

- Heading: "You've built quite the closet."
- Body: "Upgrade to Pro to unlock your full outfit history and advanced insights."
- Feature list:
  - Unlimited photo history
  - Full outfit timeline
  - Advanced wardrobe analytics
- Pricing: monthly and annual toggle with pricing displayed
- CTA: "Upgrade to Pro"
- Secondary: "Maybe Later" (only shown if not triggered by paywall)
- Restore purchases link (required by App Store)

---

## Empty States

Every screen must have a designed empty state. Key ones:

| Screen                       | Empty State Message                                                       |
| ---------------------------- | ------------------------------------------------------------------------- |
| Home                         | "Take your first outfit photo to get started."                            |
| Closet                       | "Your closet is empty. Start by taking a photo or adding items manually." |
| Item Detail — Outfit History | "This item hasn't been worn yet."                                         |
| Dormant Items                | "No dormant items. You're wearing everything!"                            |
| Worn With                    | "Wear this item a few more times to see patterns."                        |

---

## Loading States

Processing is async. The following screens need skeleton loading states:

- Closet grid — skeleton grid cells while items load
- Item Detail — skeleton for image, stats, and outfit history
- Home recent activity — skeleton cards
- Home insights sections — skeleton rows
