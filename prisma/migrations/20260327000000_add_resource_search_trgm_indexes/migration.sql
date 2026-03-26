-- Enable the pg_trgm extension for trigram-based similarity matching.
-- Required for GIN trigram indexes used by ILIKE search patterns.
-- On Supabase this extension is pre-installed; IF NOT EXISTS makes this idempotent.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN trigram indexes on Resource.title and Resource.description.
--
-- These indexes make marketplace search (case-insensitive ILIKE '%term%' on both
-- columns) use a trigram index scan instead of a sequential table scan.
--
-- LOCKING NOTE: These are standard CREATE INDEX statements, not CONCURRENTLY.
-- Prisma migrations run inside an implicit transaction; CREATE INDEX CONCURRENTLY
-- is explicitly forbidden inside a transaction block and will error if attempted.
-- The standard form acquires a ShareUpdateExclusiveLock: reads are unblocked,
-- but writes are briefly blocked during the build. On a small-to-medium catalog
-- this is acceptable during a planned deployment window.
-- If zero-downtime indexing on a very large table is required in future, run
-- CREATE INDEX CONCURRENTLY manually outside of Prisma migrations (direct DB
-- access via DIRECT_URL) and record it as a baseline migration.

CREATE INDEX "Resource_title_trgm_idx"
  ON "Resource" USING GIN (title gin_trgm_ops);

CREATE INDEX "Resource_description_trgm_idx"
  ON "Resource" USING GIN (description gin_trgm_ops);
