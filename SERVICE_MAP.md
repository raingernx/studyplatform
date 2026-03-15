# PaperDock – Service Map

This document maps the service layer of the PaperDock backend.

Purpose:

- Help developers and AI agents understand where business logic lives
- Prevent logic duplication
- Define service responsibilities

Architecture:

routes → services → repositories → Prisma → database

API routes must never call Prisma directly.

---

# Core Services

Location

src/services

Services contain business logic and orchestration.

---

# Resource Services

Location

src/services/resources

Responsible for marketplace resource logic.

Examples:

resource.service.ts

Responsibilities:

- resource listing
- resource detail retrieval
- admin resource creation
- admin resource updates
- slug generation
- category and tag validation

Uses repositories:

resource.repository.ts

---

# Purchase Services

Location

src/services/purchases

Handles resource ownership and purchase logic.

Examples:

purchase.service.ts
download.service.ts

Responsibilities:

- purchase validation
- ownership verification
- download authorization
- purchase analytics logging

Uses repositories:

purchase.repository.ts
resource.repository.ts

---

# Payment Services

Location

src/services/payments

Responsible for payment orchestration.

Examples:

payment.service.ts
stripe-payment.service.ts
xendit-payment.service.ts
stripe-webhook.service.ts
xendit-webhook.service.ts

Responsibilities:

- create checkout sessions
- payment metadata generation
- purchase initialization
- webhook processing
- idempotent payment completion

Uses repositories:

purchase.repository.ts
user.repository.ts
resource.repository.ts

---

# Subscription Services

Location

src/services/subscriptions

Handles subscription lifecycle.

Examples:

subscription.service.ts

Responsibilities:

- subscription state retrieval
- subscription cancellation
- subscription validation
- webhook subscription updates

Uses repositories:

subscription.repository.ts
user.repository.ts

---

# Analytics Services

Location

src/services/analytics

Handles marketplace analytics.

Examples:

analytics.service.ts
trending.service.ts
event.service.ts

Responsibilities:

- record analytics events
- aggregate resource statistics
- calculate trending scores
- generate dashboard metrics

Uses repositories:

analytics.repository.ts

---

# Discover Services

Location

src/services/discover

Responsible for marketplace discovery data.

Examples:

discover.service.ts

Responsibilities:

- trending resources
- newest resources
- recommended resources
- featured resources

Uses:

analytics services
resource repository

---

# Service Design Rules

Services must:

- contain business logic
- orchestrate repositories
- enforce validation rules

Services must NOT:

- access Prisma directly
- perform HTTP logic
- access request objects

Services return plain objects that API routes convert into responses.

---

# Service Dependency Graph

resources.service
↓
resource.repository

purchase.service
↓
purchase.repository

download.service
↓
purchase.repository
↓
resource.repository

payment.service
↓
purchase.repository
↓
user.repository
↓
resource.repository

analytics.service
↓
analytics.repository

discover.service
↓
analytics.repository
↓
resource.repository