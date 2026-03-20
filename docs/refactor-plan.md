## Refactor Plan – KruCraft

### Routing Improvements

- Standardize on `[locale]/(marketing)`, `(dashboard)`, and `admin` as the primary entry points for public, user, and admin areas, respectively.
- Treat legacy non-localized route groups such as `app/(dashboard)` and `app/admin` as implementation details only and plan to gradually deprecate direct access to `/dashboard` and `/admin` in favor of `/[locale]/dashboard` and `/[locale]/admin`.
- Ensure all marketing pages (home, resources, categories, membership) live under `[locale]/(marketing)` and do not rely on dashboard/admin route groups.
- Keep all dashboard pages under `[locale]/(dashboard)` and ensure links and redirects always target the locale-aware paths.
- Keep all admin pages under `[locale]/admin` and ensure the admin navigation uses locale-agnostic paths that are correctly prefixed via i18n-aware navigation helpers.

### Layout Cleanup

- Confirm `app/layout.tsx` remains the sole owner of `<html>` and `<body>`, with fonts and global styles applied there.
- Keep `app/[locale]/layout.tsx` responsible only for locale validation, `NextIntlClientProvider`, and application-level providers (no HTML/body).
- Make `[locale]/(dashboard)/layout.tsx` the canonical dashboard shell, and demote `(dashboard)/layout.tsx` to a thin wrapper or internal implementation detail.
- Make `[locale]/admin/layout.tsx` the canonical admin shell, and treat `admin/layout.tsx` as legacy or remove it when no longer needed.
- Where possible, move repeated layout logic (e.g., shared headers/footers) into shared components rather than duplicating it across layouts.

### Component Consolidation

- Consolidate grid and card implementations around canonical components:
  - Use `components/resources/ResourceCard.tsx` and `components/resources/ResourceGrid.tsx` (or a single canonical grid) for resource listings.
  - Avoid introducing new card/grid patterns when existing ones can be reused or extended.
- Review marketplace vs resources card components to remove any old or unused variants, keeping a single, well-typed API for resource cards.
- Identify and retire any duplicated components that are no longer referenced (e.g., older admin tables or analytics widgets) after verifying usage.

### API Route Consistency

- Keep public-facing marketplace APIs under `app/api/resources/**` and related endpoints (`library`, `purchases`) focused on user-facing operations.
- Keep admin-only operations under `app/api/admin/**`, with clear separation between content management (resources, categories, tags, reviews, users) and analytics/logging (activity, audit, analytics).
- Ensure naming conventions are consistent across admin routes (e.g., singular vs plural, `resources/[id]/versions` vs alternative patterns).
- For webhooks, maintain one route per provider (`/api/stripe/webhook`, `/api/xendit/webhook`) and ensure all provider-specific behavior is encapsulated behind clear boundaries in `src/lib`.

### Security Improvements

- Introduce a storage abstraction that can issue signed, expiring URLs for all private downloads and integrate it into `/api/download` and version download routes.
- Add rate limiting and IP/user-agent-based anomaly detection to download and sensitive admin endpoints.
- Expand `AuditLog` usage around high-risk admin actions (resource deletion, version rollback, role changes, payout-related operations once implemented).
- Tighten role checks across admin APIs to ensure only `ADMIN` (and potentially scoped `INSTRUCTOR`) roles can perform destructive operations.
- Ensure webhook endpoints validate signatures and log malformed or unexpected events into `WebhookEvent` with sufficient context for debugging.

### Performance Improvements

- Introduce pagination and sensible defaults for any large admin listings (resources, users, orders, logs) that might currently be unbounded.
- Apply caching and `revalidate` settings to expensive analytics endpoints and pages where data freshness requirements permit it.
- Review N+1 query patterns in dashboard and admin analytics queries and refactor them to use batched or aggregate queries via Prisma.
- Consider lazy-loading heavy admin and analytics components where possible to keep initial load times reasonable.

