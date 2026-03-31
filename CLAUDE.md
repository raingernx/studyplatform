# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Project Overview

- **KruCraft** is a Thai EdTech SaaS platform — a marketplace for downloadable digital learning resources.
- Creators upload and sell resources; students browse, purchase, and download them.
- Payments are processed via **Stripe** (international) and **Xendit** (Thai payment methods).
- Files are stored privately in **Cloudflare R2** and served only through authorized API routes.
- The platform includes a creator dashboard, admin panel, subscription system, and analytics.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v4 (JWT sessions, Prisma adapter) |
| Payments | Stripe (purchases + subscriptions), Xendit (Thai methods) |
| File Storage | Cloudflare R2 (S3-compatible, private) |
| Caching / Rate-limiting | Upstash Redis |
| UI | Tailwind CSS, Radix UI, shadcn/ui primitives |
| i18n | next-intl (`messages/en.json`, `messages/th.json`) |

---

## 3. Architecture

### Mandatory Layer Order

```
API Route (src/app/api/**)
  → Service (src/services/**)
    → Repository (src/repositories/**)
      → Prisma Client
```

### Rules — Non-Negotiable

- **Routes** handle HTTP only: parse input, check session, call a service, return a response.
- **Services** own all business logic: validation, authorization decisions, orchestration, transaction boundaries.
- **Repositories** contain all Prisma queries. They are dumb data accessors with no logic.
- **Never call Prisma directly from a route.** No exceptions.
- **Never put business logic in a repository.** Repositories return data; services decide what to do with it.
- Services may call other services. Repositories may not call services.
- Use `prisma.$transaction()` in services whenever multiple writes must be atomic.

---

## 4. Folder Structure

```
src/
  app/
    api/                  # All API routes — thin HTTP handlers only
    (dashboard)/          # Primary user/creator dashboard routes
    admin/                # Primary admin routes
  services/               # Business logic layer — one file per domain
  repositories/           # Prisma query layer — one file per model/domain
  components/             # React UI components
    ui/                   # Low-level primitives (Button, Input, Badge, etc.)
    admin/                # Admin-specific components
    creator/              # Creator dashboard components
    marketplace/          # Browse/discovery components
    resource/             # Resource detail page components
    layout/               # Navbar, footer, shells, sidebars
  design-system/          # Canonical design tokens and primitive components
  lib/                    # Shared utilities (auth, storage, cache, rate-limit, platform config)
  config/                 # Static config (nav items, etc.)
  i18n/                   # next-intl routing and request config
prisma/
  schema.prisma           # Source of truth for the data model
  migrations/             # Never edit manually
messages/                 # i18n translation files
```

### Legacy Locale Handling

Legacy locale-prefixed URLs are handled at the proxy layer and redirected to flat routes. Do not reintroduce `[locale]` route trees unless the project is explicitly moving back to full locale-prefixed routing.

---

## 5. Authentication & Authorization

### Roles

```
ADMIN       — Full platform access, admin panel
INSTRUCTOR  — Creator tools, own resource management
STUDENT     — Purchases, downloads, dashboard
```

### Middleware (`middleware.ts`)

- Protects `/dashboard/*` and `/admin/*` — unauthenticated requests are redirected to login.
- `/admin/*` additionally requires `role === ADMIN`; non-admin authenticated users get a 403.
- Handles `/th/*` → `/*` redirects for legacy URL compatibility.

### Access Control Expectations

