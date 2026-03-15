-- CreateTable: DownloadEvent
-- One row per successful file delivery for analytics and trend reporting.
-- userId has no FK constraint so rows survive user deletion.
CREATE TABLE "DownloadEvent" (
    "id"         TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId"     TEXT,
    "ip"         TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: cascade-delete DownloadEvents when the parent Resource is deleted
ALTER TABLE "DownloadEvent"
    ADD CONSTRAINT "DownloadEvent_resourceId_fkey"
    FOREIGN KEY ("resourceId")
    REFERENCES "Resource"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: per-resource analytics (row counts, trend windows)
CREATE INDEX "DownloadEvent_resourceId_idx"         ON "DownloadEvent"("resourceId");

-- CreateIndex: time-range queries (e.g. downloads in the last 30 days)
CREATE INDEX "DownloadEvent_createdAt_idx"           ON "DownloadEvent"("createdAt");

-- CreateIndex: per-resource time-range queries (trend charts per resource)
CREATE INDEX "DownloadEvent_resourceId_createdAt_idx" ON "DownloadEvent"("resourceId", "createdAt");
