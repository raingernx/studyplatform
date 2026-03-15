# DATABASE.md

This document describes the database architecture for PaperDock.

Database: PostgreSQL  
ORM: Prisma

All database access must go through Prisma.

---

# Core Entities

The system is built around the following core models.

Users  
Resources  
Purchases  
Subscriptions  
Downloads

---

# Data Access Layer

Database queries must follow the repository pattern.

Architecture:
services → repositories → Prisma → database

Rules:

- Prisma queries must live in `src/repositories`
- Services call repositories
- API routes must not call Prisma directly

# User

Represents a platform user.

Key fields:

```

id
email
name
role
subscriptionStatus
createdAt

```

Roles:

```

USER
ADMIN

```

Relationships:

User
→ Purchases
→ Subscriptions
→ Downloads

---

# Resource

Represents a digital study resource available in the marketplace.

Key fields:

```

id
title
description
price
fileUrl
createdAt

```

Relationships:

Resource
→ Purchases
→ Downloads

---

# Purchase

Represents a purchase of a resource by a user.

Purchase links a user to a resource.

Key fields:

```

id
userId
resourceId
stripePaymentIntentId
createdAt

```

Relationships:

Purchase
→ User
→ Resource

---

# Subscription

Represents a recurring subscription for premium access.

Key fields:

```

id
userId
stripeCustomerId
stripeSubscriptionId
status
currentPeriodEnd

```

Relationships:

Subscription
→ User

---

# Download

Tracks file downloads for analytics and security.

Key fields:

```

id
userId
resourceId
downloadedAt

```

Relationships:

Download
→ User
→ Resource

---

# Relationships Overview

```

User
├── Purchases
├── Subscriptions
└── Downloads

Resource
├── Purchases
└── Downloads

```

Purchases represent ownership of a resource.

Users must have a valid purchase or subscription before downloading content.

---

# Access Control

Download access requires:

Valid session  
AND

```

purchase exists

```

or

```

active subscription

```

---

# Stripe Integration

Stripe manages:

Payments  
Subscriptions

Stripe data stored in database includes:

```

stripeCustomerId
stripeSubscriptionId
stripePaymentIntentId

```

Stripe webhooks update database records.

---

# Database Indexing

Important indexes should exist for frequently queried fields.

Recommended indexes:

Users

- email

Resources

- createdAt
- price

Purchases

- userId
- resourceId
- stripePaymentIntentId

Downloads

- resourceId
- userId

Analytics

- resourceId
- creatorId

---

# Query Guidelines

When using Prisma:

Avoid N+1 queries.

Use relations and include statements.

Paginate list endpoints.

Example:

```

prisma.resource.findMany({
include: {
purchases: true
}
})

```

# Analytics Tables

The system supports marketplace analytics through aggregated tables.

---

## analytics_events

Stores raw analytics events.

Fields
id
eventType
userId
resourceId
creatorId
metadata
createdAt
Example events
resource_view
resource_download
resource_purchase

---

## resource_stats

Stores aggregated statistics for resources.

Fields
resourceId
views
downloads
purchases
revenue
trendingScore
updatedAt
Used for:

- trending resources
- popular resources
- marketplace analytics

---

## creator_stats

Stores creator analytics.

Fields
creatorId
totalDownloads
totalSales
totalRevenue
updatedAt
Used for creator dashboards.

---

# Future Database Features

Planned expansions include:

Resource analytics  
Creator revenue tracking  
Marketplace contributors  
Download analytics  
Trending resources algorithm
