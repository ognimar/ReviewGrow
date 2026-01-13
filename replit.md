# ReviewHarvest - Omnichannel Marketing Platform

## Overview
Full-stack marketing platform with personalized image generation, SMS/Email campaigns, and Stripe payments. Features a professional public landing page and smart review collection system.

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
- **Subscription Plans**: Three tiers (Starter/Growth/Pro) with monthly and yearly billing
  - Starter: 119 PLN/mies (50 requestów)
  - Growth: 199 PLN/mies (100 requestów)  
  - Pro: 399 PLN/mies (300 requestów)
- **Usage Limits**: Request counter with limit enforcement before campaign sends
- **Review Funnel**: Smart review collection with negative feedback interception
  - Unique tracking links for each client
  - Low ratings (1-3) stored internally as "saved customers"
  - High ratings (4-5) redirect to Google for public review
  - Auto-exclusion of clients who already responded

### Admin Features  
- User management dashboard
- Subscription plan management (edit prices, limits, features)
- Subscription status overview
- Global platform statistics

## Data Model (Firestore)

### Collections
- `users`: User profiles with subscription data
- `clients`: Customer contacts (isolated by ownerId)
- `campaigns`: Campaign configurations and logs
- `templates`: Image templates with settings
- `subscriptionPlans`: Dynamic subscription plans (Starter/Growth/Pro)
  - Fields: id, name, monthlyPrice, yearlyPrice, requestLimit, features[], order

### Subscription Data Model (in users collection)
```typescript
subscription: {
  planId: string;           // 'starter' | 'growth' | 'pro'
  billingCycle: string;     // 'monthly' | 'yearly'
  status: string;           // 'active' | 'expired' | 'canceled'
  requestLimit: number;     // Max requests per period
  requestsUsed: number;     // Current usage (atomic increment)
  startedAt: string;        // ISO date
  expiresAt: string;        // ISO date
  stripeSessionId: string;
  stripeSubscriptionId?: string;
}
```

## Security
- Firebase Authentication with JWT verification
- All Firestore queries filtered by `ownerId`
- Admin routes protected by email whitelist
- CORS enabled for development

## Development
Run `npm run dev` to start the development server on port 5000.

## Recent Changes
- 2026-01-13: Created Professional Public Landing Page
  - Reorganized routing: Landing at /, Login at /login, Dashboard at /dashboard
  - Professional landing page with emerald/teal color scheme
  - Sections: Navbar, Hero with SMS mockup, Features (6 cards), How it Works, Pricing, FAQ accordion, Footer
  - Mobile-responsive design with hamburger menu
  - All CTA buttons link to /login for authentication flow
  - Updated meta tags for SEO with ReviewHarvest branding
- 2026-01-12: Implemented Review Funnel System
  - Client status lifecycle: NEW → SENT → CLICKED → PENDING_REVIEW → RESPONDED
  - Unique 6-character tracking slugs for each client (stored in trackingSlug field)
  - Mobile-friendly landing page at /r/:slug with star rating selection
  - Low ratings (1-3 stars) capture complaints internally, marking clients as "saved customers"
  - High ratings (4-5 stars) redirect to Google Business review page
  - Focus detection triggers verification when user returns from Google
  - Campaign filtering excludes RESPONDED clients and applies 3-day frequency capping for SENT/CLICKED
  - Dashboard displays funnel statistics with conversion rate and "saved customers" metric
  - Status badges on clients page showing review funnel progress
- 2026-01-11: Implemented full Stripe subscription system
  - Three dynamic plans (Starter/Growth/Pro) stored in Firestore
  - Monthly and yearly billing cycles with Stripe Checkout
  - Webhook handler for subscription lifecycle (activation, cancellation)
  - Request limit enforcement before campaign sends (counts recipients)
  - Atomic usage tracking with FieldValue.increment to prevent race conditions
  - Admin panel for editing subscription plan prices and limits
  - Billing dashboard with subscription status and usage progress bar
  - Access control: blocks campaign features for users without active subscription
- 2026-01-06: Added Firebase Storage cleanup on deletion
  - Template deletion now removes the associated image from Firebase Storage
  - Campaign deletion removes Firestore document (generated images during campaign send are orphaned - see note below)
  - Added deleteFromFirebaseStorage and extractStoragePathFromUrl utility functions
  - Note: Campaign-generated images ({{image}} replacements) are created per-send and not tracked for cleanup
- 2026-01-06: Added campaign delete button
- 2026-01-06: Integrated campaign templates with personalized image generation
  - Campaign form now includes template dropdown for selecting image templates
  - Live preview showing template with first contact's name overlay
  - {{image}} tag support in SMS/Email messages for personalized images
  - Personalized images generated using Sharp and uploaded to Firebase Storage
  - Template ID saved in campaign for tracking which template was used
- 2026-01-06: Implemented AI auto-reply for Google reviews (4-5 stars)
  - Created aiReplyService.ts using OpenAI via Replit AI Integrations
  - Added auto-reply settings (toggle, min stars, custom instructions) 
  - Polish language responses, personalized with reviewer name
  - Manual "Process Reviews Now" button with tracking of replied reviews
  - Automatic background scheduler runs every 2 hours for all users with auto-reply enabled
- 2026-01-06: Added Google Business Profile OAuth integration with business.manage scope
- 2026-01-06: Created Settings page for Google Business connection management
- 2026-01-06: Added {{google_link}} template tag for review request campaigns
- 2026-01-06: Dashboard widget showing Google Business connection status
- 2026-01-05: Initial backend implementation with Firebase, Stripe, and image personalization
- Implemented CSV import with phone validation
- Added usage tracker in sidebar
- Created admin panel with user management
