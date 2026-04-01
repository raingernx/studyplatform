-- Extend trigram support to slug fields that the marketplace search ranking
-- query already uses for ILIKE/similarity scoring. Unique btree indexes help
-- equality/prefix lookups, but not contains/similarity search.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Resource_slug_trgm_idx"
  ON "Resource" USING GIN ("slug" gin_trgm_ops);

CREATE INDEX "Category_slug_trgm_idx"
  ON "Category" USING GIN ("slug" gin_trgm_ops);

CREATE INDEX "Tag_slug_trgm_idx"
  ON "Tag" USING GIN ("slug" gin_trgm_ops);
