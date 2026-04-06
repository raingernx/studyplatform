# Knowledge Layer Operations

## Summary

Krukraft maintains a repo-owned LLM wiki under `knowledge/` with explicit scripts for ingesting source notes, regenerating the index, and flagging stale topic pages.

## Current Truth

- `knowledge/raw/` stores evidence and source captures.
- `knowledge/wiki/` stores synthesized topic pages.
- `knowledge/schema/` stores the maintenance rules.
- `npm run wiki:ingest`, `npm run wiki:index`, `npm run wiki:lint`, `npm run wiki:stale`, and `npm run wiki:drift` are the operational commands for the layer.
- `wiki:lint` now includes both structural and semantic checks, and `wiki:coverage` reports raw-note citation coverage plus canonical-source coverage.
- `wiki:ingest` now suggests related wiki pages from title/source overlap and seeds backlinks when it creates a new wiki page.
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
- `scripts/check-knowledge-semantic.mjs`
- `scripts/check-knowledge-stale.mjs`
- `scripts/check-knowledge-drift.mjs`
- `scripts/report-knowledge-coverage.mjs`

## Flows

- ingest a source note into `knowledge/raw/`
- optionally seed a wiki page from the ingest command
- accept related-page suggestions driven by title/source overlap
- seed backlinks into suggested wiki pages when a new page is created
- regenerate `knowledge/index.md`
- lint structure and stale-review dates before trusting the wiki
- run semantic lint and coverage reporting to detect duplicate topics, uncited raw notes, or pages that rely only on low-priority sources
- run drift checks when implementation-linked files or raw evidence notes changed to verify that the corresponding wiki pages were reviewed in the same diff

## Invariants

- `knowledge/wiki/` stays subordinate to code, `AGENTS.md`, `krukraft-ai-contexts/`, `design-system.md`, and `figma-component-map.md`.
- `knowledge/index.md` should be generated from the actual wiki tree, not curated by hand.
- wiki pages must keep sources and `Last Reviewed` current.
- wiki pages should keep at least one canonical source in `## Sources`, even when they also cite raw evidence notes.
- when implementation-linked files or raw evidence notes in a page's `Key Files` / `Sources` change, the page should usually be updated or intentionally reviewed in the same change set.

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
