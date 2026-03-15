-- Backfill creatorEnabled for legacy creators before tightening creator status semantics.
UPDATE "User" u
SET "creatorEnabled" = TRUE
WHERE u."creatorEnabled" = FALSE
  AND (
    u."role" = 'INSTRUCTOR'
    OR EXISTS (
      SELECT 1
      FROM "Resource" r
      WHERE r."authorId" = u."id"
    )
  );

-- Normalize creatorStatus strings so the enum conversion is safe.
UPDATE "User" u
SET "creatorStatus" = CASE
  WHEN u."creatorStatus" = 'PAUSED' THEN 'PAUSED'
  WHEN u."creatorEnabled" = TRUE THEN 'ACTIVE'
  WHEN u."role" = 'INSTRUCTOR' THEN 'ACTIVE'
  WHEN EXISTS (
    SELECT 1
    FROM "Resource" r
    WHERE r."authorId" = u."id"
  ) THEN 'ACTIVE'
  ELSE 'INACTIVE'
END;

CREATE TYPE "CreatorStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'SUSPENDED');

ALTER TABLE "User"
ALTER COLUMN "creatorStatus" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "creatorStatus" TYPE "CreatorStatus"
USING ("creatorStatus"::"CreatorStatus");

ALTER TABLE "User"
ALTER COLUMN "creatorStatus" SET DEFAULT 'INACTIVE';
