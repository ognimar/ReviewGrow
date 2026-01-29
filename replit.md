# Contact Review Grow - Omnichannel Marketing Platform

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
  status: string;           // 'active' | 'canceling' | 'past_due' | 'unpaid' | 'canceled' | 'expired'
  requestLimit: number;     // Max requests per period
  requestsUsed: number;     // Current usage (atomic increment)
  startedAt: string;        // ISO date
  expiresAt: string;        // ISO date
  cancelAt?: string;        // Date when subscription will be canceled (cancel_at_period_end)
  canceledAt?: string;      // Date when subscription was canceled
  lastPaymentFailedAt?: string; // Date of last payment failure
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string; // Stripe customer ID for portal access
}
```

### Subscription Status Lifecycle
- **active**: Subscription is active and paid
- **canceling**: User requested cancellation, but still has access until period end
- **past_due**: Payment failed, grace period - user can still log in but should update payment
- **unpaid**: Multiple payment failures - campaign sending is blocked
- **canceled**: Subscription fully canceled (after period end)
- **expired**: Subscription period ended without renewal

## Security
- Firebase Authentication with JWT verification
- All Firestore queries filtered by `ownerId`
- Admin routes protected by email whitelist
- CORS enabled for development

## Development
Run `npm run dev` to start the development server on port 5000.

## Branding Note
- **Contact Review Grow** = Official business name (Bartosz Straszewski, NIP: 6472614652) used everywhere in the platform

## Recent Changes
- 2026-01-29: Google Business Profile Onboarding Flow
  - New users must connect Google Business Profile before accessing dashboard
  - Professional onboarding page at /onboarding with "Dlaczego to jest potrzebne?" section
  - OAuth flow redirects to onboarding for location selection
  - Saves googleConnected, googleLocationId, googlePlaceId, businessName, averageRating to user profile
  - Admin users and billing/settings pages bypass the Google connection requirement
  - Route guards check googleConnected flag to enforce onboarding
  - Automatic averageRating calculation from reviews on connection
- 2026-01-28: Firebase Storage Management System
  - Added storageFiles collection to track uploaded files
  - Files automatically tracked when uploaded (campaign images, follow-up MMS)
  - Automatic cleanup when deleting campaigns or clients (removes associated files)
  - Storage Management UI in Settings page
    - View all tracked files with size and type
    - Delete individual files or all files at once
    - Shows total storage usage
  - API endpoints: GET/DELETE /api/storage/files, DELETE /api/storage/files/:id
- 2026-01-28: SendGrid Email Integration and Email Follow-up System
  - Created EmailService (server/services/emailService.ts) with SendGrid API integration
  - Personalized email sending with {{name}}, {{first_name}}, {{google_link}} tags
  - HTML email templates with professional styling and unsubscribe links
  - Email Follow-up Scheduler (server/services/emailFollowUpScheduler.ts)
    - Automated email sequences with configurable timing (days after initial contact)
    - Subject and message customization per follow-up step
    - Respects subscription limits and status checks
  - SendGrid Webhooks (/api/sendgrid/webhook)
    - Tracks delivered, open, click, bounce, unsubscribe events
    - Auto-marks clients as BOUNCED or OPT_OUT based on events
  - Email campaign support in campaign builder
    - Subject field for email campaigns
    - fromEmail, fromName, companyName configuration
  - Settings page Email Follow-up section
    - Configure sender email and name
    - Up to 5 sequential email follow-ups
    - Subject and message per email
    - "Wyślij Teraz" manual trigger button
  - Unsubscribe page (/unsubscribe/:slug) for GDPR compliance
  - Credit system: each email deducts 1 credit (subscription.requestsUsed + emailUsed)
  - Single trackingSlug used across SMS and Email for unified conversion tracking
- 2026-01-27: Full Stripe subscription lifecycle implementation
  - Customer Billing Portal integration for self-service management
  - Cancel at period end support (subscription.status = 'canceling')
  - Failed payment handling (past_due/unpaid statuses)
  - Campaign sending blocked for problematic subscription statuses
  - UI alerts for past_due, unpaid, and canceling statuses
  - "Zarządzaj subskrypcją" button to open Stripe portal
  - Automatic request limit reset on successful recurring payment
  - Follow-up scheduler respects subscription status and limits
- 2026-01-27: Follow-up credit tracking fix
  - Each follow-up now deducts 1 credit from subscription.requestsUsed
  - Also increments smsUsed counter
- 2026-01-24: Added Automatic Follow-up SMS feature
  - Up to 5 configurable follow-up messages per user
  - Each message has: enabled toggle, days after (1-30), message content
  - Scheduler runs every hour to check and send due follow-ups
  - Only sends to clients with SENT or CLICKED status (not RESPONDED)
  - UI in Settings page for configuration
  - "Wyślij Teraz" button for manual trigger
  - Tracks followUpsSent count per client to prevent duplicate sends
  - **Quick copy from campaign**: Select a sent campaign to auto-copy its message and template
  - **Image support**: Follow-ups use the same personalized image template as the original campaign
  - Uses {{image}} tag to include personalized MMS images
- 2026-01-22: Added complaint viewing for saved customers
  - Heart icon on clients page for customers who left negative ratings
  - Click to view rating, message and date of complaint
- 2026-01-21: Fixed SMSAPI link rejection and Google Business Profile isolation
  - Campaign sending now generates tracking slugs for older clients that don't have them
  - Always uses short /r/:slug tracking links instead of full Google URLs (SMSAPI blocks external links)
  - Added query cache clearing on logout to prevent user data leaking between sessions
- 2026-01-13: Added legal policy pages (Polityka Prywatności, Regulamin, Polityka Cookies)
  - Routes: /polityka-prywatnosci, /regulamin, /polityka-cookies
  - Full policy content from official documents
  - Linked in landing page footer
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
