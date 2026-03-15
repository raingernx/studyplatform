-- CreateTable
CREATE TABLE "HomepageHero" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "primaryCtaText" TEXT NOT NULL,
    "primaryCtaLink" TEXT NOT NULL,
    "secondaryCtaText" TEXT,
    "secondaryCtaLink" TEXT,
    "badgeText" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageHero_pkey" PRIMARY KEY ("id")
);
