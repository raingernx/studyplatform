# Production Codebase Audit Report

**Date:** March 18, 2026
**Scope:** Full system-wide audit — Next.js App Router + Prisma marketplace
**Auditor posture:** Principal-level, adversarial, evidence-based

---

## 1. System Health Summary

**Overall verdict: MIXED — usable but not production-safe without fixes.**

**What looks solid:**
- Creator dashboard is backed by real database queries with proper service-layer abstraction
- Review submission flow correctly enforces purchaser-only guards with unique constraints
- `isVisible` filtering is consistently applied on all public-facing review queries
- Download access properly checks purchase status for paid resources
- Prisma singleton and query select optimization exists in key paths
- Cache architecture has a clear tagging scheme (`discover`, `creatorPublic`, `platform`)
- Middleware correctly guards admin paths with role checks
- Webhook signature verification implemented for Stripe/Xendit

**What looks fragile:**
- 10+ admin pages bypass the repository/service layer with direct Prisma calls
- Debug HTTP requests to localhost are shipped in 3 production components
- User dashboard displays fake/hardcoded metrics to real users
- Admin resource mutations don't invalidate `creatorPublic` cache (stale creator profiles)
- Cache tag usage is inconsistent (string literals vs constants)
- Purchase completion logic is duplicated across 5 nearly-identical functions
- Stripe session IDs are logged to console in production
- Hero analytics endpoints have zero rate limiting

---

## 2. Top Critical Findings

### FINDING C-1: Debug HTTP Requests Shipped in Production Components
- **Severity:** Critical
- **Category:** Security
- **Files:**
  - `src/components/LanguageSwitcher.tsx` (line 22)
  - `src/components/admin/NotificationItem.tsx` (line 34)
  - `src/features/notifications/useNotifications.tsx` (line 64)
- **Problem:** Three components contain `fetch("http://127.0.0.1:7472/ingest/...")` calls with hardcoded session IDs (`"839f66"`, `"b78fc7"`), sending user interaction data (locale switches, notification types) to a local debug endpoint. These fire on every user interaction in the affected flows.
- **Impact:** Unnecessary network requests on every client interaction; if the endpoint were publicly exposed, it leaks user behavior data. The `.catch(() => {})` suppresses errors silently but the requests still fire, degrading client performance.
- **Confidence:** Confirmed — verified in source.

