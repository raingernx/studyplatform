# Krukraft Knowledge Index

This directory is the repo-owned LLM wiki layer for Krukraft.

It sits between raw source material and one-off assistant answers:

- `knowledge/raw/` stores evidence, snapshots, or intake material.
- `knowledge/wiki/` stores synthesized markdown pages maintained over time.
- `knowledge/schema/` stores ingest/query/lint rules for agents.

Canonical repo truth still lives in:

1. code and verified runtime behavior
2. `AGENTS.md`
3. `krukraft-ai-contexts/`
4. `design-system.md`
5. `figma-component-map.md`

Use this index as the first entry point for queries.

## Schema

- [Wiki Rules](schema/wiki-rules.md)
- [Source Priority](schema/source-priority.md)
- [Ingest Rules](schema/ingest-rules.md)
- [Query Rules](schema/query-rules.md)
- [Lint Rules](schema/lint-rules.md)
- [Page Template](schema/page-template.md)

## Core Wiki Pages

### Systems

- [Auth](wiki/systems/auth.md)
- [Payments](wiki/systems/payments.md)
- [Search](wiki/systems/search.md)
- [Storage And Downloads](wiki/systems/storage-downloads.md)

### Flows

- [Purchase To Library](wiki/flows/purchase-to-library.md)

### Routes

- [Resources Browse](wiki/routes/resources-browse.md)
- [Resource Detail](wiki/routes/resource-detail.md)
- [Dashboard Library](wiki/routes/dashboard-library.md)

### Design System

- [Skeleton Policy](wiki/design-system/skeleton-policy.md)

### Testing

- [Browser Verification](wiki/testing/browser-verification.md)

### Operations

- [CI Browser Smoke](wiki/operations/ci-browser-smoke.md)

## Working Files

- [Log](log.md)
- [Glossary](glossary.md)
- [Open Questions](open-questions.md)
- [Raw Source Notes](raw/README.md)
