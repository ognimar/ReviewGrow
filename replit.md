# Contact Review Grow - Omnichannel Marketing Platform

## Overview
Contact Review Grow is a full-stack omnichannel marketing platform designed to help businesses collect reviews, manage clients, and run personalized marketing campaigns. It features personalized image generation, SMS/Email campaigns, and Stripe payments. The platform aims to provide a professional public landing page and a smart review collection system to enhance customer engagement and business growth.

## User Preferences
None.

## System Architecture
The platform is built as a multi-tenant SaaS application utilizing Firebase/Firestore for data isolation and role-based access control (User and Admin). Key technical implementations include:
- **Frontend**: React, TailwindCSS for UI, Wouter for routing, and TanStack Query for data fetching.
- **Backend**: Express.js with Firebase Admin SDK for server-side logic and Firestore as the primary database.
- **Image Personalization**: A custom engine using Sharp for dynamic text overlays on images.
- **Data Handling**: CSV import functionality with phone number validation using `libphonenumber-js`.
- **Review Funnel**: Implements a smart review collection system that intercepts negative feedback internally and redirects positive reviews to Google Business Profile. This includes unique tracking links, status lifecycle management (NEW → SENT → CLICKED → PENDING_REVIEW → RESPONDED), and a 3-day frequency cap for campaign sends.
- **Subscription Management**: Dynamic subscription plans (Starter/Growth/Pro) are stored in Firestore, supporting monthly and yearly billing cycles via Stripe Checkout. It includes webhook handling for subscription lifecycle, request limit enforcement, and atomic usage tracking.
- **Campaigns**: Supports personalized SMS/MMS and Email campaigns with dynamic tags (e.g., `{{name}}`, `{{google_link}}`, `{{image}}`).
- **Follow-up System**: Automated follow-up messages for both SMS and Email with configurable timing and content, respecting subscription limits.
- **Google Business Profile Integration**: OAuth-based integration for connecting Google Business Profiles, allowing for review collection and automated AI replies to positive reviews.
- **Security**: Firebase Authentication with JWT verification, Firestore queries filtered by `ownerId`, and admin routes protected by an email whitelist. CORS is enabled for development.
- **Storage Management**: Tracks uploaded files in Firebase Storage and provides cleanup mechanisms when campaigns or clients are deleted.
- **UI/UX**: Features a professional public landing page with an emerald/teal color scheme, mobile-responsive design, and clear CTAs.

## External Dependencies
- **Firebase**: For authentication, Firestore database, and Firebase Storage.
- **Stripe**: For subscription management, payment processing (Stripe Checkout), and customer billing portals.
- **Sharp**: Image processing library for personalized image generation.
- **SMSAPI**: For sending SMS/MMS campaigns.
- **SendGrid**: For sending personalized email campaigns and tracking email events via webhooks.
- **Google Business Profile API**: For connecting and managing Google Business profiles for review collection and auto-reply features.
- **OpenAI**: Utilized via Replit AI Integrations for AI auto-replies to Google reviews.