### FINDING C-2: User Dashboard Shows Fake Metrics
- **Severity:** Critical
- **Category:** Placeholder/Fake Logic, Data Consistency
- **File:** `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- **Problems:**
  1. **Line 81:** `trend: "+2 this month"` is a hardcoded string — never computed from actual data
  2. **Lines 84-85:** "Total Downloads" displays `purchases.length` — identical to "Resources Owned." This is a duplicate metric masquerading as a different one. Actual download counts are never queried.
  3. **Lines 337-338:** Quick links "Downloads" count also shows `purchases.length`
- **Impact:** Users see fabricated growth trends and incorrect download counts. Erodes trust if noticed.
- **Confidence:** Confirmed.

### FINDING C-3: Stripe Session ID Logged to Console in Production
- **Severity:** High
- **Category:** Security
- **Files:**
  - `src/services/payments/stripe-payment.service.ts` (line 120): `console.log("CHECKOUT SESSION CREATED:", checkoutSession.id)`
  - `src/services/payments/xendit-payment.service.ts` (line 84): `console.log("[XENDIT CHECKOUT] Invoice created:", {...})`
- **Impact:** Sensitive payment session identifiers written to server logs. In shared hosting or centralized logging, these could be accessed by unauthorized personnel.
- **Confidence:** Confirmed.

### FINDING C-4: Admin Resource Mutations Don't Invalidate Creator Profile Cache
- **Severity:** High
- **Category:** Cache/Revalidation, Data Consistency
- **Files:**
  - `src/app/api/admin/resources/route.ts` (line 32): only `revalidateTag("discover")`
  - `src/app/api/admin/resources/[id]/route.ts` (lines 59, 78)
  - `src/app/api/admin/resources/bulk/route.ts` (lines 57, 74)
  - `src/app/api/admin/resources/[id]/trash/route.ts` (lines 61, 116)
- **Compare with creator routes:** `src/app/api/creator/resources/route.ts` (lines 50-51) correctly invalidates BOTH `CACHE_TAGS.discover` AND `CACHE_TAGS.creatorPublic`.
- **Impact:** When an admin edits, publishes, or trashes a creator's resource, the creator's public profile page remains stale for up to 120 seconds. Users visiting the creator's profile see outdated resource counts and listings.
- **Confidence:** Confirmed.

---

## 3. Full Findings by Surface

### A. Marketplace / Discover

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| A-1 | Discover data properly cached with `unstable_cache` (120s TTL, "discover" tag) | ✅ Solid | `services/discover.service.ts:135-222` | Confirmed |
| A-2 | Category resource counts fetched inconsistently — discover service fetches `_count.resources` but admin page doesn't | Low | `services/discover.service.ts:159` vs `admin/resources/page.tsx:106` | Confirmed |
| A-3 | Recommended resources on user dashboard use `include` instead of optimized `select` — fetches all resource fields | Low | `dashboard/page.tsx:51-54` | Confirmed |
| A-4 | `PUBLIC_RESOURCE_WHERE` properly excludes non-PUBLISHED and non-PUBLIC resources from listings | ✅ Solid | `lib/query/resourceFilters.ts` | Confirmed |

### B. Resource Detail / Purchase / Ownership

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| B-1 | `getResourceBySlug()` does not apply visibility filter — unlisted resources accessible by direct URL | Medium | `services/resource.service.ts:269-274` | Confirmed (may be intentional per code comment) |
| B-2 | Resource detail page checks `status !== "PUBLISHED"` but doesn't check `visibility` field | Medium | `app/resources/[slug]/page.tsx:78` | Confirmed |
| B-3 | Download access properly enforced: auth + purchase check for paid, free bypass intentional | ✅ Solid | `services/purchases/download.service.ts:44-81` | Confirmed |
| B-4 | Purchase completion logic duplicated across 5 functions with identical 3-step workflow | High | `repositories/purchases/purchase.repository.ts:387-583` | Confirmed |
| B-5 | `recordDownloadAnalytics()` uses `Promise.all` without transaction — increment and event creation can diverge | Medium | `repositories/purchases/purchase.repository.ts:605-621` | Confirmed |

### C. Reviews / Moderation / Analytics

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| C-1 | Public review queries consistently filter `isVisible: true` | ✅ Solid | `repositories/reviews/review.repository.ts:140-196` | Confirmed |
| C-2 | Purchaser-only enforcement on review create/update working correctly | ✅ Solid | `services/review.service.ts:75-79, 126-130` | Confirmed |
| C-3 | Unique constraint `@@unique([userId, resourceId])` prevents duplicate reviews | ✅ Solid | Prisma schema | Confirmed |
| C-4 | `normalizeAverageRating()` called in two separate code paths — if logic changes, both must be updated | Low | `services/review.service.ts:189, 211` | Confirmed |
| C-5 | Review visibility toggle doesn't validate the DB update succeeded before returning success | Low | `repositories/reviews/review.repository.ts:122-134` | Confirmed |

### D. Creator Dashboard

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| D-1 | Creator dashboard stats backed by real service calls — no fake metrics | ✅ Solid | `dashboard/creator/page.tsx:55-60` | Confirmed |
| D-2 | Creator analytics page uses real DB aggregates | ✅ Solid | `dashboard/creator/analytics/page.tsx:58-61` | Confirmed |
| D-3 | "Request payout" button is disabled with no implementation | Medium | `dashboard/creator/page.tsx:250` | Confirmed |
| D-4 | Creator sales page properly queries real transaction data | ✅ Solid | `dashboard/creator/sales/page.tsx:27` | Confirmed |

### E. Admin Dashboard

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| E-1 | Admin home page metrics are real DB aggregates | ✅ Solid | `admin/page.tsx:16-75` | Confirmed |
| E-2 | 10+ admin pages bypass repository/service layer with direct Prisma calls | High | `admin/page.tsx`, `admin/resources/page.tsx`, `admin/orders/page.tsx`, `admin/users/page.tsx`, `admin/tags/page.tsx`, `admin/tags/actions.ts`, `admin/audit/page.tsx`, `admin/resources/[id]/page.tsx`, `admin/resources/[id]/versions/page.tsx`, `admin/resources/new/page.tsx`, `admin/resources/trash/page.tsx` | Confirmed |
| E-3 | Admin users page has "View", "Suspend", "Delete" buttons with no onClick handlers | Medium | `admin/users/page.tsx:137-145` | Confirmed |
| E-4 | Admin auth pattern inconsistent — some routes use `requireAdmin()` helper, others inline checks | Medium | Various admin API routes | Confirmed |
| E-5 | "Billing portal (soon)" button permanently disabled | Low | `subscription/page.tsx:191-196` | Confirmed |

### F. Architecture / Repository / Service

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| F-1 | Purchase completion functions contain business logic (find → update → increment) in repository layer | High | `repositories/purchases/purchase.repository.ts:387-583` | Confirmed |
| F-2 | `findAdminActor()` lives in resource repository but is imported by review service | Low | `repositories/resources/resource.repository.ts:141-146` | Confirmed |
| F-3 | `CreatorServiceError` and `ReviewServiceError` are identical classes — no shared base | Low | `services/creator.service.ts:120-128`, `services/review.service.ts:19-27` | Confirmed |
| F-4 | Creator profile fetch logic duplicated ~95% between `findCreatorProfileBySlug()` and `findCreatorPublicProfileById()` | Medium | `repositories/creators/creator.repository.ts:157-298` | Confirmed |
| F-5 | Validation schemas (Zod) embedded in service layer instead of dedicated validation module | Low | `services/creator.service.ts:51-114` | Confirmed |

### G. Caching / Revalidation

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| G-1 | Admin resource routes use string literal `"discover"` instead of `CACHE_TAGS.discover` constant | Medium | `api/admin/resources/route.ts:32`, `api/admin/resources/bulk/route.ts:57,74`, `api/admin/resources/[id]/route.ts:59,78`, `api/admin/resources/[id]/trash/route.ts:61,116` | Confirmed |
| G-2 | Admin resource mutations missing `creatorPublic` tag invalidation (see C-4 above) | High | Same files | Confirmed |
| G-3 | `router.refresh()` used in 6+ components instead of server actions with `revalidatePath()` | Medium | `CreateResourceForm.tsx`, `EditResourceForm.tsx`, `TagsClient.tsx`, `CreatorProfileForm.tsx`, `AdminResourcesClearButton.tsx`, `login/page.tsx` | Confirmed |
| G-4 | Role cache in JWT callback has 60s staleness window (per-process in-memory cache) | Low | `lib/auth.ts` | Confirmed (acceptable tradeoff) |
| G-5 | Review mutations invalidate `discover` tag broadly — no granular per-resource invalidation | Low | `api/resources/[id]/reviews/route.ts:39,76` | Confirmed |

### H. Database / Prisma / Query Health

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| H-1 | `findResourceById()` and `findResourceBySlug()` return all fields with no select optimization | Low | `repositories/resources/resource.repository.ts:170-195` | Confirmed |
| H-2 | Analytics repository mixes raw SQL and Prisma ORM for similar aggregations — inconsistent error handling | Medium | `repositories/analytics/analytics.repository.ts` | Confirmed |
| H-3 | User dashboard `getDashboardData()` fetches all completed purchases (no pagination) then slices client-side | Medium | `dashboard/page.tsx:26-44` | Confirmed |
| H-4 | Recommended resources query uses `include` instead of `select` — over-fetches all resource fields | Low | `dashboard/page.tsx:51-54` | Confirmed |
| H-5 | N+1 patterns generally well-avoided; relation includes used properly | ✅ Solid | Multiple repositories | Confirmed |

### I. Security / Access Control

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| I-1 | Debug localhost fetch calls in 3 production components (see C-1 above) | Critical | 3 files | Confirmed |
| I-2 | Stripe/Xendit session IDs logged to console (see C-3 above) | High | 2 files | Confirmed |
| I-3 | Hero analytics POST endpoints (`/api/hero/impression`, `/api/hero/click`) have zero rate limiting and no auth | Medium | `api/hero/impression/route.ts`, `api/hero/click/route.ts` | Confirmed |
| I-4 | Hero aggregate analytics GET endpoint (`/api/heroes/[id]/analytics`) exposes CTR data publicly | Low | `api/heroes/[id]/analytics/route.ts` | Confirmed |
| I-5 | Rate limiter fails open when Redis is unreachable (`success: true`) | Low | `lib/rate-limit.ts:123-128` | Confirmed (availability tradeoff) |
| I-6 | `NEXTAUTH_URL` / `VERCEL_URL` fallback to `http://localhost:3000` — payment redirects fail silently if env misconfigured | Medium | `lib/api.ts:8`, `services/payments/stripe-payment.service.ts:78,147` | Confirmed |
| I-7 | Middleware properly protects `/admin` paths with role check | ✅ Solid | `middleware.ts` | Confirmed |
| I-8 | Creator resource ownership delegated to service layer — route handlers don't verify ownership directly | Low-Medium | `api/creator/resources/[id]/route.ts:45-62` | Needs runtime verification |

