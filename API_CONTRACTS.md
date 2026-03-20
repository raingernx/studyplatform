# KruCraft – API Contracts

This document defines the public API contracts of the KruCraft backend.

AI agents and developers must not change these contracts unless explicitly instructed.

Breaking these contracts may break the frontend or external integrations.

---

# General API Rules

All API routes are located in:

src/app/api

Rules:

- API routes must remain thin controllers
- Business logic belongs in services
- Database access belongs in repositories
- API response formats must remain stable

Do not:

- change response field names
- change status codes
- change route paths
- remove response fields

---

# Authentication API

Route

/api/auth/*

Handled by NextAuth.

Contract:

- Session contains:

user.id
user.role
user.subscriptionStatus

These fields must remain available to the frontend.

---

# Resources API

Route

/api/resources

Purpose

Fetch marketplace resources.

Typical response:

{
resources: Resource[],
pagination: {
page: number,
totalPages: number
}
}

Rules

- Must support pagination
- Must not expose private file URLs

---

# Checkout API

Route

/api/checkout

Purpose

Create Stripe checkout sessions.

Response example

{
checkoutUrl: string
}

Rules

- Must return a valid Stripe checkout URL
- Must validate authenticated user
- Must verify resource existence

---

# Subscription API

Route

/api/subscriptions

Purpose

Manage user subscriptions.

Example response

{
status: string,
currentPeriodEnd: number
}

Rules

- Must reflect Stripe subscription state
- Must not expose Stripe secrets

---

# Download API

Route

/api/download/[resourceId]

Purpose

Provide secure downloads.

Flow

user request
↓
authentication check
↓
ownership verification
↓
file delivery

Possible responses

Success

- redirect to signed file URL
- stream file response

Errors

401 Unauthorized
403 Forbidden
404 Resource not found

Rules

- Only purchased resources can be downloaded
- Subscribed users may access subscription resources
- File URLs must not be publicly exposed

---

# Webhook APIs

Routes

/api/stripe/webhook

Purpose

Process Stripe webhook events.

Rules

- Must verify Stripe signature
- Must process events idempotently
- Must update purchases or subscriptions

Response rules

200 OK

must be returned when webhook is processed successfully.

---

# Error Response Guidelines

Errors should use consistent JSON responses.

Example

{
error: “Unauthorized”
}

Status codes

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error

---

# Versioning Policy

API routes currently follow a single version.

Future versions may introduce:

/api/v2/*

Until then, all existing routes must remain backward compatible.

---

# Refactoring Rules for AI Agents

AI tools must follow these rules:

1. Do not change route paths.
2. Do not change response structures.
3. Do not remove response fields.
4. Do not change authentication behavior.
5. Maintain backward compatibility.


⸻
