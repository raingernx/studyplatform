CREATE TABLE "Hero" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "badgeText" TEXT,
  "primaryCtaText" TEXT,
  "primaryCtaLink" TEXT,
  "secondaryCtaText" TEXT,
  "secondaryCtaLink" TEXT,
  "imageUrl" TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Hero_isActive_priority_createdAt_idx"
  ON "Hero"("isActive", "priority", "createdAt");

CREATE INDEX "Hero_startDate_endDate_idx"
  ON "Hero"("startDate", "endDate");
