CREATE TABLE "HeroImpression" (
  "id" TEXT NOT NULL,
  "heroId" TEXT NOT NULL,
  "experimentId" TEXT,
  "variant" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HeroImpression_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeroClick" (
  "id" TEXT NOT NULL,
  "heroId" TEXT NOT NULL,
  "experimentId" TEXT,
  "variant" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HeroClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroImpression_heroId_createdAt_idx"
ON "HeroImpression"("heroId", "createdAt");

CREATE INDEX "HeroImpression_experimentId_variant_idx"
ON "HeroImpression"("experimentId", "variant");

CREATE INDEX "HeroClick_heroId_createdAt_idx"
ON "HeroClick"("heroId", "createdAt");

CREATE INDEX "HeroClick_experimentId_variant_idx"
ON "HeroClick"("experimentId", "variant");
