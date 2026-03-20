-- Improve common public/admin/creator listing queries with conservative
-- composite indexes that match current filter + ordering patterns.

CREATE INDEX "Resource_deletedAt_createdAt_idx"
ON "Resource"("deletedAt", "createdAt");

CREATE INDEX "Resource_authorId_deletedAt_createdAt_idx"
ON "Resource"("authorId", "deletedAt", "createdAt");

CREATE INDEX "Purchase_status_createdAt_idx"
ON "Purchase"("status", "createdAt");
