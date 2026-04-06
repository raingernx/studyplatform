# Storage And Downloads

## Summary

Krukraft uses protected download routes for paid/private files and currently allows local or fallback storage behavior in local and CI environments.

## Current Truth

- Paid/private delivery is protected behind ownership checks.
- Public preview images and private downloads follow different delivery paths.
- CI browser smoke currently uses local storage fallback rather than real R2 integration.

## Why It Matters

Storage touches purchase fulfillment, preview rendering, and secure download access.

## Key Files

- `src/app/api/download/[resourceId]/*`
- `src/services/download*`
- storage provider selection files under `src/services` and related infra config

## Flows

- user owns purchased resource
- protected download route verifies entitlement
- file access is granted through guarded delivery

## Invariants

- Private files must not be exposed without ownership checks.
- CI fallback storage warnings are expected unless CI is intentionally wired to real R2.
- Production storage and local fallback behavior should stay clearly separated.

## Known Risks

- Storage fidelity in CI is lower than production when R2 is not configured.
- Preview-image behavior and private file behavior can drift if tested separately.

## Related Pages

- [Payments](payments.md)
- [Purchase To Library](../flows/purchase-to-library.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`krukraft-ai-contexts/03-tech-stack.md`](../../../krukraft-ai-contexts/03-tech-stack.md)
- [`krukraft-ai-contexts/05-features.md`](../../../krukraft-ai-contexts/05-features.md)

## Last Reviewed

- 2026-04-06
