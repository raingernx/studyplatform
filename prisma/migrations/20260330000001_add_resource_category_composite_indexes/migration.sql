-- CreateIndex: category-filtered listing queries
CREATE INDEX "Resource_status_categoryId_createdAt_idx" ON "Resource"("status", "categoryId", "createdAt");
CREATE INDEX "Resource_status_categoryId_downloadCount_idx" ON "Resource"("status", "categoryId", "downloadCount");
CREATE INDEX "Resource_status_categoryId_featured_idx" ON "Resource"("status", "categoryId", "featured");
