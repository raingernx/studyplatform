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
- `npm run wiki:ingest:dry-run -- --bucket <bucket> --title "..." --source <path>` previews raw/wiki targets, related-page suggestions, and backlink changes without writing files
- `npm run wiki:ingest:batch -- <json-file>` ingests a batch plan from JSON, pre-validates the whole write set first, appends grouped entries to `knowledge/log.md`, and regenerates `knowledge/index.md` once after the batch lands
- `npm run wiki:ingest:batch:dry-run -- <json-file>` previews the batch merge plan, including raw/wiki targets, related-page suggestions, backlink writes, and log/index side effects, without touching files
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
