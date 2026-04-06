# Payments System

## Summary

Krukraft supports Stripe and Xendit flows that unlock purchased resources after verified payment handling.

## Current Truth

- Checkout and success flows exist on public resource paths.
- Purchase state is confirmed through provider-backed flows rather than trusting redirect pages alone.
- Purchase completion leads to library access and secure download eligibility.

## Why It Matters

Payments are the bridge between the public marketplace and paid library access.

## Key Files

- `src/app/api/checkout/*`
- `src/app/checkout/success/page.tsx`
- `src/app/checkout/cancel/page.tsx`
- `src/services/payment*`
- `src/services/download*`

## Flows

- user opens resource detail
- checkout session/provider flow starts
- provider confirms payment
- purchase record is stored or reconciled
- resource becomes available in dashboard/library

## Invariants

- Redirect pages alone are not authoritative proof of ownership.
- Download access must remain protected behind ownership checks.
- Payment provider config must stay environment-specific.

## Known Risks

- Mismatched webhook or provider config can break unlock flows silently.
- Storage/download checks can drift from purchase checks if maintained separately.

## Related Pages

- [Purchase To Library](../flows/purchase-to-library.md)
- [Storage And Downloads](storage-downloads.md)
- [Resource Detail](../routes/resource-detail.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`krukraft-ai-contexts/05-features.md`](../../../krukraft-ai-contexts/05-features.md)

## Last Reviewed

- 2026-04-06
