DROP INDEX IF EXISTS "Hero_isActive_priority_createdAt_idx";

CREATE INDEX "Hero_isActive_priority_idx" ON "Hero"("isActive", "priority");