### J. Placeholder / Fake Logic

| # | Finding | Severity | File(s) | Confidence |
|---|---------|----------|---------|------------|
| J-1 | User dashboard "+2 this month" hardcoded trend | Critical | `dashboard/page.tsx:81` | Confirmed |
| J-2 | User dashboard "Total Downloads" = `purchases.length` (same as Resources Owned) | Critical | `dashboard/page.tsx:84-85` | Confirmed |
| J-3 | Admin user management buttons ("View", "Suspend", "Delete") have no handlers | Medium | `admin/users/page.tsx:137-145` | Confirmed |
| J-4 | "Request payout" button disabled, no implementation | Medium | `dashboard/creator/page.tsx:250` | Confirmed |
| J-5 | "Billing portal (soon)" permanently disabled | Low | `subscription/page.tsx:192` | Confirmed |
| J-6 | Hardcoded category metadata (emoji, color, description) for 4 categories — new categories get generic fallback | Low | `app/categories/[slug]/page.tsx:11-39` | Confirmed |

---

## 4. Performance Risk Report

### Likely N+1s
None confirmed. The codebase generally uses Prisma `include` properly for related data.

### Repeated Aggregate Work
- Review trust signals (`attachResourceTrustSignals`) and single-resource trust summary (`getResourceTrustSummary`) are separate functions with duplicated normalization logic. No shared computation.
- Admin dashboard home runs 6 parallel Prisma count/aggregate queries — acceptable for admin but will slow down if data grows large.

