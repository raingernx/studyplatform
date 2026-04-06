# Open Questions

- Should future ingest flows snapshot external materials into `knowledge/raw/` automatically, or keep raw sources mostly outside git until a formal ingestion command exists?
- Should `wiki:lint` eventually check stale review windows by topic, or stay structural-only and rely on human review dates?
- Should repo-owned context updates in `krukraft-ai-contexts/` automatically require matching updates in `knowledge/wiki/` for overlapping topics, or remain best-effort until the wiki matures?
