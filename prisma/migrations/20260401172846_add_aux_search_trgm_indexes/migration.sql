-- Extend trigram coverage beyond Resource.title/description so the remaining
-- ILIKE/contains search paths used by marketplace search and admin user lookup
-- can avoid falling back to sequential scans on joined text columns.
--
-- This migration keeps using standard CREATE INDEX statements because Prisma
-- migrations run inside a transaction and therefore cannot use CONCURRENTLY.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Category_name_trgm_idx"
  ON "Category" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "Tag_name_trgm_idx"
  ON "Tag" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "User_name_trgm_idx"
  ON "User" USING GIN ("name" gin_trgm_ops)
  WHERE "name" IS NOT NULL;

CREATE INDEX "User_email_trgm_idx"
  ON "User" USING GIN ("email" gin_trgm_ops)
  WHERE "email" IS NOT NULL;
