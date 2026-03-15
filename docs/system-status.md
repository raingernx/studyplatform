## System Status – PaperDock

| System                | Status       | Notes |
|-----------------------|-------------|-------|
| Authentication        | Implemented | NextAuth with Prisma adapter, email/password and OAuth, user roles (`ADMIN`, `INSTRUCTOR`, `STUDENT`), and auth UI under `app/auth`. |
| Resource marketplace  | Implemented | Public catalog, resource detail pages, categories, tags, reviews, and search/filtering are wired through `app/[locale]/(marketing)` and related components. |
| Resource upload flow  | Partial     | Admin resource create/edit pages and upload widgets exist; upload APIs handle files and images, but storage abstraction and validation hardening remain to be done. |
| File storage backend  | Partial     | Resources store `fileKey` and `fileUrl`, currently targeting local `private-uploads`; no pluggable S3/R2-style backend or configuration layer yet. |
| Secure download system| Partial     | `/api/download/[resourceId]` and related version download endpoints gate access using purchases, but downloads do not consistently use signed, expiring URLs or rate limiting. |
| Purchases             | Implemented | `Purchase` model with statuses, provider metadata, and one-record-per-user-per-resource, plus checkout endpoints and access checks. |
| Subscription billing  | Partial     | `User` has subscription fields and `SubStatus`, subscription APIs and membership UI exist, but upgrade/downgrade flows, billing history, and edge-case handling need further work. |
| Payment webhooks      | Implemented | Stripe and Xendit webhook routes process events and write to `WebhookEvent` for dead-letter storage and later inspection. |
| Creator tools         | Partial     | Creators can author resources and manage them via admin-like tooling, but there is no dedicated creator dashboard, earnings view, or self-service onboarding path. |
| Payout system         | Missing     | No schema for earnings, payouts, or balances, and no integration with Stripe Connect or alternative payout provider. |
| Analytics             | Partial     | Admin analytics pages and metrics utilities exist; deeper cohort, funnel, and creator-level analytics are not yet implemented. |
| Moderation tools      | Partial     | Admin can manage resources, reviews, and users, and audit logs capture actions; there is no explicit abuse-reporting system or dedicated moderation workflows. |
| Resource versioning   | Implemented | `ResourceVersion` model and admin version APIs (list, download, rollback) support version snapshots and rollbacks. |
| Draft/publish workflow| Partial     | `ResourceStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) and draft-related APIs exist; more advanced review/approval flows and scheduled publishing are not present. |

