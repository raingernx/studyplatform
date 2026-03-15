/*
  Warnings:

  - You are about to drop the column `entityType` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `meta` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropIndex
DROP INDEX "ActivityLog_entityType_entityId_createdAt_idx";

-- DropIndex
DROP INDEX "ActivityLog_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "entityType",
DROP COLUMN "meta",
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "entityId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
