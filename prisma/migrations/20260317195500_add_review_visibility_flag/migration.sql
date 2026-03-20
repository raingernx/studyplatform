ALTER TABLE "Review"
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Review_resourceId_isVisible_createdAt_idx"
ON "Review"("resourceId", "isVisible", "createdAt");
