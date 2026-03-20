-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payout_authorId_createdAt_idx" ON "Payout"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
