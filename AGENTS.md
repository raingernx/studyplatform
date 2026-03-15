# AGENTS.md

This file provides context for AI coding agents (Cursor, Codex, Claude, Aider, etc.) working with this repository.

The goal is to help AI understand the architecture, conventions, and development rules of this project.

---

# Project Overview

StudyPlatform is a SaaS web application that provides a marketplace for digital learning resources.

Users can:

- Browse a public library of resources
- Purchase downloadable study materials
- Access purchased resources through a dashboard
- Subscribe to memberships
- Download files securely

The system also includes an admin panel for managing resources and users.

---

# Tech Stack

Framework  
Next.js 14 (App Router)

Frontend
- React
- TypeScript
- Tailwind CSS

Backend
- Next.js API Routes

Authentication
- NextAuth
- Google OAuth
- Credentials provider
- JWT sessions

Database
- PostgreSQL

ORM
- Prisma

Payments
- Stripe

Deployment
- Vercel (planned)

Storage (future)
- Cloudflare R2 or S3

---

# Project Structure

Main source directory:

```

src/

```

Next.js App Router structure:

```

src/app

(auth)
login/page.tsx
register/page.tsx

(dashboard)
dashboard/page.tsx
resources/page.tsx
purchases/page.tsx
subscription/page.tsx
settings/page.tsx

admin
page.tsx

library
page.tsx

resources
[id]/page.tsx

api
auth/
checkout/
download/
resources/
subscriptions/

```

---

# Core Systems

## Authentication

Authentication uses NextAuth.

Providers:

- Google OAuth
- Credentials login

Session strategy:

JWT

Session fields include:

```

user.id
user.role
user.subscriptionStatus

```

Roles:

```

USER
ADMIN

```

---

# Middleware

Middleware protects restricted routes.

Protected routes:

```

/dashboard/*
/admin/*

```

Admin access requires:

```

token.role === "ADMIN"

```

---

# Resource Marketplace

Public routes:

```

/library
/resources/[id]

```

Users can browse resources and view details before purchasing.

Purchase flow:

```

User opens resource page
↓
User starts Stripe checkout
↓
Stripe checkout session created
↓
Stripe webhook fires
↓
Purchase stored in database
↓
Resource unlocked in dashboard

```

---

# Dashboard System

User dashboard routes:

```

/dashboard
/dashboard/resources
/dashboard/purchases
/dashboard/subscription
/dashboard/settings

```

Features:

- View purchased resources
- Download purchased files
- Manage subscription
- Update account settings

---

# Admin System

Admin routes:

```

/admin
/admin/resources
/admin/users
/admin/analytics

```

Admin features:

- Upload resources
- Manage resources
- View users
- Track downloads
- Monitor sales
- Manage subscriptions

Only users with role:

```

ADMIN

```

can access these routes.

---

# API Architecture

API routes exist under:

```

src/app/api

```

Primary groups:

```

auth
resources
checkout
subscriptions
download

```

Each API route should:

- validate authentication when required
- validate permissions
- use Prisma for database access

---

# Development Rules

AI agents must follow these guidelines when editing the repository.

Do not break existing routes.

Prefer server components where possible.

Use Prisma for database access.

Avoid modifying authentication logic unless required.

Maintain role-based access control.

Keep API routes modular.

Avoid creating unnecessary duplicate logic.

---

# Performance Guidelines

When writing database queries:

Avoid N+1 queries.

Use Prisma relations efficiently.

Paginate resource queries when returning lists.

Optimize expensive queries.

---

# File Storage

Downloads are currently handled through protected routes.

Future storage will move to:

Cloudflare R2 or Amazon S3.

Files must never be exposed publicly without authentication.

---

# AI Agent Behavior

When implementing features:

1. Read project structure before editing files.
2. Respect Next.js App Router conventions.
3. Use existing patterns for API routes.
4. Ensure database consistency via Prisma.
5. Maintain security for downloads and admin routes.

AI agents should avoid large architectural changes unless explicitly requested.
