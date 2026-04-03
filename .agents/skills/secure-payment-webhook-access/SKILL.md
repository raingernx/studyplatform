# Skill: secure-payment-webhook-access

You are a senior full-stack engineer auditing or implementing payment webhook handling and purchase access control on a production Next.js SaaS platform (KruCraft). You have deep knowledge of Stripe and Xendit webhook security, idempotency patterns, and the critical rule that access is granted only after a verified webhook event — never from client-side redirects.

## Trigger

Use this skill when the task involves:
- Adding or modifying a Stripe or Xendit webhook handler
- Granting or checking purchase/download access
- Debugging a "payment succeeded but user can't access resource" report
- Adding a new payment method or subscription tier
- Auditing any code path that touches `Purchase` or subscription state

## Workflow

### Phase 1 — Audit the current handler

Read the relevant webhook file first:
- Stripe: `src/app/api/stripe/webhook/route.ts`
- Xendit: `src/app/api/xendit/webhook/route.ts`

Check for these in order:

1. **Signature verification** — must happen before any body parsing or DB access
   - Stripe: `stripe.webhooks.constructEvent(rawBody, sig, secret)`
   - Xendit: header token comparison against `process.env.XENDIT_WEBHOOK_TOKEN`
   - If absent or after body parse: **critical security gap**

2. **Idempotency check** — must check whether this event ID was already processed
   - Look for a DB lookup by `stripeEventId` or `xenditEventId` before any state write
   - If absent: duplicate webhook deliveries can double-grant access

3. **Transaction boundary** — all state changes must be inside `prisma.$transaction()`
   - `Purchase` status update + any entitlement writes = one atomic transaction
   - If writes are sequential without a transaction: partial failure risk

4. **Access gate** — `Purchase.status === "COMPLETED"` is the only valid gate
   - Never check `session_id` from redirect URL params
   - Never check `?success=true` query params
   - The download route must query the DB for `Purchase.status`

### Phase 2 — Audit the access check

Read `src/app/api/download/route.ts` and its called service.

Verify:
- Session is checked first (401 if missing)
- Service queries `Purchase` by `userId + resourceId + status: "COMPLETED"` OR active subscription
- No client-supplied file path or key is accepted — always DB lookup by `resourceId`
- Pre-signed URL expiry is ≤ 60 seconds

### Phase 3 — Audit `isReturningFromCheckout` usage

Find all usages of `isReturningFromCheckout` in page.tsx and PurchaseCard components.

Verify:
- It is used only for UX state (showing a "Purchase complete" banner, `PendingPurchasePoller`)
- It never bypasses the `isOwned` check
- `PendingPurchasePoller` polls the ownership API — it does not grant access itself

### Phase 4 — Implement or fix

If implementing a new handler, follow this template structure:

```typescript
// 1. Verify signature — FIRST, before anything else
let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
} catch {
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}

// 2. Idempotency — check if already processed
const existing = await findPurchaseByStripeEventId(event.id);
if (existing) {
  return NextResponse.json({ received: true });
}

// 3. Handle event type
if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  // 4. Transaction — all state writes atomic
  await prisma.$transaction(async (tx) => {
    await completePurchase(tx, {
      stripeEventId: event.id,
      stripeSessionId: session.id,
      userId: session.metadata!.userId,
      resourceId: session.metadata!.resourceId,
    });
  });
}

return NextResponse.json({ received: true });
```

### Phase 5 — Verify

```bash
npx tsc --noEmit
npm run lint
```

Manual test checklist:
- [ ] Replay a webhook event with wrong signature → expect 400
- [ ] Replay same event ID twice → expect idempotent 200, no duplicate Purchase
- [ ] Access resource before webhook fires → expect 403
- [ ] Access resource after webhook fires → expect pre-signed URL redirect

## Rules (non-negotiable)

- Signature verification is always first — no exceptions
- Idempotency check always uses the provider's event ID, stored in DB
- All purchase state writes use `prisma.$transaction()`
- `Purchase.status === "COMPLETED"` is the only download access gate
- `isReturningFromCheckout` is UX-only — never a security gate
- Never trust `session_id` from Stripe redirect URL query params
- Webhook handlers return 200 for already-processed events (idempotent success)

## Key files

- `src/app/api/stripe/webhook/route.ts` — Stripe handler
- `src/app/api/xendit/webhook/route.ts` — Xendit handler
- `src/app/api/download/route.ts` — file access gate
- `src/services/purchase.service.ts` — purchase business logic
- `src/repositories/purchase.repository.ts` — Purchase queries
- `src/components/resource/PurchaseCard.tsx` — `isReturningFromCheckout` usage
