# Repo-Owned Knowledge Layer

## Summary

Krukraft keeps a lightweight repo-owned knowledge layer under `knowledge/` instead of treating chat history or an external-only retrieval stack as the primary AI memory surface.

## Current Truth

- `knowledge/raw/` is the evidence layer for captured notes and source snapshots.
- `knowledge/wiki/` is the synthesized layer for durable topic pages.
- `knowledge/schema/` plus repo scripts enforce ingest, index regeneration, stale checks, and structural linting.
- Canonical truth still remains subordinate to code, `AGENTS.md`, `krukraft-ai-contexts/`, `design-system.md`, and `figma-component-map.md`.

## Why It Matters

This keeps accumulated repo knowledge versioned, inspectable, and portable. It also avoids hiding important project understanding inside transient chat transcripts or opaque external memory stores.

## Key Files

- `knowledge/index.md`
- `knowledge/log.md`
- `knowledge/raw/`
- `knowledge/wiki/`
- `knowledge/schema/`
- `scripts/wiki-ingest.mjs`
- `scripts/generate-knowledge-index.mjs`
- `scripts/check-knowledge-wiki.mjs`
- `scripts/check-knowledge-stale.mjs`

## Flows

- capture durable source material into `knowledge/raw/`
- synthesize or refresh topic pages in `knowledge/wiki/`
- rebuild `knowledge/index.md`
- lint and stale-check the layer before relying on it as agent context

## Invariants

- The repo-owned wiki is a synthesis layer, not a replacement for canonical source files.
- New facts should not be promoted into wiki pages without traceable sources.
- `knowledge/index.md` should be generated from the actual wiki tree instead of edited as an unsynced manual registry.

## Known Risks

- A clean structural lint pass does not prove semantic correctness.
- Wiki pages can still drift if review cadence slips, which is why `wiki:stale` exists.
- The repo can still duplicate knowledge if raw captures and canonical docs are copied blindly instead of linked carefully.

## Related Pages

- [Knowledge Layer Operations](../operations/knowledge-layer.md)
- [Browser Verification](../testing/browser-verification.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)

## Sources

- [Repo-Owned Knowledge Layer Decision](../../raw/decisions/repo-owned-knowledge-layer-decision.md)
- [Canonical source](../../../AGENTS.md)
- [`knowledge/schema/source-priority.md`](../../schema/source-priority.md)

## Last Reviewed

- 2026-04-06
