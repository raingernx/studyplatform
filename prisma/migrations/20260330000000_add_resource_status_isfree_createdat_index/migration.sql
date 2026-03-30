-- CreateIndex
CREATE INDEX "Resource_status_isFree_createdAt_idx" ON "Resource"("status", "isFree", "createdAt");
