-- AddIndex: Resource marketplace listing queries
CREATE INDEX "Resource_status_createdAt_idx" ON "Resource"("status", "createdAt");
CREATE INDEX "Resource_status_downloadCount_idx" ON "Resource"("status", "downloadCount");
CREATE INDEX "Resource_status_featured_idx" ON "Resource"("status", "featured");
CREATE INDEX "Resource_deletedAt_idx" ON "Resource"("deletedAt");

-- AddIndex: Purchase ownership lookups
CREATE INDEX "Purchase_userId_status_idx" ON "Purchase"("userId", "status");
CREATE INDEX "Purchase_resourceId_idx" ON "Purchase"("resourceId");
