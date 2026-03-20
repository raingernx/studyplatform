-- AlterTable
ALTER TABLE "Purchase"
ADD COLUMN "authorId" TEXT,
ADD COLUMN "authorRevenue" INTEGER;

-- CreateIndex
CREATE INDEX "Purchase_authorId_createdAt_idx" ON "Purchase"("authorId", "createdAt");
