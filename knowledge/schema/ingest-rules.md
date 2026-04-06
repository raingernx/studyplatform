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
