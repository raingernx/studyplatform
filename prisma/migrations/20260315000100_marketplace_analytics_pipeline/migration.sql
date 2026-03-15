CREATE TYPE "AnalyticsEventType" AS ENUM (
  'RESOURCE_VIEW',
  'RESOURCE_DOWNLOAD',
  'RESOURCE_PURCHASE',
  'RESOURCE_LIKE',
  'RESOURCE_BOOKMARK'
);

CREATE TABLE "analytics_events" (
  "id" TEXT NOT NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "userId" TEXT,
  "resourceId" TEXT,
  "creatorId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resource_stats" (
  "resourceId" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "purchases" INTEGER NOT NULL DEFAULT 0,
  "revenue" INTEGER NOT NULL DEFAULT 0,
  "last24hDownloads" INTEGER NOT NULL DEFAULT 0,
  "last7dDownloads" INTEGER NOT NULL DEFAULT 0,
  "last30dDownloads" INTEGER NOT NULL DEFAULT 0,
  "last24hPurchases" INTEGER NOT NULL DEFAULT 0,
  "last7dPurchases" INTEGER NOT NULL DEFAULT 0,
  "last30dPurchases" INTEGER NOT NULL DEFAULT 0,
  "trendingScore" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resource_stats_pkey" PRIMARY KEY ("resourceId")
);

CREATE TABLE "creator_stats" (
  "creatorId" TEXT NOT NULL,
  "resources" INTEGER NOT NULL DEFAULT 0,
  "totalDownloads" INTEGER NOT NULL DEFAULT 0,
  "last30dDownloads" INTEGER NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL DEFAULT 0,
  "totalRevenue" INTEGER NOT NULL DEFAULT 0,
  "last7dRevenue" INTEGER NOT NULL DEFAULT 0,
  "last30dRevenue" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "creator_stats_pkey" PRIMARY KEY ("creatorId")
);

CREATE TABLE "platform_stats" (
  "date" DATE NOT NULL,
  "totalDownloads" INTEGER NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL DEFAULT 0,
  "totalRevenue" INTEGER NOT NULL DEFAULT 0,
  "newUsers" INTEGER NOT NULL DEFAULT 0,
  "newResources" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "creator_revenue" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "purchaseId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "platformFee" INTEGER NOT NULL,
  "creatorShare" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_revenue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_revenue_purchaseId_key" ON "creator_revenue"("purchaseId");
CREATE INDEX "analytics_events_eventType_createdAt_idx" ON "analytics_events"("eventType", "createdAt");
CREATE INDEX "analytics_events_resourceId_createdAt_idx" ON "analytics_events"("resourceId", "createdAt");
CREATE INDEX "analytics_events_creatorId_createdAt_idx" ON "analytics_events"("creatorId", "createdAt");
CREATE INDEX "analytics_events_userId_createdAt_idx" ON "analytics_events"("userId", "createdAt");
CREATE INDEX "resource_stats_trendingScore_updatedAt_idx" ON "resource_stats"("trendingScore", "updatedAt");
CREATE INDEX "resource_stats_downloads_updatedAt_idx" ON "resource_stats"("downloads", "updatedAt");
CREATE INDEX "resource_stats_purchases_updatedAt_idx" ON "resource_stats"("purchases", "updatedAt");
CREATE INDEX "creator_stats_totalRevenue_updatedAt_idx" ON "creator_stats"("totalRevenue", "updatedAt");
CREATE INDEX "creator_stats_totalDownloads_updatedAt_idx" ON "creator_stats"("totalDownloads", "updatedAt");
CREATE INDEX "creator_revenue_creatorId_createdAt_idx" ON "creator_revenue"("creatorId", "createdAt");
CREATE INDEX "creator_revenue_resourceId_createdAt_idx" ON "creator_revenue"("resourceId", "createdAt");

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "resource_stats"
  ADD CONSTRAINT "resource_stats_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_stats"
  ADD CONSTRAINT "creator_stats_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_revenue"
  ADD CONSTRAINT "creator_revenue_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_revenue"
  ADD CONSTRAINT "creator_revenue_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_revenue"
  ADD CONSTRAINT "creator_revenue_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
