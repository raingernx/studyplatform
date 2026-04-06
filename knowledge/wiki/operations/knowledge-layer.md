# Knowledge Layer Operations

## Summary

Krukraft maintains a repo-owned LLM wiki under `knowledge/` with explicit scripts for ingesting source notes, regenerating the index, and flagging stale topic pages.

## Current Truth

- `knowledge/raw/` stores evidence and source captures.
- `knowledge/wiki/` stores synthesized topic pages.
- `knowledge/schema/` stores the maintenance rules.
- `npm run wiki:ingest`, `npm run wiki:ingest:batch`, `npm run wiki:index`, `npm run wiki:lint`, `npm run wiki:stale`, and `npm run wiki:drift` are the operational commands for the layer.
- `npm run wiki:ingest:dry-run` and `npm run wiki:ingest:batch:dry-run` preview ingest targets, related-page suggestions, backlink plans, and batch merge summaries without writing files.
- dry-run preview commands now also support `--format json`, which emits the same merge plan as machine-readable JSON for agent orchestration or CI automation, including per-item/per-target `decision` hints with `actions`, `reasons`, `severity`, a top-level `decisionSummary`, and `confidence` / `policy` hints for apply-vs-review gating.
- `wiki:lint` now includes both structural and semantic checks, and `wiki:coverage` reports raw-note citation coverage plus canonical-source coverage.
- `wiki:ingest` now suggests related wiki pages from title/source overlap, can suggest links between new wiki pages inside the same batch, seeds backlinks when it creates a new wiki page, appends `knowledge/log.md`, and regenerates `knowledge/index.md` after successful writes.
- `wiki:ingest:batch` now supports explicit shared merge targets through `wikiTargets` + `wikiTargetId`, so several raw captures can merge into one existing or new wiki page in a single pre-validated write plan.
- `wiki:ingest:batch` also supports `skipRawCapture: true` for source-only merge items, so a batch can update a wiki page from canonical evidence without minting a low-value raw note for every source fragment.
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
- preview the ingest plan with `wiki:ingest:dry-run` when you want to inspect the write set first
- preview a multi-source merge plan with `wiki:ingest:batch:dry-run` when several raw captures and wiki stubs should land together
- switch dry-run to `--format json` when another workflow needs to consume the merge plan programmatically instead of reading CLI text
- use the JSON `decision` and `decisionSummary` hints when another agent or CI step needs to distinguish `create_raw`, `skip_raw_capture`, `update_existing_wiki`, `merge_multiple_sources`, or `seed_backlinks` behavior without reverse-engineering the plan
- use the JSON `confidence`, `policy`, and `policySummary` hints when another workflow needs to gate auto-apply behavior and stop for review on lower-confidence or existing-page mutations
- optionally seed a wiki page from the ingest command
- define explicit `wikiTargets` when several sources should converge on one shared wiki page instead of creating one wiki page per item
- use `skipRawCapture: true` when an item should only enrich a wiki target from a canonical source and does not deserve its own durable raw note
- accept related-page suggestions driven by title/source overlap
- let batch ingest surface related-page suggestions between the new wiki pages before the files exist
- let batch ingest merge several raw captures into one existing or new wiki page by `wikiTargetId`
- seed backlinks into suggested wiki pages when a new page is created
- append grouped knowledge-log entries and regenerate `knowledge/index.md`
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
