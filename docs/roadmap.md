## Project Overview

PaperDock is a SaaS marketplace for downloadable educational resources. Students and educators can browse, purchase, and download learning materials, while creators and admins manage content through dedicated dashboards. The platform runs on Next.js 16 (App Router) with TypeScript, Tailwind CSS, Prisma/PostgreSQL, NextAuth, Stripe/Xendit, and `next-intl` for i18n.

## Current Systems

- **Authentication & Users**
  - NextAuth with Prisma adapter, email/password and OAuth, user roles (`ADMIN`, `INSTRUCTOR`, `STUDENT`), and auth pages under `app/auth`.
  - Subscription metadata (`SubStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionPlan`, `currentPeriodEnd`) stored on `User`.

- **Resource Marketplace**
  - Public catalog and detail pages under `app/[locale]/(marketing)`, with categories, tags, reviews, search and filtering.
  - `Resource`, `Category`, `Tag`, `Review`, `ResourcePreview`, and `ResourceTag` models back the marketplace.

- **Uploads & File Handling**
  - Admin resource create/edit forms with file and image upload widgets.
  - Upload APIs for resource files and images, storing `fileKey`/`fileUrl` and preview images in Prisma.

- **Purchases & Payments**
  - `Purchase` model tracks one-off purchases, amount, currency, provider, and provider-specific IDs.
  - Checkout endpoints for Stripe and Xendit, plus webhook handlers that write to `WebhookEvent` for dead-letter processing.

- **Subscriptions**
  - Subscription fields on `User`, subscription API route, and membership/pricing page.
  - Basic subscription status tracking via `SubStatus`.

- **Downloads & Access Control**
  - Download endpoints (including versioned downloads) check purchase and resource state before serving files.
  - `downloadCount` and `viewCount` on `Resource` for basic usage tracking.

- **Admin Dashboard**
  - Admin layout and pages for resources, categories, tags, reviews, users, orders, analytics, activity, audit logs, and settings.
  - Bulk operations, trash, resource versions, and preview tooling.

- **Logging & Analytics**
  - `ActivityLog` and `AuditLog` record user/admin actions with IP and user-agent where applicable.
  - Dashboard metrics and analytics utilities feed admin analytics views.

- **Internationalization**
  - Locale-aware routing under `app/[locale]` with `next-intl`, middleware-based locale detection, and a locale switcher in the UI.

## Missing Systems

- **File Storage Backend**
  - Only local `private-uploads` is currently used; no abstraction for S3/R2 or other object storage and no configuration surface for storage providers.

- **Robust Secure Downloads**
  - Download endpoints gate access but do not consistently issue signed, expiring URLs or enforce rate limiting and anomaly detection.

- **Mature Subscription Management**
  - Subscription fields and APIs exist, but end-to-end flows for upgrade/downgrade, cancellation, and billing history are still shallow.

- **Creator Payouts**
  - No models or APIs for tracking earnings, balances, or payouts to creators; marketplace currently behaves like a single-merchant store.

- **Creator Tools**
  - No separate creator dashboard; creators work through admin-like tooling rather than a purpose-built experience.

- **Advanced Analytics & Moderation**
  - Admin analytics exist, but there is no deep cohort/funnel analysis or creator-facing analytics.
  - Moderation is handled implicitly via admin tools; there is no explicit reporting/appeals workflow or abuse tooling.

## Development Phases

### Phase 1 — Core Marketplace Hardening

- **Storage & Uploads**
  - Extract a storage abstraction around `fileKey`/`fileUrl` so local and S3/R2 backends can be swapped via configuration.
  - Centralize file validation (size limits, MIME types, allowed extensions) for all upload APIs.
  - Ensure consistent preview generation and cleanup when resources are updated or deleted.
- **Downloads & Access**
  - Standardize all resource and version downloads through a single authorization/checkpoint layer.
  - Add more explicit error states and logging for failed or unauthorized downloads.
- **Draft / Publish & Version UX**
  - Improve admin UX around `ResourceStatus` (DRAFT/PUBLISHED/ARCHIVED), including clear indicators and filters.
  - Surface `ResourceVersion` history in the admin resource detail view with changelog text.

### Phase 2 — Payments & Subscriptions

- **Plan & Product Mapping**
  - Centralize mapping of subscription plans to Stripe products/prices in a dedicated configuration module.
  - Align `subscriptionPlan` values with Stripe/Xendit metadata to avoid drift.
- **Subscription Flows**
  - Implement upgrade/downgrade flows that handle proration and clearly communicate changes to users.
  - Build a cancellation flow with clear post-cancellation access rules (e.g., access until period end).
- **Billing Transparency**
  - Add a billing history page per user, aggregating data from `Purchase` and payment providers.
  - Provide receipt/invoice access (links to Stripe/Xendit-hosted invoices or locally generated PDFs).

### Phase 3 — Creator Tools

- **Creator Dashboard**
  - Introduce a dedicated dashboard surface for `INSTRUCTOR` users, separate from admin.
  - Show an overview of authored resources, status breakdowns, and key metrics (views, downloads, purchases).
- **Resource Authoring Experience**
  - Turn the existing admin resource forms into a guided wizard for creators (metadata → files → previews → pricing → publish).
  - Add better feedback for draft validation errors and checklist-style readiness indicators before publishing.
- **Future Earnings & Payouts (foundation)**
  - Extend the schema with initial `Earning`/`Payout` concepts (even if not yet wired to a provider).
  - Design how revenue sharing would be calculated per resource and per creator.

### Phase 4 — Security

- **Download Protection**
  - Implement signed, short-lived URLs for all private file downloads, generated by a storage abstraction.
  - Log and alert on suspicious download patterns (e.g., high frequency from a single account/IP).
- **Admin & API Hardening**
  - Add stricter role checks and rate limiting around sensitive admin endpoints.
  - Expand `AuditLog` usage around destructive admin actions and version rollbacks.
- **Compliance Basics**
  - Provide user data export and deletion tooling to support privacy requirements.
  - Document data retention policies for logs and webhooks.

### Phase 5 — Analytics

- **Admin Analytics**
  - Build richer analytics dashboards for admins: revenue trends, category performance, top resources, and user growth.
  - Add cohort and retention metrics (e.g., first purchase vs repeat purchases, subscription retention by cohort).
- **Creator Analytics**
  - Provide creators with per-resource analytics (views, downloads, purchases, conversion rate, rating trends).
  - Highlight underperforming resources and surface suggestions for improvement (e.g., incomplete metadata, low previews).
- **Instrumentation**
  - Standardize event logging for key funnel steps (view → add to library → purchase).
  - Introduce basic experimentation support on key marketing pages (A/B tests for hero copy, CTAs).

### Phase 6 — Growth

- **Engagement Features**
  - Implement favorites/wishlists and “save for later” lists tied to user accounts.
  - Add email or in-app digests for new or trending resources in followed categories.
- **Referrals & Promotions**
  - Add promo code support in checkout flows, integrated with Stripe and/or Xendit.
  - Design a simple referral program with tracking codes and basic incentives.
- **Internationalization Expansion**
  - Add support for additional locales beyond Thai and English based on demand.
  - Introduce locale-specific marketing content and pricing where appropriate.

