# Knowledge Layer Operations

## Summary

Krukraft maintains a repo-owned LLM wiki under `knowledge/` with explicit scripts for ingesting source notes, regenerating the index, and flagging stale topic pages.

## Current Truth

- `knowledge/raw/` stores evidence and source captures.
- `knowledge/wiki/` stores synthesized topic pages.
- `knowledge/schema/` stores the maintenance rules.
- `npm run wiki:ingest`, `npm run wiki:index`, `npm run wiki:lint`, and `npm run wiki:stale` are the operational commands for the layer.
- The first raw evidence notes now cover browser smoke, skeleton policy, auth/viewer routing, browser verification split, and the decision to keep the knowledge layer repo-owned.

## Why It Matters

Without an explicit maintenance workflow, the repo-owned wiki would drift into disconnected notes. The scripts make the layer auditable and repeatable.

## Key Files

- `knowledge/index.md`
- `knowledge/log.md`
- `knowledge/schema/*`
- `scripts/wiki-ingest.mjs`
- `scripts/generate-knowledge-index.mjs`
- `scripts/check-knowledge-wiki.mjs`
- `scripts/check-knowledge-stale.mjs`

## Flows

- ingest a source note into `knowledge/raw/`
- optionally seed a wiki page from the ingest command
- regenerate `knowledge/index.md`
- lint structure and stale-review dates before trusting the wiki

## Invariants

- `knowledge/wiki/` stays subordinate to code, `AGENTS.md`, `krukraft-ai-contexts/`, `design-system.md`, and `figma-component-map.md`.
- `knowledge/index.md` should be generated from the actual wiki tree, not curated by hand.
- wiki pages must keep sources and `Last Reviewed` current.

## Known Risks

- `wiki:stale` is date-based and cannot prove semantic correctness.
- ingest can seed a stub page too early if the source does not deserve a durable wiki topic.

## Related Pages

- [Browser Verification](../testing/browser-verification.md)
- [CI Browser Smoke](./ci-browser-smoke.md)
- [Repo-Owned Knowledge Layer](../decisions/repo-owned-knowledge-layer.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`knowledge/schema/ingest-rules.md`](../../schema/ingest-rules.md)
- [Repo-Owned Knowledge Layer Decision](../../raw/decisions/repo-owned-knowledge-layer-decision.md)
- [`package.json`](../../../package.json)

## Last Reviewed

- 2026-04-06
