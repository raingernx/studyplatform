-- AlterTable
ALTER TABLE "PlatformSettings"
ADD COLUMN "shortName" TEXT,
ADD COLUMN "siteUrl" TEXT,
ADD COLUMN "defaultMetaTitle" TEXT,
ADD COLUMN "defaultMetaDescription" TEXT,
ADD COLUMN "ogSiteName" TEXT,
ADD COLUMN "emailSenderName" TEXT;
