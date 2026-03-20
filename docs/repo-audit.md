## Architecture Overview

KruCraft is a SaaS marketplace for downloadable learning resources built on:

- **Next.js 16 App Router** with locale-based routing under `app/[locale]/...` and route groups for marketing, dashboard, and admin flows.
- **TypeScript** and **Tailwind CSS** for strongly-typed, utility-first UI.
- **Prisma + PostgreSQL** for persistence, with models for users, resources, purchases, reviews, webhooks, activity logs, and audit logs.
- **NextAuth** for authentication, including email/password and OAuth, with user roles (`ADMIN`, `INSTRUCTOR`, `STUDENT`) and subscription metadata on `User`.
- **Stripe + Xendit** for payments, with webhook handlers and a `WebhookEvent` dead-letter table.
- **next-intl** for internationalization, using `src/i18n/*`, `app/[locale]/layout.tsx`, and middleware to handle locale detection and message loading.

High-level structure:

- `src/app` contains:
  - Locale-aware routes under `app/[locale]`:
    - `(marketing)` group for the landing page, marketplace (`resources`), categories, and membership/pricing.
    - `(dashboard)` group for authenticated user dashboard pages (overview, library, downloads, purchases, subscription, settings).
    - `admin` segment for the admin dashboard (resources, categories, tags, reviews, users, orders, analytics, activity, audit logs, settings).
  - Legacy non-localized route groups such as `app/(dashboard)` and `app/admin`, which still contain implementations reused by the localized wrappers.
  - API routes under `app/api/**` for auth, resources, uploads, downloads, purchases, subscriptions, Stripe/Xendit webhooks, and admin operations.
- `src/components` provides:
  - Layout shells (`Navbar`, `Footer`, `AppLayout`, `DashboardLayout`, `AdminLayout`, sidebars/topbars).
  - Marketplace components (`ResourceCard`, `ResourceGrid`, filters, search, category chips).
  - Dashboard and admin UI (tables, filters, stats cards, upload widgets, preview galleries).
  - Shared primitives (buttons, cards, sections, containers, modals, toasts, etc.).
- `src/lib` contains:
  - Cross-cutting utilities for auth (`auth.ts`), Prisma client, formatting, analytics, activity/audit logging, Stripe/Xendit integrations, and route translation helpers.
- `src/features` includes:
  - UX-focused hooks and providers for admin UX, uploads, undo, and notifications.

Overall, the architecture is typical for a modern Next.js SaaS: clear separation between public marketing, user dashboard, and admin areas; strong domain modeling for resources and payments; and i18n built around the `[locale]` segment.

## Problems Found

- **Duplicate layouts and route groups**
  - Both non-localized and localized layouts exist:
    - `(dashboard)/layout.tsx` and `[locale]/(dashboard)/layout.tsx` are effectively the same dashboard layout.
    - `admin/layout.tsx` and `[locale]/admin/layout.tsx` are identical admin layouts.
  - Non-localized `app/(dashboard)` and `app/admin` trees still contain core implementations while `[locale]/(dashboard)` and `[locale]/admin` add localized wrappers. This works but increases cognitive load and makes it harder to know which layout/page is canonical.

- **Legacy non-localized routes alongside localized wrappers**
  - Many pages now live under `[locale]` (especially marketing, dashboard, and admin), but the original non-localized routes remain and are still routable (e.g., `/dashboard`, `/admin`).
  - This can lead to subtle differences in behavior between `/dashboard` and `/en/dashboard` or `/th/dashboard` and makes it easier to accidentally wire new links to the wrong segment.

- **Invalid route config re-exports (historical)**
  - Some localized wrappers previously re-exported config like `generateMetadata` together with `default`, which is discouraged for thin wrappers. These have been cleaned up in recent work, but it is important to keep the pattern of only re-exporting the `default` page component from localization wrappers going forward.

- **Routing complexity around marketing vs dashboard vs admin**
  - The current structure largely follows a good pattern (`[locale]/(marketing)`, `[locale]/(dashboard)`, `[locale]/admin`), but there is still a mix of:
    - Marketing pages that rely on global layouts and components also used in the dashboard.
    - Legacy marketing routes outside of `(marketing)` which may still be reachable and could confuse future contributors.

- **Potential dead or duplicate components**
  - There are multiple grid and card components with overlapping responsibilities (e.g., `components/resources/ResourceGrid.tsx` vs `components/ui/ResourceGrid.tsx`, and marketplace vs resources card variants).
  - Some admin-specific components (e.g., analytics and activity log clients) may have older or unused variants as the admin UI has evolved.
  - A deeper component-level usage analysis would be required to definitively mark components as dead, but the presence of near-duplicate patterns suggests consolidation opportunities.

- **Mixed responsibility in some route groups**
  - The legacy `(dashboard)` group and `admin` group still contain core page logic even though localized wrappers under `[locale]` now define the canonical URLs.
  - This increases the chance of future features being added in the wrong place (e.g., implementing a new dashboard page only in the non-localized group).

- **Middleware and i18n complexity**
  - The project composes `next-intl` middleware with NextAuth and custom locale detection logic, which is correct but non-trivial.
  - Any future middleware additions must be careful not to reintroduce patterns like re-exporting `config` from another file or duplicating locale detection logic.

- **Security and performance refinements deferred to future work**
  - While not strictly structural, some areas are left intentionally basic in the current architecture:
    - Downloads are gated but do not yet use signed URLs with expiry by default.
    - Analytics and admin queries may require further pagination/caching as data grows.
  - These are captured in the separate system status, roadmap, and refactor plan documents as future improvements rather than immediate structural bugs.

