ALTER TABLE "Hero"
ADD COLUMN "isFallback" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Hero" (
  "id",
  "name",
  "type",
  "title",
  "subtitle",
  "badgeText",
  "primaryCtaText",
  "primaryCtaLink",
  "secondaryCtaText",
  "secondaryCtaLink",
  "imageUrl",
  "mediaUrl",
  "mediaType",
  "priority",
  "weight",
  "isActive",
  "startDate",
  "endDate",
  "abGroup",
  "isFallback",
  "impressions",
  "clicks",
  "createdAt",
  "updatedAt"
)
SELECT
  'fallback-hero',
  'Default Hero',
  'fallback',
  h."title",
  h."subtitle",
  h."badgeText",
  h."primaryCtaText",
  h."primaryCtaLink",
  h."secondaryCtaText",
  h."secondaryCtaLink",
  h."imageUrl",
  h."mediaUrl",
  h."mediaType",
  0,
  1,
  true,
  NULL,
  NULL,
  NULL,
  true,
  0,
  0,
  h."createdAt",
  CURRENT_TIMESTAMP
FROM (
  SELECT *
  FROM "HomepageHero"
  ORDER BY "createdAt" ASC
  LIMIT 1
) h
WHERE NOT EXISTS (
  SELECT 1
  FROM "Hero"
  WHERE "isFallback" = true
);

INSERT INTO "Hero" (
  "id",
  "name",
  "type",
  "title",
  "subtitle",
  "badgeText",
  "primaryCtaText",
  "primaryCtaLink",
  "secondaryCtaText",
  "secondaryCtaLink",
  "imageUrl",
  "mediaUrl",
  "mediaType",
  "priority",
  "weight",
  "isActive",
  "startDate",
  "endDate",
  "abGroup",
  "isFallback",
  "impressions",
  "clicks",
  "createdAt",
  "updatedAt"
)
SELECT
  'fallback-hero',
  'Default Hero',
  'fallback',
  'Discover beautiful study resources',
  'Worksheets, flashcards, and study guides from educators and creators.',
  'Trusted by 12,000+ educators',
  'Browse resources',
  '/resources',
  'Start selling',
  '/membership',
  NULL,
  NULL,
  NULL,
  0,
  1,
  true,
  NULL,
  NULL,
  NULL,
  true,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "Hero"
  WHERE "isFallback" = true
);
