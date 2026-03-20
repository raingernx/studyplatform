-- AlterTable
ALTER TABLE "PlatformTypographySettings"
ADD COLUMN "singletonKey" TEXT;

-- Backfill the earliest existing row as the active global singleton.
WITH "earliest" AS (
  SELECT "id"
  FROM "PlatformTypographySettings"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
UPDATE "PlatformTypographySettings"
SET "singletonKey" = 'global'
WHERE "id" IN (SELECT "id" FROM "earliest");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTypographySettings_singletonKey_key"
ON "PlatformTypographySettings"("singletonKey");
