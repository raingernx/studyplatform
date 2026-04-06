# Source Priority

Use this priority order when sources disagree:

1. verified code and runtime behavior
2. `AGENTS.md`
3. `krukraft-ai-contexts/`
4. `design-system.md`
5. `figma-component-map.md`
6. `knowledge/raw/` evidence files
7. `knowledge/wiki/` pages

Additional rules:

- Tests are evidence of expected behavior, but runtime verification outranks a stale test.
- A wiki page may summarize multiple higher-priority sources, but it must not silently outrank them.
- If a page relies on inference, make that explicit in the page text or source notes.
