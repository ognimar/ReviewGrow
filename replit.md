# Contact Review Grow - Omnichannel Marketing Platform

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

### Frontend Firebase (VITE_ prefix for client access)
```
VITE_OMNISEND_FIREBASE_API_KEY=your-firebase-api-key
VITE_OMNISEND_FIREBASE_PROJECT_ID=your-project-id
VITE_OMNISEND_FIREBASE_APP_ID=your-app-id
VITE_OMNISEND_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Backend Firebase & Services
```
OMNISEND_FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
OMNISEND_FIREBASE_STORAGE_BUCKET=your-bucket-name.firebasestorage.app
OMNISEND_ADMIN_EMAILS=admin1@example.com,admin2@example.com
OMNISEND_STRIPE_SECRET_KEY=sk_live_...
```

### Google Business Profile (OAuth)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
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
- **Campaigns**: Send SMS/MMS and Email campaigns with {{name}} and {{google_link}} tags
- **Google Business Integration**: Connect Google Business Profile to collect reviews
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
- 2026-01-06: Added Google Business Profile OAuth integration with business.manage scope
- 2026-01-06: Created Settings page for Google Business connection management
- 2026-01-06: Added {{google_link}} template tag for review request campaigns
- 2026-01-06: Dashboard widget showing Google Business connection status
- 2026-01-05: Initial backend implementation with Firebase, Stripe, and image personalization
- Implemented CSV import with phone validation
- Added usage tracker in sidebar
- Created admin panel with user management
