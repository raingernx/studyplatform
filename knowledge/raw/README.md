# Raw Sources

`knowledge/raw/` is the evidence layer for the repo-owned LLM wiki.

Use it for:

- meeting notes
- incident notes
- decision memos
- research exports
- copied external references that should be versioned in-repo

Do not rewrite these files into polished truth in place. Summaries belong in `knowledge/wiki/`.

Current subdirectories:

- `repo-docs/`
- `product/`
- `architecture/`
- `design/`
- `operations/`
- `incidents/`
- `research/`
- `decisions/`

Canonical repo documents such as `AGENTS.md`, `krukraft-ai-contexts/`, `design-system.md`, and `figma-component-map.md` remain outside `knowledge/raw/` and should be linked, not duplicated, unless a specific snapshot is required.
