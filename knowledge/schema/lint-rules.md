# Lint Rules

Phase 1 lint is structural, not semantic.

It should check:

- required root files exist
- required schema files exist
- every page under `knowledge/wiki/` contains the standard section headings
- every wiki page is linked from `knowledge/index.md`

Manual review still needs to check:

- stale summaries
- contradictory claims
- weak or missing citations
- pages that duplicate each other semantically
- wiki pages that drift from code or runtime behavior
