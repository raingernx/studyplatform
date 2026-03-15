ALTER TABLE "User"
ADD COLUMN "creatorDisplayName" TEXT,
ADD COLUMN "creatorSlug" TEXT,
ADD COLUMN "creatorBio" TEXT,
ADD COLUMN "creatorBanner" TEXT,
ADD COLUMN "creatorStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "creatorSocialLinks" JSONB;

CREATE UNIQUE INDEX "User_creatorSlug_key" ON "User"("creatorSlug");