- Session must be verified server-side in every route and service that accesses user data.
- Ownership must be checked before any mutation (e.g., a creator editing their own resource, not another's).
- Role checks in routes are a first gate only — services must re-enforce authorization on the data being acted upon.
- Admin routes are never accessible to non-admins, even via direct API calls.

---

## 6. Payments — Critical Rules

### Architecture: Webhook-First

- **Payment access is granted only after a verified webhook event from Stripe or Xendit.**
- Never grant access based on a client-side redirect (e.g., `?success=true`). Redirects are for UX only.
- All purchase state changes happen inside `prisma.$transaction()` to prevent partial writes.
- Implement idempotency: check whether a webhook event has already been processed before acting on it (use event ID).
- Stripe webhook handler: `src/app/api/stripe/webhook/`
- Xendit webhook handler: `src/app/api/xendit/webhook/`

### Rules

1. Never trust `session_id` or query params from Stripe redirect URLs to confirm a purchase.
2. Always verify the webhook signature before processing any event.
3. The purchase record must be created or updated only inside a transaction.
4. A `Purchase` with `status: COMPLETED` is the only gate for download access.
5. Subscription status changes (active → cancelled → past_due) must be handled in webhooks, not inferred.

---

## 7. File Storage & Security

### Storage: Cloudflare R2

- All uploaded files are stored in a **private R2 bucket**.
- Files are never served directly from R2 public URLs.
- Pre-signed URLs are only generated inside authenticated, ownership-verified API routes.

### Download Flow

1. User requests download via `/api/download?resourceId=...`
2. Route verifies session.
3. Service checks: does this user own a completed purchase (or active subscription) for this resource?
4. If yes: generate a short-lived pre-signed R2 URL and redirect.
5. If no: return 403.

### Rules

- **Never expose R2 file keys or bucket structure to the client.**
- Never trust a client-provided file path — always look up the file key from the database using a verified resource ID.
- The `/api/download` route is the only legitimate path to file access.
- Pre-signed URLs must have a short expiry (≤ 60 seconds).

---

## 8. Critical Engineering Rules

These rules are non-negotiable. Violating them risks data leaks, payment fraud, or broken production systems.

1. **Never expose private files.** No public URLs, no direct R2 links, no client-side file keys.
2. **Always verify ownership** before any resource mutation or file access.
3. **Never bypass the service layer.** Routes do not call Prisma. Ever.
4. **Never grant payment access from client redirects.** Webhooks only.
5. **Use transactions** for any write that involves purchase state, subscription state, or financial data.
6. **Do not break API contracts.** Changing a route's response shape or removing a field is a breaking change. Treat it as such.
7. **Do not reintroduce locale-prefixed duplicate route trees** unless the project explicitly restores full locale-prefixed routing.
8. **`ResourceCard` is a single shared component with variants.** Do not create alternative resource card components.
9. **Validate all external input at the route boundary** using Zod before it reaches a service.
10. **Admin access requires `role === ADMIN` verified server-side**, not just a middleware redirect.

---

## 9. Developer Workflow — Required Process

**Claude must follow this process for every non-trivial task. No exceptions.**

### Step 1 — Audit
Read all relevant files before writing a single line of code. Understand the current implementation fully.

### Step 2 — Explain Current State
Summarize what the current code does, how it works, and what systems it touches.

### Step 3 — Identify Problems
List specific issues, gaps, or risks in the current implementation that are relevant to the task.

### Step 4 — Propose a Plan
Write a concrete, numbered implementation plan. Include:
- Which files will be created or modified
- What each change accomplishes
- Any risks or tradeoffs

### Step 5 — Wait for Approval
**Do not write implementation code until the user approves the plan.** If the plan is wrong, it is far cheaper to correct at this stage.

### Step 6 — Implement Incrementally
Execute the approved plan step by step. Do not deviate. If new information changes the plan, stop and re-propose.

---

## 10. Code Style & Conventions

- **TypeScript strict mode** — no `any`, no type assertions unless unavoidable and commented.
- Functions should be small and do one thing. If a function needs a comment to explain what it does, it should be split.
- Prefer named exports. Avoid default exports except for Next.js page/layout components (required by the framework).
- Use `zod` for all runtime input validation at route boundaries.
- Use `clsx` + `tailwind-merge` (via a `cn()` utility) for conditional class composition.
- Repository functions are named after what they return or do: `findResourceById`, `createPurchase`, `listPublishedResources`.
- Service functions are named after the business action: `purchaseResource`, `approveCreatorApplication`, `getCreatorDashboardStats`.
- Avoid deeply nested conditionals — use early returns.

---

## 11. UI System Rules

- **Design tokens** are defined in `tailwind.config.ts` as CSS variable references. Use semantic tokens (`text-primary`, `bg-surface`, `border-default`), not raw hex values.
- **`ResourceCard`** is the single canonical card component for displaying resources. It accepts a `variant` prop (`marketplace` | `library` | `preview`). Never create an alternative.
- All new primitive UI components (Button, Input, Select, etc.) go in `src/design-system/primitives/`. Do not create one-off styled elements inline in feature components.
- Layouts (Container, Section) come from `src/design-system/layout/`.
- Do not add new icon libraries. Use `lucide-react` exclusively.
- Responsive design is mobile-first. All new UI must work at mobile widths.

---

## 12. Required Response Format

For any task beyond a trivial one-line fix, Claude's response must follow this structure:

```
## Audit Summary
[What I read and what the current state is]

## Problems Found
[Numbered list of specific issues or gaps]

## Proposed Plan
[Numbered list of concrete changes, with file names]

---
Waiting for approval before implementing.
```

After approval:

```
## Implementation

### Step N — [description]
[code changes for this step only]
```

**Claude must never output implementation code in the same response as the plan.** Plan first, implement after explicit approval.

---

## 13. Commands

```bash
# Development
npm run dev           # Start dev server (webpack)
npm run dev:turbo     # Start dev server (turbopack — faster, experimental)

# Production
npm run build         # Build app only; must stay schema-mutation-free
npm run start

# Linting
npm run lint

# Database
npm run db:migrate    # Create and apply a new migration (prisma migrate dev)
npm run db:deploy     # Apply committed migrations separately from app build; use DIRECT_URL
npm run db:push       # Push schema changes without a migration file
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed the database
npm run db:studio     # Open Prisma Studio

# Stripe (local webhook forwarding)
npm run stripe        # Forward Stripe webhooks to localhost:3000/api/stripe/webhook

# Scripts
npm run analytics:reconcile-download-counts
```

Production note:
- Never couple `prisma migrate deploy` to `npm run build` in this repo.
- Vercel build must not mutate schema.
- Run migrations as a separate operational step and use `DIRECT_URL` for migration commands.

There are no automated tests in this project.
