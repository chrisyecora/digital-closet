# Specifications: Authentication (Clerk)

## Overview
These specs define the integration with Clerk for user identity and the verification of sessions on the FastAPI backend.

## Requirements

| ID | Requirement (EARS) | Status |
|----|-------------------|--------|
| **AUTH-UI-001** | **While** the user is unauthenticated, the application **shall** display the Clerk `<SignIn />` or `<SignUp />` component including "Sign in with Apple" and "Sign in with Google" options. | [ ] |
| **AUTH-UI-002** | **When** the user successfully authenticates via Clerk, the application **shall** store the Clerk JWT session token in the iOS Keychain. | [ ] |
| **AUTH-UI-003** | **When** the user first signs up, the application **shall** trigger the Permissions flow for Camera and Notifications. | [ ] |
| **AUTH-API-001** | **When** the API receives a request with an `Authorization: Bearer <JWT>` header, the API **shall** verify the token against Clerk's JWKS endpoint. | [ ] |
| **AUTH-API-002** | **Where** a request lacks a valid or active Clerk JWT, the API **shall** return a `401 Unauthorized` response. | [ ] |
| **AUTH-DB-001** | **When** a user authenticates for the first time, the system **shall** create a record in the `users` table linked by `clerk_user_id` and initialize an empty `closet`. | [ ] |
| **AUTH-SYS-001** | **When** a user's Clerk session expires, the Mobile Client **shall** automatically redirect the user to the login screen. | [ ] |
