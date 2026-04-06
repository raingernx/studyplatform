# Ingest Rules

## Goal

Ingest turns raw material into maintained wiki knowledge without promoting unsourced claims.

## Steps

1. Classify the source into the right `knowledge/raw/` bucket or link to an existing canonical repo document.
2. Check whether a matching wiki page already exists.
3. Update the existing wiki page if the topic overlaps.
4. Create a new page only when the topic has a distinct long-term identity.
5. Add or refresh source links and `Last Reviewed`.
6. Append a short note to `knowledge/log.md`.

Repo workflow:

- `npm run wiki:ingest -- --bucket <bucket> --title "..." --source <path>` creates the raw note and logs the ingest.
- add `--enforce-policy` to `wiki:ingest` / `wiki:ingest:batch` when write mode itself must stop before touching files if the resolved plan is `blocked_by_policy`
- `npm run wiki:ingest:dry-run -- --bucket <bucket> --title "..." --source <path>` previews raw/wiki targets, related-page suggestions, and backlink changes without writing files
- `npm run wiki:ingest:batch -- <json-file>` ingests a batch plan from JSON, pre-validates the whole write set first, appends grouped entries to `knowledge/log.md`, and regenerates `knowledge/index.md` once after the batch lands
- `npm run wiki:ingest:batch:dry-run -- <json-file>` previews the batch merge plan, including raw/wiki targets, related-page suggestions, backlink writes, and log/index side effects, without touching files
- add `--format json` to any dry-run command when another agent, CI step, or script needs the ingest plan as machine-readable JSON instead of text
- add `--report-file <path>` when another workflow should persist the serialized plan as a JSON artifact instead of scraping stdout
- add `--enforce-policy` to any dry-run command when CI should fail fast if the preview resolves to `policySummary.status = "blocked_by_policy"`
- `npm run wiki:ingest:dry-run:json` and `npm run wiki:ingest:batch:dry-run:json -- <json-file>` are the convenience wrappers for that machine-readable preview mode
- `npm run wiki:ingest:enforce`, `npm run wiki:ingest:batch:enforce -- <json-file>`, `npm run wiki:ingest:dry-run:enforce`, `npm run wiki:ingest:dry-run:json:enforce`, `npm run wiki:ingest:batch:dry-run:enforce -- <json-file>`, and `npm run wiki:ingest:batch:dry-run:json:enforce -- <json-file>` are the convenience wrappers for policy-enforced write/preview mode
- JSON dry-run preview now includes per-item and per-target `decision` metadata with `actions`, `reasons`, and `severity`, plus a top-level `decisionSummary` for automation that needs to branch on create/update/merge/backlink behavior
- JSON dry-run preview now also includes `confidence` and `policy` metadata plus a top-level `policySummary`, so CI or another agent can decide whether a plan is safe to auto-apply or should stop for review
- batch JSON can now include a top-level `policy` object with `allowExistingWikiUpdate`, `allowBacklinkSeeding`, `allowSkipRawCapture`, `maxReviewItems`, and `maxReviewTargets`
- when a batch `policy` is present, dry-run JSON echoes it as `policyOverrides` and upgrades affected item/target/global policies to `blocked_by_policy` with explicit override violations
- when `--enforce-policy` is active, dry-run still prints the preview first, then exits non-zero only for `blocked_by_policy`; plain `review_required` remains informational. In write mode, the command resolves the same plan first and exits before writing any files when the policy status is `blocked_by_policy`
- in blocked write mode, `--format json` now emits the serialized plan to stdout before exiting, and `--report-file` writes the same JSON plan to disk for CI artifact collection
- use `--wiki-dir <category> --wiki-slug <slug>` only when the source deserves an immediate topic page
- `wiki:ingest` now suggests related wiki pages from title/source overlap, can suggest related pages between newly created wiki pages in the same batch, and seeds backlinks when it creates a new wiki page
- batch JSON accepts an array or an object with `items`; each item mirrors the single-ingest fields: `bucket`, `slug`, `title`, `summary`, `source`, `wikiDir`, `wikiSlug`, and `wikiTitle`
- batch JSON can also include `wikiTargets`, where each target defines `id`, `wikiDir`, `wikiSlug`, and `wikiTitle`
- use `wikiTargetId` on batch items when multiple raw captures should merge into the same wiki page; the target can point at a new page or an already-existing wiki page
- batch items can set `skipRawCapture: true` when the source should update a wiki page directly without creating a new `knowledge/raw/` note
- `skipRawCapture: true` requires a valid `source` path plus either `wikiTargetId` or inline wiki target config; it is meant for temporary evidence or low-value one-off source merges where a dedicated raw note would just create noise
- inline `wikiDir/wikiSlug/wikiTitle` and `wikiTargetId` are mutually exclusive on the same batch item
- when several batch items share one `wikiTargetId`, ingest updates that wiki page once with merged `Sources`, merged `Related Pages`, and a refreshed `Last Reviewed`
- run `npm run wiki:index` manually only when adding/removing wiki pages outside the ingest helper; the ingest workflow now regenerates the index automatically after successful writes

## What To Ingest

- repo docs
- ADR-like decisions
- incident summaries
- meeting notes with durable product or engineering value
- external research that will be referenced repeatedly

## What Not To Ingest Directly

- transient chat output with no source backing
- speculative opinions with no durable value
- duplicated copies of repo files that already live in canonical locations
