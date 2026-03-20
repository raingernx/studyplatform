# KruCraft – Payments Architecture

This document describes the payment system of KruCraft.

Payments are handled through Stripe and optionally Xendit.

---

# Payment Goals

The system must guarantee:

- payment idempotency
- secure purchase creation
- webhook-based confirmation
- database consistency

---

# Payment Flow

Resource purchase flow:

User selects resource
↓
POST /api/checkout
↓
payment service creates Stripe checkout session
↓
Stripe payment page
↓
User completes payment
↓
Stripe webhook fires
↓
Purchase marked as completed
↓
Resource unlocked

---

# Checkout System

Routes

/api/checkout
/api/checkout/xendit
/api/stripe/checkout

Responsibilities:

- validate authenticated user
- validate resource
- prevent duplicate purchases
- create payment session

Checkout services:

stripe-payment.service.ts
xendit-payment.service.ts

Repositories used:

purchase.repository.ts
user.repository.ts
resource.repository.ts

---

# Purchase Lifecycle

States:

pending
completed
failed

Flow:

checkout start
↓
purchase record created (pending)
↓
payment completed
↓
webhook updates purchase → completed

---

# Idempotency Strategy

Webhooks may fire multiple times.

Rules:

- purchases must be idempotent
- webhook handlers must check existing state

Implementation:

purchase.repository:

completePurchaseIfPending()

---

# Webhook System

Routes

/api/stripe/webhook
/api/xendit/webhook

Webhook responsibilities:

- validate signature
- parse event
- process payment completion
- update purchase
- update subscription

Services:

stripe-webhook.service.ts
xendit-webhook.service.ts

---

# Metadata Strategy

Checkout sessions include metadata.

Example:

userId
resourceId
purchaseId

Metadata ensures webhook handlers can match the correct purchase.

---

# Payment Security

Rules:

- verify Stripe signature
- validate Xendit callback token
- reject unknown events

Never trust client payment confirmations.

Only webhooks finalize purchases.

---

# Subscription Payments

Subscriptions follow a similar pattern.

Flow:

user subscribes
↓
Stripe subscription created
↓
Stripe webhook fires
↓
subscription status updated

Stored fields:

stripeCustomerId
stripeSubscriptionId

---

# Future Payment Enhancements

Planned improvements:

- multi-currency payments
- creator payouts
- marketplace revenue sharing
- refund management