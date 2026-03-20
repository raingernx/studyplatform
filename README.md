# KruCraft — Session 1: Architecture Scaffold

Next.js 14 (App Router) · Tailwind CSS · PostgreSQL · Prisma · NextAuth · Stripe

---

## Folder Structure

```
studyplatform/
├── prisma/
│   ├── schema.prisma          ← Full data model (User, Resource, Purchase, Review, …)
│   └── seed.ts                ← Dev seed data
│
├── src/
│   ├── app/
│   │   ├── (auth)/            ← Login / Register pages (route group, no shared layout)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       ← Authenticated area (shared dashboard layout)
│   │   │   ├── dashboard/
│   │   │   └── resources/
│   │   │       └── [id]/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   ← NextAuth handler
│   │   │   │   └── register/route.ts        ← POST email+password signup
│   │   │   ├── resources/
│   │   │   │   ├── route.ts                 ← GET (list) + POST (create)
│   │   │   │   └── [id]/route.ts            ← GET + PATCH + DELETE
│   │   │   ├── purchases/route.ts           ← GET user's purchases
│   │   │   ├── subscriptions/route.ts       ← GET + DELETE (cancel)
│   │   │   └── stripe/
│   │   │       ├── checkout/route.ts        ← Create Stripe checkout session
│   │   │       └── webhook/route.ts         ← Stripe event handler
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── auth/              ← LoginForm, RegisterForm
│   │   ├── layout/            ← Navbar, Sidebar, Footer
│   │   ├── resources/         ← ResourceCard, ResourceGrid, ResourceDetail
│   │   └── ui/                ← Button, Badge, Input, Modal (design system atoms)
│   │
│   ├── hooks/                 ← useSession, useResources, usePurchases (SWR/React Query)
│   ├── lib/
│   │   ├── auth.ts            ← NextAuth config + callbacks
│   │   ├── prisma.ts          ← Singleton Prisma client
│   │   ├── stripe.ts          ← Stripe client + plan constants
│   │   └── utils.ts           ← cn(), formatPrice(), slugify()
│   └── types/
│       └── index.ts           ← Shared TypeScript types
│
├── .env.example               ← Environment variable template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL, NEXTAUTH_SECRET, Stripe keys

# 3. Set up the database
npm run db:push       # push schema to your local PostgreSQL
npm run db:seed       # create admin user, categories, tags, sample resource

# 4. Run the dev server
npm run dev
# → http://localhost:3000
# Uses Webpack by default for local development
# Optional Turbopack fallback: npm run dev:turbo

# 5. Stripe webhooks (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Data Model Summary

| Model            | Purpose                                                         |
|------------------|-----------------------------------------------------------------|
| `User`           | Auth + roles (ADMIN / INSTRUCTOR / STUDENT) + Stripe fields     |
| `Account`        | NextAuth OAuth accounts (Google, etc.)                          |
| `Session`        | NextAuth JWT sessions                                           |
| `Resource`       | PDF/document entries with pricing, file URL, and metadata       |
| `Category`       | Taxonomy for resources                                          |
| `Tag`            | Many-to-many tags on resources                                  |
| `Purchase`       | One-time purchase records linked to Stripe checkout sessions    |
| `Review`         | User ratings (1–5) + optional body text                         |

---

## API Routes

### Auth
| Method | Route                         | Auth  | Description                         |
|--------|-------------------------------|-------|-------------------------------------|
| POST   | `/api/auth/register`          | —     | Email + password sign-up            |
| GET    | `/api/auth/[...nextauth]`     | —     | NextAuth session handler            |
| POST   | `/api/auth/[...nextauth]`     | —     | NextAuth sign-in / sign-out         |

### Resources
| Method | Route                  | Auth        | Description                             |
|--------|------------------------|-------------|-----------------------------------------|
| GET    | `/api/resources`       | —           | List published resources (filter/page)  |
| POST   | `/api/resources`       | ADMIN/INSTR | Create a new resource                   |
| GET    | `/api/resources/[id]`  | —           | Get a single resource + reviews         |
| PATCH  | `/api/resources/[id]`  | Owner/ADMIN | Update resource fields                  |
| DELETE | `/api/resources/[id]`  | ADMIN       | Delete a resource                       |

### Payments
| Method | Route                       | Auth     | Description                                    |
|--------|-----------------------------|----------|------------------------------------------------|
| POST   | `/api/stripe/checkout`      | Required | Create checkout session (payment or sub)       |
| POST   | `/api/stripe/webhook`       | Stripe   | Handle payment/subscription lifecycle events   |
| GET    | `/api/purchases`            | Required | List the current user's completed purchases    |
| GET    | `/api/subscriptions`        | Required | Get subscription status                        |
| DELETE | `/api/subscriptions`        | Required | Cancel subscription at period end              |

---

## Access Control

- **Public**: browse the resource library, view resource detail pages
- **STUDENT**: purchase resources, manage subscription, download purchased files
- **INSTRUCTOR**: all of STUDENT + create/edit their own resources
- **ADMIN**: full access including delete and user management

Roles are stored in the database and propagated into the JWT via NextAuth callbacks so they're available on every server-side request without a DB round-trip.

---

## Stripe Integration

Two modes are supported in `/api/stripe/checkout`:

**One-time purchase** (`mode: "payment"`) — creates a Stripe Checkout session for a specific resource. On success, the `checkout.session.completed` webhook marks the `Purchase` row as `COMPLETED`.

**Subscription** (`mode: "subscription"`) — creates a Checkout session for a plan. The webhook handles `customer.subscription.updated` / `deleted` to keep `User.subscriptionStatus` in sync.

---

## Next Steps (Session 2+)

- [ ] Build out page components: `ResourceCard`, `ResourceGrid`, auth forms
- [ ] Implement file upload (S3 + presigned URLs) in resource creation flow
- [ ] Add a download-gate: check `Purchase` or `subscriptionStatus` before serving `fileUrl`
- [ ] Admin dashboard (resource management, user list, revenue summary)
- [ ] Add `clsx` + `tailwind-merge` for component class utilities
- [ ] Email notifications (Resend or SendGrid) for purchase receipts