### Expensive Page Loads
- **User dashboard (`dashboard/page.tsx`):** Fetches ALL completed purchases for the user with no pagination (`findMany` with no `take`). For power users with hundreds of purchases, this degrades linearly.
- **Admin resources page:** Direct Prisma queries with revenue aggregation inline — no caching, no pagination limits visible.

### Broad Cache Invalidation
- Every review mutation invalidates the entire `discover` tag, which busts the cache for trending, popular, newest, featured, and free resource lists. A single review triggers recomputation of all discover sections.

### Likely Missing Indexes (Inferred)
- Queries on `Purchase` by `userId + status` are frequent — compound index likely needed if not already present.
- `Review` queries filter on `resourceId + isVisible` — compound index recommended.
- `Resource` queries filter on `status + visibility + deletedAt` — compound index on these columns would help.

---

## 5. Architecture Integrity Report

### Respects Architecture
- Creator dashboard, creator resources, creator analytics — properly use services → repositories → Prisma
- Review create/update flow — properly uses review service → review repository
- Discover/marketplace — uses discover service with caching layer
- Hero system — clean repository with dedicated service and cache module

### Violates Architecture
- **10+ admin pages** make direct `prisma.*` calls instead of going through repositories/services. This is the single largest architecture violation.
- **Purchase repository** contains business orchestration logic (find → update → increment) that belongs in a service layer.
- **User dashboard page** (`dashboard/page.tsx`) contains a `getDashboardData()` function with direct Prisma calls — should be a service.
- **Subscription page** uses direct Prisma to fetch user data.

### Auth Boundary Consistency
- Middleware protects admin paths (solid).
- API routes have inconsistent auth patterns — some use `requireAdmin()` helper, others inline session/role checks. Two separate implementations of `requireAdmin()` exist.
- Creator ownership verification is delegated to service layer, not enforced at route level.

### Reuse vs Duplication
- `requireAdmin()` duplicated in at least 2 files
- `ServiceError` classes duplicated across 2 services
- Creator profile fetch logic duplicated 95% between two repository functions
- 5 purchase completion functions share ~90% identical code

---

## 6. Fast Wins

1. **Remove debug fetch calls** (3 files, ~15 lines each) — delete the `#region agent log` blocks from `LanguageSwitcher.tsx`, `NotificationItem.tsx`, `useNotifications.tsx`. Zero risk, immediate security improvement.

