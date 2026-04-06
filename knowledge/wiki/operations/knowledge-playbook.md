# Knowledge Layer Playbook

## Summary

This playbook explains when to use the repo-owned knowledge layer, when to skip it, and how to keep it from turning into extra clerical work.

## Current Truth

- The knowledge layer is useful only for durable project knowledge, not for every chat or micro-change.
- Default behavior is `Codex triages first`: the agent decides whether a change should be ignored, ingested as a single source, merged into an existing wiki page, or handled as a batch topic.
- After triage, the agent must report the decision back to the user in plain language: what was kept, what was skipped, and why.
- The normal workflow is: triage first, preview with `wiki:ingest:dry-run` when needed, then write with `wiki:ingest` or `wiki:ingest:batch`.
- Existing wiki pages should usually be updated before creating new overlapping topic pages.
- CI- or agent-facing workflows should prefer `--enforce-policy`, `--report-file`, and `--report-format bundle`.
- The main maintenance checks are `wiki:lint`, `wiki:coverage`, `wiki:stale`, and `wiki:drift`.

## Why It Matters

Without a usage pattern, the knowledge layer either gets ignored or becomes extra admin work. The goal is to capture high-value context once, then make future work cheaper.

## Key Files

- `knowledge/schema/ingest-rules.md`
- `knowledge/schema/query-rules.md`
- `knowledge/wiki/operations/knowledge-layer.md`
- `scripts/wiki-ingest.mjs`
- `knowledge/log.md`

## Flows

- Codex asks one question first: "Will this knowledge matter again after the current task is over?"
- if the answer is no, Codex should skip ingest and say so explicitly
- if the source is durable and self-contained, Codex should prefer single ingest
- if several sources explain one topic together, Codex should prefer batch ingest
- run `wiki:ingest:dry-run` first when touching existing wiki pages, using `wikiTargetId`, or using `skipRawCapture`
- write only after the preview matches the intended raw note, wiki target, and backlink scope
- after writing, Codex should report what changed: created raw note, created/updated wiki target, backlinks seeded, and checks run
- run `wiki:lint` and the other maintenance checks after meaningful knowledge changes

## Invariants

- The knowledge layer must stay subordinate to code, `AGENTS.md`, `krukraft-ai-contexts/`, and other canonical docs.
- `knowledge/raw/` is for evidence worth keeping, not for chat exhaust.
- `knowledge/wiki/` should not fragment into many pages with overlapping identity.
- A knowledge change is not complete if `Sources` or `Last Reviewed` become stale.

## Known Risks

- Ingesting too aggressively creates noise and extra review work.
- Using `skipRawCapture` too often can make later evidence review harder.
- A single green lint pass does not prove that a wiki page is the right abstraction.

## Operator Notes

- The user should not need to decide ingest shape on every change.
- The user can delegate that judgment to Codex by default.
- Codex should only ask the user to decide when the ingest cost or topic boundary is genuinely ambiguous.

## Related Pages

- [Knowledge Layer Operations](./knowledge-layer.md)
- [Repo-Owned Knowledge Layer](../decisions/repo-owned-knowledge-layer.md)
- [Browser Verification](../testing/browser-verification.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`knowledge/schema/ingest-rules.md`](../../schema/ingest-rules.md)
- [`knowledge/schema/query-rules.md`](../../schema/query-rules.md)
- [`knowledge/wiki/operations/knowledge-layer.md`](./knowledge-layer.md)

## Last Reviewed

- 2026-04-06
