# Wiki Rules

## Purpose

Wiki pages under `knowledge/wiki/` are synthesized pages that help agents and humans understand the repo faster. They are not the top-level source of truth.

## Required Structure

Every wiki page must include these headings:

- `## Summary`
- `## Current Truth`
- `## Why It Matters`
- `## Key Files`
- `## Flows`
- `## Invariants`
- `## Known Risks`
- `## Related Pages`
- `## Sources`
- `## Last Reviewed`

## Writing Rules

- Prefer short, factual summaries over exhaustive prose.
- Separate direct facts from inference when the distinction matters.
- Do not restate large parts of the codebase if the page can link instead.
- Keep links relative so pages stay portable inside the repo.
- When code and a wiki page disagree, the code wins until the wiki is updated.

## Update Rules

- Update an existing topic page before creating a new overlapping page.
- Add or update backlinks in `## Related Pages`.
- Keep `## Last Reviewed` current when a page changes materially.
