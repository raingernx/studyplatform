ALTER TABLE "Hero"
ADD COLUMN "experimentId" TEXT,
ADD COLUMN "variant" TEXT;

CREATE INDEX "Hero_experimentId_idx"
ON "Hero"("experimentId");
