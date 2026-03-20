# Digital Closet — Product Overview

---

## Concept

Digital Closet is a mobile-first iOS application that uses AI-powered computer vision to build a user's digital wardrobe over time through daily outfit photos. The core value proposition is a living, intelligent closet tracker that surfaces wear frequency, dormant items, and outfit patterns — without requiring manual data entry.

---

## Problem Statement

Most people own far more clothing than they actively wear. Without visibility into their wardrobe usage, users repeatedly reach for the same items while others go untouched for months. Existing solutions require tedious manual input, which kills retention. Digital Closet solves this by letting the camera do the work.

---

## Core Concept

Users snap a daily photo of their outfit. The AI identifies each clothing item, matches it to previously seen items in the user's closet, and logs the wear event. Over time, the app builds a complete picture of what the user owns, what they actually wear, and what's collecting dust.

---

## MVP Features

### 1. Daily Photo Logging
- Users upload one or more outfit photos per day
- No strict format required — full body, torso, or flat lay all accepted
- Photo is sent to server-side inference pipeline asynchronously

### 2. AI Clothing Detection
- Detects individual clothing items in each photo
- Categorizes by type (top, bottom, dress, outerwear, shoes, accessory), sub-category (shirt, hoodie, jeans, etc.), color, fit, and general description
- No brand recognition or price tracking in MVP

### 3. Instance Matching
- The core differentiator: the AI determines whether a detected item is the same physical garment as one seen before
- Confidence score returned with each match
- Tiered logic applied based on confidence score (see System Design for thresholds)

### 4. User Corrections
- Users can correct mismatches with one tap
- Corrections are logged and fed back into the model retraining pipeline
- Model improves on a per-user basis over time

### 5. Manual Closet Input
- Users can optionally seed their closet by manually inputting items upfront
- Alternatively the closet builds organically from daily photos

### 6. Digital Closet Dashboard
- View all tracked items with wear frequency
- Filter by category, color, fit
- See items not worn in X days (30, 60, 90 day dormancy flags)
- View co-wear patterns: what items you consistently pair together

### 7. History & Data Retention
- Free tier: 6 months of photo history
- Paid tier: unlimited history
- Item metadata (wear count, category, description) retained indefinitely regardless of tier

---

## User Flow

1. User opens app and taps to take or upload today's outfit photo
2. Photo is uploaded directly to S3 via pre-signed URL
3. API is notified and drops a message onto the SQS queue
4. Worker picks up the message and runs the inference pipeline
5. Results are written to Postgres
6. User receives a push notification: "Your outfit has been logged — 3 items identified"
7. User can browse their closet dashboard anytime to view wear history and dormancy alerts
8. Low-confidence matches prompt a one-tap confirmation from the user

---

## Monetization Strategy

- **Free tier:** Core features + 6 months of photo history
- **Paid tier:** Unlimited photo history, advanced analytics, outfit recommendations
- Paywall is non-blocking — users are never locked out of core functionality, only extended history and deeper insights
- Natural upgrade trigger: user hits the 6 month limit and is prompted to upgrade to keep their history

---

## Competitive Landscape

Existing apps in this space (Outfit Tracker, OnYou) either require fully manual input or do basic AI photo analysis without true instance matching. None