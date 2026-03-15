ALTER TABLE "Hero"
  ADD COLUMN "weight" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "abGroup" TEXT,
  ADD COLUMN "impressions" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "clicks" INTEGER NOT NULL DEFAULT 0;

UPDATE "Hero"
SET
  "primaryCtaText" = COALESCE(NULLIF(TRIM("primaryCtaText"), ''), 'Browse resources'),
  "primaryCtaLink" = COALESCE(NULLIF(TRIM("primaryCtaLink"), ''), '/resources'),
  "weight" = COALESCE("weight", 1),
  "impressions" = COALESCE("impressions", 0),
  "clicks" = COALESCE("clicks", 0),
  "abGroup" = NULLIF(TRIM("abGroup"), '');

ALTER TABLE "Hero"
  ALTER COLUMN "primaryCtaText" SET NOT NULL,
  ALTER COLUMN "primaryCtaLink" SET NOT NULL;

DROP INDEX IF EXISTS "Hero_isActive_priority_idx";
DROP INDEX IF EXISTS "Hero_startDate_endDate_idx";

CREATE INDEX "Hero_isActive_idx" ON "Hero"("isActive");
CREATE INDEX "Hero_priority_idx" ON "Hero"("priority");
CREATE INDEX "Hero_startDate_idx" ON "Hero"("startDate");
CREATE INDEX "Hero_endDate_idx" ON "Hero"("endDate");
