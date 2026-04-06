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

- [Auth System](wiki/systems/auth.md)
- [Payments System](wiki/systems/payments.md)
- [Search System](wiki/systems/search.md)
- [Storage And Downloads](wiki/systems/storage-downloads.md)

### Flows

- [Purchase To Library Flow](wiki/flows/purchase-to-library.md)

### Routes

- [Dashboard Library Route](wiki/routes/dashboard-library.md)
- [Resource Detail Route](wiki/routes/resource-detail.md)
- [Resources Browse Route](wiki/routes/resources-browse.md)

### Design System

- [Skeleton Policy](wiki/design-system/skeleton-policy.md)

### Testing

- [Browser Verification](wiki/testing/browser-verification.md)

### Operations

- [CI Browser Smoke](wiki/operations/ci-browser-smoke.md)
- [Knowledge Layer Operations](wiki/operations/knowledge-layer.md)
- [Knowledge Layer Playbook](wiki/operations/knowledge-playbook.md)
- [Platform Brand Asset Delivery](wiki/operations/platform-brand-assets.md)
- [Post-Deploy Warm Workflow](wiki/operations/post-deploy-warm-workflow.md)

### Decisions

- [Repo-Owned Knowledge Layer](wiki/decisions/repo-owned-knowledge-layer.md)

## Working Files

- [Log](log.md)
- [Glossary](glossary.md)
- [Open Questions](open-questions.md)
- [Raw Source Notes](raw/README.md)