2. **Fix hardcoded dashboard metrics** (`dashboard/page.tsx`) — replace `"+2 this month"` with actual computed value or remove the trend entirely. Replace "Total Downloads" with actual download count or rename to "Total Purchases."

3. **Add `CACHE_TAGS.creatorPublic` invalidation to admin resource routes** — add one line (`revalidateTag(CACHE_TAGS.creatorPublic, "max")`) to 4 admin route files. Fixes stale creator profile bug.

4. **Standardize cache tag references** — replace string literals `"discover"` with `CACHE_TAGS.discover` in admin routes. Pure refactor, zero behavior change.

5. **Remove `console.log` of payment session IDs** — delete 2 log statements in payment services.

6. **Extract shared `requireAdmin()` helper** — move to `lib/admin-guard.ts`, update 2+ import sites.

---

## 7. High-Impact Fix Plan

### Phase A: Critical Correctness / Security (1-2 days)
1. Remove debug localhost fetch calls from 3 components
2. Remove payment session ID console.log statements
3. Fix user dashboard fake metrics (hardcoded trend, duplicate download count)
4. Add `creatorPublic` cache invalidation to all admin resource mutation routes
5. Add rate limiting to hero analytics POST endpoints

### Phase B: High-Impact Performance / Data Consistency (2-3 days)
1. Extract admin page Prisma calls into repository/service layer (10+ files)
2. Consolidate 5 purchase completion functions into shared helper
3. Add pagination to user dashboard purchase fetch
4. Wrap `recordDownloadAnalytics()` in a transaction
5. Standardize all cache tag references to use constants

### Phase C: Dashboard Realism / Operational Visibility (2-3 days)
1. Implement admin user management actions (View/Suspend/Delete)
2. Wire up "Request payout" functionality or add clear "coming soon" messaging
3. Build billing portal integration or remove the disabled button
4. Extract shared `ServiceError` base class
5. Extract shared `requireAdmin()` helper

### Phase D: Lower-Priority Cleanup (ongoing)
1. Deduplicate creator profile fetch functions
2. Add `select` optimization to `findResourceById` / `findResourceBySlug`
3. Move validation schemas out of service layer
4. Add granular per-resource cache invalidation for reviews
5. Move `findAdminActor()` to a user repository
6. Make category metadata dynamic instead of hardcoded

---

## 8. Recommended First 3 Engineering Tasks

### Task 1: Security Cleanup (highest urgency)
Remove the 3 debug fetch calls and 2 payment log statements. This is ~30 minutes of work with zero risk and eliminates the most embarrassing production issues.

**Files to touch:**
- `src/components/LanguageSwitcher.tsx` — delete lines 21-38
- `src/components/admin/NotificationItem.tsx` — delete debug fetch block
- `src/features/notifications/useNotifications.tsx` — delete debug fetch block
- `src/services/payments/stripe-payment.service.ts` — delete line 120
- `src/services/payments/xendit-payment.service.ts` — delete line 84

### Task 2: Fix User Dashboard Data Integrity
Replace the fake/duplicate metrics on the user dashboard with either real data or honest labels. This prevents users from seeing fabricated growth numbers.

**Files to touch:**
- `src/app/[locale]/(dashboard)/dashboard/page.tsx` — fix lines 81, 84-85, 337-338

### Task 3: Fix Admin Cache Invalidation Gap
Add `revalidateTag(CACHE_TAGS.creatorPublic, "max")` to all admin resource mutation routes. This prevents creator profiles from going stale after admin actions.

**Files to touch:**
- `src/app/api/admin/resources/route.ts`
- `src/app/api/admin/resources/[id]/route.ts`
- `src/app/api/admin/resources/bulk/route.ts`
- `src/app/api/admin/resources/[id]/trash/route.ts`

---

## Ready-for-Patch Options

1. **Safest critical fixes first:** Tasks 1 + 2 + 3 above — removes debug code, fixes fake metrics, fixes stale cache. All are isolated, low-risk changes that don't touch business logic.

2. **Highest performance ROI:** Paginate user dashboard purchases + consolidate purchase completion functions + transaction-wrap `recordDownloadAnalytics()`. Prevents performance degradation at scale and eliminates a data consistency risk.

3. **Highest product-impact:** Fix user dashboard metrics + implement admin user management buttons + wire payout request flow. These are the most visible gaps between what the product promises and what it delivers.
