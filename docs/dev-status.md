## Development Status – KruCraft

### System Status

| System            | Status  | Notes |
|-------------------|---------|-------|
| Authentication    | Done    | NextAuth with Prisma adapter, roles, and auth UI are in place. |
| Resource marketplace | Done | Public catalog, resource detail pages, categories, tags, reviews, and search are implemented. |
| Resource upload   | Partial | Admin upload flows and components exist; storage abstraction and validation hardening still needed. |
| Storage backend   | Partial | Local `private-uploads` with fileKey/fileUrl fields; no pluggable S3/R2-style backend yet. |
| Secure downloads  | Partial | Downloads are gated via `/api/download` and purchase checks, but lack signed, expiring URLs and rate limiting. |
| Payments (one-off)| Done    | Stripe and Xendit checkout flows plus webhooks and `Purchase` records are implemented. |
| Subscriptions     | Partial | Subscription fields, APIs, and membership UI exist; lifecycle flows and billing history need maturation. |
| Analytics         | Partial | Admin analytics pages and metrics utilities exist; deeper cohort and creator analytics are not yet built. |
| Creator tools     | Partial | Creators can author resources, but there is no dedicated creator dashboard or earnings tooling. |
| Admin dashboard   | Done    | Admin UI for resources, taxonomy, reviews, users, orders, activity, audit logs, and settings is implemented. |
| Logging & audit   | Done    | Activity and audit logs are persisted and surfaced via admin pages. |

### Current Development Focus

- Harden core marketplace flows (upload, storage, downloads).
- Mature subscriptions and billing UX around the existing Stripe/Xendit integration.
- Grow creator-facing capabilities (dashboards, metrics, future payouts).

### Development Checklist

#### Marketplace & Files

- [ ] Extract a storage abstraction (local vs S3/R2) for resource files and previews.
- [ ] Centralize file size/MIME/extension validation for all upload endpoints.
- [ ] Ensure all file downloads are served via signed, short-lived URLs.
- [ ] Add basic rate limiting and anomaly detection around download endpoints.

#### Payments & Subscriptions

- [ ] Map subscription plans to Stripe products/prices in a single configuration module.
- [ ] Implement clear upgrade/downgrade and cancellation flows in the dashboard.
- [ ] Build a subscription and billing history page backed by `Purchase` and provider data.
- [ ] Add monitoring/alerting for failing Stripe/Xendit webhooks using `WebhookEvent`.

#### Analytics

- [ ] Extend admin analytics with revenue, top resources, and growth charts.
- [ ] Add basic funnel tracking (view → add to library → purchase).
- [ ] Design and implement creator-facing analytics views per resource.

#### Creator Tools

- [ ] Introduce a dedicated creator dashboard separate from the admin area.
- [ ] Enhance the resource creation flow with a guided wizard and better draft/publish UX.
- [ ] Prepare schema and APIs for future creator earnings and payouts (if marketplace revenue sharing is planned).

