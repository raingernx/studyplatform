# StudyPlatform – System Architecture

## Overview

StudyPlatform is a SaaS web application that provides a marketplace for downloadable learning resources and subscription-based access to study materials.

The platform allows users to:

- Browse a public resource library
- Purchase digital resources
- Access purchased content through a dashboard
- Subscribe to memberships
- Download resources securely

The system also includes an admin panel for managing resources, users, and analytics.

---

# Tech Stack

## Framework
Next.js 14 (App Router)

## Frontend
- React
- TypeScript
- Tailwind CSS

## Backend
- Next.js API Routes

## Authentication
- NextAuth
- Google OAuth
- Credentials login
- JWT session strategy

## Database
- PostgreSQL

## ORM
- Prisma

## Payments
- Stripe

## Deployment
- Vercel (planned)

## Storage (future)
- Cloudflare R2 or Amazon S3

---

# High-Level Architecture

The application follows a typical SaaS architecture:

Client (Browser)
↓
Next.js Frontend
↓
Next.js API Routes
↓
Business Logic Layer
↓
Prisma ORM
↓
PostgreSQL Database

External integrations include:

- Stripe (payments and subscriptions)
- OAuth providers (Google login)
- File storage (future: R2/S3)

---

# Project Structure

Main project structure:

```
src/app
```

Route groups are used to separate concerns.

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

# Core Application Modules

## 1. Public Marketplace

Users can browse resources without logging in.

Routes:

```
/library
/resources/[id]
```

Features:

- Resource discovery
- Resource detail pages
- Purchase options
- Marketing pages

---

## 2. Authentication System

Authentication is handled using **NextAuth**.

Providers:

- Google OAuth
- Email + password (credentials provider)

Session strategy:

JWT-based sessions.

Session payload contains:

```
user.id
user.role
user.subscriptionStatus
```

Roles supported:

```
USER
ADMIN
```

Middleware protects restricted routes.

---

## 3. User Dashboard

Logged-in users access their content through the dashboard.

Routes:

```
/dashboard
/dashboard/resources
/dashboard/purchases
/dashboard/subscription
/dashboard/settings
```

Dashboard features:

- View purchased resources
- Access downloads
- Manage subscriptions
- Account settings

---

## 4. Resource Marketplace

Resources are digital products that users can purchase.

Purchase flow:

```
User browses library
↓
User opens resource page
↓
User starts Stripe checkout
↓
Stripe webhook triggers
↓
Purchase record created
↓
Resource unlocked in dashboard
```

Purchase records are stored in the database and linked to users.

---

## 5. Admin Panel

The admin panel is used to manage the platform.

Routes:

```
/admin
/admin/resources
/admin/users
/admin/analytics
```

Admin capabilities:

- Upload resources
- Manage resource listings
- View users
- Track downloads
- Monitor sales
- Manage subscriptions

Access is restricted to users with:

```
role = ADMIN
```

Middleware enforces this rule.

---

# Database Architecture

Database: PostgreSQL  
ORM: Prisma

Key entities include:

Users
Resources
Purchases
Subscriptions
Downloads

Relationships:

User
→ Purchases
→ Subscriptions

Resource
→ Purchases
→ Downloads

Each purchase links:

```
User ↔ Resource
```

---

# API Architecture

Backend logic is implemented via **Next.js API routes**.

Main API groups:

```
/api/auth
/api/resources
/api/checkout
/api/subscriptions
/api/download
```

Responsibilities:

Auth API  
Handles authentication flows.

Resources API  
Fetch resource data and metadata.

Checkout API  
Creates Stripe checkout sessions.

Subscriptions API  
Manages subscription lifecycle.

Download API  
Handles secure file access.

---

# Security Architecture

Several mechanisms protect the platform.

## Route Protection

Middleware protects:

```
/dashboard/*
/admin/*
```

Admin access requires:

```
token.role === "ADMIN"
```

## Secure Downloads

Downloads are not exposed publicly.

Access requires:

- Valid session
- Purchase verification

Files will be served via a protected API route.

---

# Payment Architecture

Stripe handles payments and subscriptions.

Flow:

```
User clicks purchase
↓
Stripe checkout session created
↓
User completes payment
↓
Stripe webhook triggers
↓
Purchase stored in database
↓
Resource unlocked
```

Subscriptions follow a similar pattern using Stripe subscription APIs.

---

# Performance Considerations

Important scalability concerns:

- Avoid N+1 queries in Prisma
- Cache frequently requested resource lists
- Paginate library queries
- Use optimized database indexes

Future optimizations may include:

- Redis caching
- Edge caching via Vercel
- CDN for downloads

---

# Future System Components

Planned features include:

Resource analytics  
Track views, downloads, and revenue.

Creator marketplace  
Allow external contributors to upload resources.

File storage layer  
Move downloads to R2 or S3.

Search system  
Advanced search across library resources.

Recommendation system  
Trending and recommended resources.

---

# Development Guidelines

Key engineering rules for contributors and AI tools:

- Follow Next.js App Router conventions
- Prefer server components where possible
- Use Prisma for database access
- Keep API routes modular
- Do not modify authentication logic unless necessary
- Maintain role-based access control
- Avoid breaking existing routes

---

# Summary

StudyPlatform is a SaaS marketplace built with a modern TypeScript stack using Next.js, Prisma, and Stripe.

Core pillars of the system:

- Resource marketplace
- User dashboard
- Admin management
- Secure downloads
- Subscription system

The architecture prioritizes:

- modular design
- secure access control
- scalable database usage
- clean separation between public, user, and admin areas