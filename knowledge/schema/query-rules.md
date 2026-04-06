# Query Rules

## Default Query Order

1. Start from `knowledge/index.md`.
2. Read the most relevant wiki pages first.
3. If the wiki is missing detail or conflicts with itself, check canonical repo docs.
4. If needed, inspect code or runtime behavior.
5. Use `knowledge/raw/` for additional evidence or historical context.

## Answering Rules

- Distinguish between fact and inference.
- Prefer direct file references for canonical repo truth.
- Do not treat a wiki page as sufficient evidence when a higher-priority source is easy to inspect.
- If the wiki looks stale, say so and verify against code.

## Citation Rules

- Prefer repo-relative links in wiki pages.
- Prefer canonical source links in final answers when citing durable truth.
- Use `knowledge/raw/` links when a conclusion depends on evidence not represented elsewhere.
