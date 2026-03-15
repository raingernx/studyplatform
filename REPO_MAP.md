# PaperDock – Repository Map

This file helps developers and AI coding agents quickly understand the structure of the repository.

The project follows a layered architecture:

routes → services → repositories → Prisma → database

---

# Root Structure

Main source directory:

src

Key folders:

src/app
src/services
src/repositories
src/analytics
src/workers
src/lib

---

# App Router (Frontend + API)

Location

src/app

Contains all Next.js App Router pages and API routes.

---

## Public Pages

src/app/library
src/app/resources/[id]

Responsibilities:

- marketplace browsing
- resource detail pages

---

## Authentication Pages

src/app/(auth)

Pages:

login
register

---

## User Dashboard

src/app/(dashboard)

Pages:

dashboard
resources
purchases
subscription
settings

Responsibilities:

- user content access
- subscription management
- account settings

---

## Admin Panel

src/app/admin

Pages:

admin
admin/resources
admin/users
admin/analytics

Responsibilities:

- resource management
- user management
- platform analytics

---

# API Routes

Location

src/app/api

API groups:

auth
resources
checkout
subscriptions
download

Rules:

- API routes must remain thin controllers
- no Prisma calls directly in routes
- routes call services

---

# Services Layer

Location

src/services

Responsibilities:

- business logic
- orchestration
- validation

Examples:

resource.service.ts
purchase.service.ts
subscription.service.ts
payment.service.ts
download.service.ts

Services call repositories.

---

# Repositories Layer

Location

src/repositories

Responsibilities:

- database queries
- Prisma access
- persistence logic

Examples:

resource.repository.ts
purchase.repository.ts
user.repository.ts
subscription.repository.ts

Repositories are the only layer that interacts with Prisma.

---

# Analytics System

Location

src/analytics

Responsibilities:

- analytics event recording
- resource statistics
- creator analytics
- trending calculations

Examples:

event.service.ts
aggregation.service.ts

---

# Workers

Location

src/workers

Responsibilities:

- analytics aggregation
- trending score updates
- background jobs

Examples:

analytics.worker.ts
trending.worker.ts

---

# Shared Utilities

Location

src/lib

Responsibilities:

- helper functions
- integrations
- shared utilities

Examples:

stripe.ts
auth.ts
cache.ts

---

# Database Layer

Database access is handled through Prisma.

Location:

prisma/schema.prisma

Core models:

User
Resource
Purchase
Subscription
Download

Analytics tables:

analytics_events
resource_stats
creator_stats

---

# Key System Flows

## Purchase Flow

resource page
↓
checkout API
↓
Stripe payment
↓
Stripe webhook
↓
purchase stored
↓
resource unlocked

---

## Download Flow

user requests download
↓
download API
↓
ownership verified
↓
file served or redirected

---

# Important Rules

AI agents and developers must follow these rules:

- Do not move API routes.
- Keep routes thin.
- Place business logic in services.
- Place database queries in repositories.
- Avoid breaking API response formats.
- Prefer incremental refactors.
