# Purchase To Library Flow

## Summary

The core paid-content flow is: discover resource, complete checkout, record purchase, then unlock dashboard-v2 library access.

## Current Truth

- The user’s library is the post-purchase destination for owned resources.
- Checkout success UI is not the final ownership authority by itself.
- Secure downloads depend on purchase/ownership state.

## Why It Matters

This is the main value path of the product and ties together marketplace, payments, dashboard, and storage systems.

## Key Files

- `src/app/resources/[slug]/page.tsx`
- `src/app/checkout/success/page.tsx`
- `src/app/(dashboard-v2)/dashboard-v2/library/page.tsx`
- payment and download services under `src/services/*`

## Flows

- browse marketplace
- open detail page
- start checkout or free-claim path
- payment/provider confirmation
- purchase becomes accessible in library
- download route verifies entitlement

## Invariants

- Ownership unlock must be provider-backed and durable.
- Library access and download access must agree.
- Dashboard-v2 library remains the truthful post-purchase surface.

## Known Risks

- Redirect-page success can be mistaken for real purchase success if verification is weak.
- Browser verification can miss payment-provider issues if it only checks UI surfaces.

## Related Pages

- [Payments](../systems/payments.md)
- [Storage And Downloads](../systems/storage-downloads.md)
- [Dashboard Library](../routes/dashboard-library.md)
- [Resource Detail](../routes/resource-detail.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`krukraft-ai-contexts/05-features.md`](../../../krukraft-ai-contexts/05-features.md)

## Last Reviewed

- 2026-04-13
