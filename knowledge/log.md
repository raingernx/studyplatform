# Knowledge Log

## 2026-04-06

- added `confidence`, `policy`, and `policySummary` hints to `wiki:ingest` JSON dry-run previews so CI and agents can gate auto-apply vs review without reverse-engineering merge intent from the plan.
- enriched `wiki:ingest` JSON dry-run previews with per-item/per-target decision metadata (`actions`, `reasons`, `severity`) plus a top-level `decisionSummary` so CI and agents can branch on create/update/merge/backlink behavior directly.
- added `--format json` plus `wiki:ingest:dry-run:json` helpers so dry-run ingest plans can be consumed programmatically by agents or CI.
- added `skipRawCapture: true` for batch ingest items so canonical source fragments can update a shared wiki target without generating standalone low-value raw notes.
- upgraded `wiki:ingest:batch` so several raw captures can merge into one explicit shared wiki target via `wikiTargets` + `wikiTargetId`, including updates to existing wiki pages.
- added `wiki:ingest:batch` and `wiki:ingest:batch:dry-run` so multiple raw captures/wiki stubs can land from one pre-validated merge plan with batch-level suggestion and backlink reporting.
- upgraded `wiki:ingest` to append `knowledge/log.md` and regenerate `knowledge/index.md` automatically after successful writes instead of relying on manual follow-up.
- added `wiki:ingest:dry-run` so ingest can preview raw/wiki targets, related-page suggestions, and backlink writes before touching the repo.
- upgraded `wiki:ingest` to suggest related wiki pages from title/source overlap and seed backlinks into suggested pages when it creates a new wiki page.
- scoped `wiki:drift` to implementation-linked files and raw evidence notes so change-set review stays high-signal instead of re-flagging every page on broad meta-doc edits.
- added semantic knowledge checks for duplicate-topic detection, canonical-source backing, and raw-note citation coverage, plus a repo-owned `wiki:coverage` report.
- linked the first raw evidence notes back into the core auth, browser-verification, CI-browser-smoke, skeleton-policy, and knowledge-layer wiki pages so query flow can traverse `wiki -> raw -> canonical source`.
- captured [Repo-Owned Knowledge Layer Decision](raw/decisions/repo-owned-knowledge-layer-decision.md) in `decisions` and seeded [wiki page](wiki/decisions/repo-owned-knowledge-layer.md).

- captured [Skeleton Runtime Policy](raw/design/skeleton-runtime-policy.md) in `design`.

- captured [Browser Verification Split Model](raw/repo-docs/browser-verification-split-model.md) in `repo-docs`.

- captured [Auth Viewer And Route Protection Snapshot](raw/architecture/auth-viewer-and-route-protection-snapshot.md) in `architecture`.

- captured [Browser Smoke Workflow Baseline](raw/operations/browser-smoke-workflow-baseline.md) in `operations`.

- Added repo-owned `wiki:index`, `wiki:stale`, and `wiki:ingest` commands plus a shared helper module for knowledge-tree discovery.
- Strengthened `wiki:lint` so it now checks that `knowledge/index.md` matches the actual wiki tree instead of only checking for manual links.
- Added an operations wiki page for the knowledge layer and documented the workflow in `AGENTS.md` and `krukraft-ai-contexts/`.
- Seeded the initial `knowledge/` structure with `raw/`, `schema/`, and `wiki/`.
- Added repo-specific schema docs for ingest, query, source priority, and lint.
- Added initial core wiki pages for auth, payments, search, storage/downloads, core routes, CI browser smoke, browser verification, skeleton policy, and purchase-to-library flow.
- Added `npm run wiki:lint` and a repo-owned structural checker for the knowledge layer.
