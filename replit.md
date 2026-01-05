# OmniSend - Omnichannel Marketing Platform

## Overview
Full-stack marketing platform with personalized image generation, SMS/Email campaigns, and Stripe payments.

## Technology Stack
- **Frontend**: React, TailwindCSS, Wouter, TanStack Query
- **Backend**: Express, Firebase Admin SDK, Firestore
- **Services**: Sharp (image processing), Stripe, SMSAPI, SendGrid
- **Storage**: Firebase Storage

## Architecture
- Multi-tenant SaaS with Firebase/Firestore data isolation
- Role-based access control (User + Admin)
- Image personalization engine using Sharp
- CSV import with phone number validation (libphonenumber-js)

## Required Environment Variables

### Firebase Configuration
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
FIREBASE_STORAGE_BUCKET=your-bucket-name.appspot.com
```

### Admin Access
```
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Stripe Payments
```
STRIPE_SECRET_KEY=sk_test_...
BASE_URL=https://your-domain.replit.app
```

### Optional: SMS/Email APIs
```
SMSAPI_TOKEN=your-smsapi-token
SENDGRID_API_KEY=your-sendgrid-key
```

## Features

### User Features
- **Client Management**: Import CSV lists with Name, Phone, Email
- **Image Templates**: Create personalized images with dynamic text overlays
- **Campaigns**: Send SMS/MMS and Email campaigns
- **Usage Tracking**: Real-time SMS and Email quota display
- **Billing**: Monthly (99 PLN/mo) or Annual (960 PLN/year) plans

### Admin Features  
- User management dashboard
- Subscription status overview
- Global platform statistics

## Data Model (Firestore)

### Collections
- `users`: User profiles with subscription data
- `clients`: Customer contacts (isolated by ownerId)
- `campaigns`: Campaign configurations and logs
- `templates`: Image templates with settings

## Security
- Firebase Authentication with JWT verification
- All Firestore queries filtered by `ownerId`
- Admin routes protected by email whitelist
- CORS enabled for development

## Development
Run `npm run dev` to start the development server on port 5000.

## Recent Changes
- 2026-01-05: Initial backend implementation with Firebase, Stripe, and image personalization
- Implemented CSV import with phone validation
- Added usage tracker in sidebar
- Created admin panel with user management
