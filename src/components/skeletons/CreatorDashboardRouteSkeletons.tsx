"use client";

import { LoadingSkeleton } from "@/design-system";
import {
  DashboardPageHeader,
  DashboardPageHeaderSkeleton,
} from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageStack } from "@/components/dashboard/DashboardPageShell";
import { CreatorQuickTipsCard } from "@/components/creator/CreatorQuickTipsCard";
import { CreatorSetupChecklist } from "@/components/creator/CreatorSetupChecklist";
import { CreatorWelcomeCard } from "@/components/creator/CreatorWelcomeCard";
import {
  dashboardBonesPreview,
  dashboardRuntimeShell,
} from "@/components/skeletons/dashboard-loading-contract";

const CREATOR_DASHBOARD_OVERVIEW_NAME = "creator-dashboard-overview";
const CREATOR_DASHBOARD_ANALYTICS_NAME = "creator-dashboard-analytics";
const CREATOR_DASHBOARD_RESOURCES_NAME = "creator-dashboard-resources";
const CREATOR_DASHBOARD_SALES_NAME = "creator-dashboard-sales";
const CREATOR_DASHBOARD_PROFILE_NAME = "creator-dashboard-profile";

export interface CreatorOverviewSurfaceSummary {
  hasDraft: boolean;
  showFirstSaleBanner: boolean;
  showLifecycleMessage: boolean;
  showRecentSales: boolean;
  showTopPerformer: boolean;
}

function StatCardRow({
  count,
  columns,
}: {
  count: number;
  columns: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <LoadingSkeleton className="h-10 w-10 rounded-xl" />
          <LoadingSkeleton className="mt-4 h-8 w-24" />
          <LoadingSkeleton className="mt-2 h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function StatCardRowCompact({
  count,
  columns,
}: {
  count: number;
  columns: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="mt-4 h-9 w-28" />
          <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
        </div>
      ))}
    </div>
  );
}

function ReviewSummaryCardRow() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <LoadingSkeleton className="h-10 w-10 rounded-xl" />
          <LoadingSkeleton className="mt-4 h-8 w-20" />
          <LoadingSkeleton className="mt-2 h-4 w-32" />
          <LoadingSkeleton className="mt-2 h-4 w-full max-w-[18rem]" />
        </div>
      ))}
    </div>
  );
}

function AnalyticsSeriesTablePreview({
  rowCount = 8,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="mt-2 h-4 w-64" />
      </div>
      {rowCount === 0 ? (
        <div className="space-y-2 px-6 py-12">
          <LoadingSkeleton className="h-4 w-56 max-w-full" />
          <LoadingSkeleton className="h-4 w-40 max-w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-6 py-3 text-left">
                  <LoadingSkeleton className="h-3 w-12" />
                </th>
                <th className="px-4 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-14" />
                </th>
                <th className="px-4 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-10" />
                </th>
                <th className="px-6 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-16" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: rowCount }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <LoadingSkeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-10" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-14" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsTopListPanelPreview({
  rowCount = 5,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <LoadingSkeleton className="h-5 w-28" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
      {rowCount === 0 ? (
        <div className="mt-4 space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/70 px-4 py-3"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <LoadingSkeleton className="h-4 w-32 max-w-full" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
              <LoadingSkeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsRangeActionsPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      {["7D", "30D", "90D", "ALL TIME"].map((label, index) => (
        <LoadingSkeleton
          key={label}
          className={`h-8 rounded-full ${index === 1 ? "w-16" : label === "ALL TIME" ? "w-24" : "w-14"}`}
        />
      ))}
    </div>
  );
}

function AnalyticsRatingsTablePreview({
  rowCount = 8,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card xl:col-span-2">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className="h-5 w-36" />
        <LoadingSkeleton className="mt-2 h-4 w-64" />
      </div>
      {rowCount === 0 ? (
        <div className="space-y-2 px-6 py-12">
          <LoadingSkeleton className="h-4 w-64 max-w-full" />
          <LoadingSkeleton className="h-4 w-48 max-w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-6 py-3 text-left">
                  <LoadingSkeleton className="h-3 w-16" />
                </th>
                <th className="px-4 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-12" />
                </th>
                <th className="px-4 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-20" />
                </th>
                <th className="px-4 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-16" />
                </th>
                <th className="px-6 py-3 text-right">
                  <LoadingSkeleton className="ml-auto h-3 w-12" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: rowCount }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <LoadingSkeleton className="h-4 w-full max-w-[18rem]" />
                      <LoadingSkeleton className="h-3 w-16" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-10" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-14" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <LoadingSkeleton className="ml-auto h-6 w-20 rounded-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsRecentReviewsPreview({
  rowCount = 4,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <LoadingSkeleton className="h-5 w-32" />
      <LoadingSkeleton className="mt-2 h-4 w-56 max-w-full" />
      {rowCount === 0 ? (
        <div className="space-y-2 px-0 py-12">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <LoadingSkeleton className="h-4 w-36 max-w-full" />
                <LoadingSkeleton className="h-3 w-28" />
                <LoadingSkeleton className="h-3 w-full max-w-[18rem]" />
                <LoadingSkeleton className="h-3 w-full max-w-[14rem]" />
              </div>
              <LoadingSkeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsDistributionPreview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <LoadingSkeleton className="h-5 w-32" />
      <LoadingSkeleton className="mt-2 h-4 w-56 max-w-full" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LoadingSkeleton className="h-4 w-4 rounded-full" />
              <LoadingSkeleton className="h-4 w-20" />
            </div>
            <LoadingSkeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSalesActivityPreview({
  rowCount = 4,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className="h-5 w-36" />
        <LoadingSkeleton className="mt-2 h-4 w-64" />
      </div>
      {rowCount === 0 ? (
        <div className="space-y-2 px-6 py-12">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="flex items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <LoadingSkeleton className="h-4 w-40 max-w-full" />
                <LoadingSkeleton className="h-3 w-36 max-w-full" />
              </div>
              <div className="space-y-1.5 text-right">
                <LoadingSkeleton className="ml-auto h-4 w-16" />
                <LoadingSkeleton className="ml-auto h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsDownloadsActivityPreview({
  rowCount = 4,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      {rowCount === 0 ? (
        <div className="space-y-2 px-6 py-12">
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="flex items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <LoadingSkeleton className="h-4 w-40 max-w-full" />
                <LoadingSkeleton className="h-3 w-44 max-w-full" />
              </div>
              <LoadingSkeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsNextActionPreview() {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <div className="flex items-center gap-2">
          <LoadingSkeleton className="h-4 w-4 rounded-full" />
          <LoadingSkeleton className="h-5 w-24" />
        </div>
        <LoadingSkeleton className="mt-2 h-4 w-full max-w-[34rem]" />
      </div>
      <div className="flex flex-wrap gap-3 px-6 py-5">
        <LoadingSkeleton className="h-10 w-36 rounded-xl" />
        <LoadingSkeleton className="h-10 w-28 rounded-xl" />
      </div>
    </section>
  );
}

function TableShell({
  titleWidth,
  subtitleWidth,
  rows,
  columns,
  padded = "px-6 py-5",
}: {
  titleWidth: string;
  subtitleWidth?: string;
  rows: number;
  columns: string;
  padded?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className={`h-5 ${titleWidth}`} />
        {subtitleWidth ? <LoadingSkeleton className={`mt-2 h-4 ${subtitleWidth}`} /> : null}
      </div>
      <div className={`space-y-4 ${padded}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={`grid ${columns} gap-4`}>
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator Dashboard"
        description="Review the resources you own in the marketplace. This dashboard is read-only and shows only listings attached to your account."
      />

      <CreatorWelcomeCard creatorName="Demo" canCreate />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CreatorSetupChecklist
          steps={{
            profileComplete: true,
            firstResourceCreated: true,
            firstResourcePublished: false,
          }}
          canCreate
        />
        <CreatorQuickTipsCard />
      </div>
    </DashboardPageStack>
  );
}

function OverviewResultsPreviewContent() {
  return (
    <>
      <StatCardRow count={3} columns="md:grid-cols-3" />

      <ReviewSummaryCardRow />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="border-b border-border/70 pb-3">
          <LoadingSkeleton className="h-5 w-28" />
        </div>
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <LoadingSkeleton className="h-4 w-56 max-w-full" />
                <LoadingSkeleton className="h-3 w-40 max-w-full" />
              </div>
              <LoadingSkeleton className="h-4 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border/70 px-6 py-4">
            <LoadingSkeleton className="h-5 w-28" />
          </div>
          <div className="space-y-3 px-6 py-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-8 w-28" />
                <LoadingSkeleton className="h-3 w-full max-w-[18rem]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border/70 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <LoadingSkeleton className="h-5 w-24" />
              <LoadingSkeleton className="h-8 w-28 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3 px-6 py-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/70 px-4 py-3"
              >
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-3 w-20" />
                </div>
                <LoadingSkeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TableShell titleWidth="w-40" subtitleWidth="w-64" rows={5} columns="grid-cols-[2fr_1fr_1fr_1fr]" />
    </>
  );
}

function AnalyticsPreview({
  seriesRowCount = 8,
  resourceReviewRowCount = 8,
  recentReviewsRowCount = 4,
  recentActivityRowCount = 6,
}: {
  seriesRowCount?: number;
  resourceReviewRowCount?: number;
  recentReviewsRowCount?: number;
  recentActivityRowCount?: number;
} = {}) {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        eyebrow="Creator"
        title="Analytics"
        description="Revenue, downloads, and top-performing resources for your creator business."
        actions={<AnalyticsRangeActionsPreview />}
      />
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <ReviewSummaryCardRow />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsSeriesTablePreview rowCount={seriesRowCount} />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <AnalyticsTopListPanelPreview key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsRatingsTablePreview rowCount={resourceReviewRowCount} />
        <AnalyticsRecentReviewsPreview rowCount={recentReviewsRowCount} />
        <AnalyticsDistributionPreview />
        <AnalyticsSalesActivityPreview rowCount={recentActivityRowCount} />
        <AnalyticsDownloadsActivityPreview rowCount={recentActivityRowCount} />
      </div>
      <AnalyticsNextActionPreview />
    </DashboardPageStack>
  );
}

function CreatorResourcesEmptyStatePreview() {
  return (
    <div className="flex items-center justify-center px-5 py-5">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-dashed border-border-subtle px-6 py-16 text-center">
        <LoadingSkeleton className="mx-auto h-5 w-36" />
        <LoadingSkeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
        <LoadingSkeleton className="mx-auto mt-1.5 h-4 w-64 max-w-full" />
        <LoadingSkeleton className="mx-auto mt-6 h-9 w-36 rounded-xl" />
      </div>
    </div>
  );
}

function CreatorResourcesTablePreview({ rowCount }: { rowCount: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border/70 bg-muted/80">
          <tr>
            <th className="px-2 py-3 text-left"><LoadingSkeleton className="h-3 w-16" /></th>
            <th className="px-3 py-3 text-left"><LoadingSkeleton className="h-3 w-16" /></th>
            <th className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-12" /></th>
            <th className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-18" /></th>
            <th className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-14" /></th>
            <th className="px-3 py-3 text-left"><LoadingSkeleton className="h-3 w-12" /></th>
            <th className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-14" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {Array.from({ length: rowCount }).map((_, index) => (
            <tr key={index}>
              <td className="px-2 py-3">
                <div className="min-w-0 space-y-1.5">
                  <LoadingSkeleton className="h-4 w-40 max-w-full" />
                  <LoadingSkeleton className="h-3 w-24" />
                </div>
              </td>
              <td className="px-3 py-3"><LoadingSkeleton className="h-4 w-20" /></td>
              <td className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-4 w-16" /></td>
              <td className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-4 w-14" /></td>
              <td className="px-3 py-3 text-right"><LoadingSkeleton className="ml-auto h-4 w-16" /></td>
              <td className="px-3 py-3"><LoadingSkeleton className="h-6 w-20 rounded-full" /></td>
              <td className="px-3 py-3 text-right">
                <div className="flex justify-end">
                  <LoadingSkeleton className="h-8 w-24 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourcesPreview({
  rowCount = 9,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
}) {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator resources"
        description="Filter, publish, and monitor the listings you own in the marketplace."
        actions={<LoadingSkeleton className="h-9 w-40 rounded-xl" />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="mt-3 h-8 w-20" />
            <LoadingSkeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-10 w-40 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-3 w-20" />
        </div>
        {variant === "empty" ? (
          <CreatorResourcesEmptyStatePreview />
        ) : (
          <CreatorResourcesTablePreview rowCount={rowCount} />
        )}
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton className="mt-2 h-3 w-full max-w-[32rem]" />
        <LoadingSkeleton className="mt-1.5 h-3 w-64 max-w-full" />
        <LoadingSkeleton className="mt-3 h-4 w-32" />
      </div>
    </DashboardPageStack>
  );
}

function SalesPreview() {
  return SalesPreviewWithVariant();
}

function SalesEmptyStatePreview() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border/70 px-6 py-4">
        <LoadingSkeleton className="h-5 w-28" />
      </div>
      <div className="px-6 py-14">
        <LoadingSkeleton className="h-4 w-40" />
        <LoadingSkeleton className="mt-3 h-4 w-56 max-w-full" />
      </div>
    </section>
  );
}

function SalesPreviewWithVariant({
  rowCount = 5,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        eyebrow="Creator"
        title="Sales"
        description="Recent transactions and the gross revenue your resources have generated."
      />
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      {variant === "empty" ? (
        <SalesEmptyStatePreview />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border/70 px-6 py-4">
            <LoadingSkeleton className="h-5 w-28" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="px-6 py-3 text-left"><LoadingSkeleton className="h-3 w-16" /></th>
                  <th className="px-4 py-3 text-left"><LoadingSkeleton className="h-3 w-12" /></th>
                  <th className="px-4 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-10" /></th>
                  <th className="px-4 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-16" /></th>
                  <th className="px-4 py-3 text-left"><LoadingSkeleton className="h-3 w-12" /></th>
                  <th className="px-6 py-3 text-right"><LoadingSkeleton className="ml-auto h-3 w-10" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: rowCount }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <LoadingSkeleton className="h-4 w-36 max-w-full" />
                        <LoadingSkeleton className="h-3 w-28" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <LoadingSkeleton className="h-4 w-24" />
                      <LoadingSkeleton className="mt-1.5 h-3 w-28" />
                    </td>
                    <td className="px-4 py-4 text-right"><LoadingSkeleton className="ml-auto h-4 w-14" /></td>
                    <td className="px-4 py-4 text-right"><LoadingSkeleton className="ml-auto h-4 w-16" /></td>
                    <td className="px-4 py-4"><LoadingSkeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><LoadingSkeleton className="ml-auto h-4 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPageStack>
  );
}

function ProfileFieldPreview({
  fullWidth = false,
  multiline = false,
  showHint = true,
  showCounter = false,
}: {
  fullWidth?: boolean;
  multiline?: boolean;
  showHint?: boolean;
  showCounter?: boolean;
}) {
  return (
    <div className={`space-y-2 ${fullWidth ? "md:col-span-2" : ""}`}>
      <LoadingSkeleton className="h-4 w-28" />
      <LoadingSkeleton
        className={multiline ? "h-36 w-full rounded-2xl" : "h-12 w-full rounded-xl"}
      />
      {showHint ? <LoadingSkeleton className="h-3 w-full max-w-[18rem]" /> : null}
      {showCounter ? <LoadingSkeleton className="ml-auto h-3 w-14" /> : null}
    </div>
  );
}

function ProfileMainPanelSkeleton({
  hasPublicProfile = false,
}: {
  hasPublicProfile?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-col gap-5 border-b border-border px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <LoadingSkeleton className="h-6 w-28 rounded-full" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-7 w-64 max-w-full" />
            <LoadingSkeleton className="h-4 w-full max-w-[30rem]" />
            <LoadingSkeleton className="h-4 w-full max-w-[26rem]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <LoadingSkeleton className="h-6 w-24 rounded-full" />
            <LoadingSkeleton className="h-6 w-32 rounded-full" />
            <LoadingSkeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-1.5">
              <LoadingSkeleton className="h-3 w-32" />
              <LoadingSkeleton className="h-7 w-28" />
            </div>
            <LoadingSkeleton className="h-3 w-24" />
          </div>
          <LoadingSkeleton className="h-2 w-full rounded-full" />
          <LoadingSkeleton className="h-3 w-full max-w-[18rem]" />
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="space-y-4 border-b border-border pb-6">
            <LoadingSkeleton className="h-5 w-36" />
            <LoadingSkeleton className="h-4 w-full max-w-[26rem]" />
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileFieldPreview />
              <ProfileFieldPreview />
            </div>

            <div className="rounded-xl border border-border bg-secondary px-4 py-3">
              <LoadingSkeleton className="h-3 w-28" />
              <LoadingSkeleton className="mt-3 h-4 w-full max-w-[16rem]" />
            </div>

            <ProfileFieldPreview fullWidth multiline showCounter />

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileFieldPreview />
              <ProfileFieldPreview showHint={false} />
            </div>
          </div>

          <div className="space-y-4">
            <LoadingSkeleton className="h-5 w-32" />
            <LoadingSkeleton className="h-4 w-full max-w-[24rem]" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <ProfileFieldPreview key={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex w-28 shrink-0 flex-col items-center gap-2">
                <LoadingSkeleton className="h-28 w-28 rounded-xl" />
                <LoadingSkeleton className="h-3 w-20" />
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-28" />
                  <LoadingSkeleton className="h-4 w-full max-w-[18rem]" />
                  <LoadingSkeleton className="h-4 w-full max-w-[16rem]" />
                </div>
                <LoadingSkeleton className="h-3 w-full max-w-[18rem]" />
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <LoadingSkeleton className="h-9 w-36 rounded-xl" />
                  <LoadingSkeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted p-4">
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="mt-2 h-3 w-40" />
            <LoadingSkeleton className="mt-4 h-40 w-full rounded-2xl" />
            <div className="mt-3 space-y-2">
              <LoadingSkeleton className="h-3 w-full max-w-[16rem]" />
              <LoadingSkeleton className="h-3 w-full max-w-[18rem]" />
              <LoadingSkeleton className="h-4 w-32" />
              {!hasPublicProfile ? <LoadingSkeleton className="h-4 w-40" /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileFooterSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full max-w-[22rem]" />
        <LoadingSkeleton className="h-4 w-40" />
      </div>
      <LoadingSkeleton className="h-10 w-40 rounded-xl" />
    </div>
  );
}

function ProfilePreview({
  hasPublicProfile = false,
}: {
  hasPublicProfile?: boolean;
}) {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator Profile"
        description="Build the public identity learners see across your creator page and resource listings."
        actions={
          <div className="ml-auto flex shrink-0 flex-col items-end justify-end gap-2 self-end text-right">
            <span className="inline-flex items-center gap-2 self-end text-sm font-medium text-muted-foreground">
              View public profile
            </span>
            {!hasPublicProfile ? (
              <p className="max-w-xs text-xs text-muted-foreground">
                Save a creator slug to unlock your public profile page.
              </p>
            ) : null}
          </div>
        }
      />

      <ProfileMainPanelSkeleton hasPublicProfile={hasPublicProfile} />
      <ProfileFooterSkeleton />
    </DashboardPageStack>
  );
}

export function CreatorDashboardOverviewLoadingShell() {
  return dashboardRuntimeShell(
    <OverviewPreview />,
    "creator-dashboard-overview",
  );
}

export function CreatorDashboardOverviewResultsSkeleton() {
  return (
    <DashboardPageStack>
      <OverviewResultsPreviewContent />
    </DashboardPageStack>
  );
}

export function CreatorDashboardOverviewBonesPreview() {
  return dashboardBonesPreview(
    CREATOR_DASHBOARD_OVERVIEW_NAME,
    <OverviewPreview />,
  );
}

export function CreatorDashboardAnalyticsLoadingShell() {
  return dashboardRuntimeShell(
    <AnalyticsPreview />,
    "creator-dashboard-analytics",
  );
}

export function CreatorDashboardAnalyticsResultsSkeleton({
  seriesRowCount = 8,
  resourceReviewRowCount = 8,
  recentReviewsRowCount = 4,
  recentActivityRowCount = 6,
}: {
  seriesRowCount?: number;
  resourceReviewRowCount?: number;
  recentReviewsRowCount?: number;
  recentActivityRowCount?: number;
} = {}) {
  return (
    <DashboardPageStack>
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <ReviewSummaryCardRow />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsSeriesTablePreview rowCount={seriesRowCount} />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <AnalyticsTopListPanelPreview key={index} />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsRatingsTablePreview rowCount={resourceReviewRowCount} />
        <AnalyticsRecentReviewsPreview rowCount={recentReviewsRowCount} />
        <AnalyticsDistributionPreview />
        <AnalyticsSalesActivityPreview rowCount={recentActivityRowCount} />
        <AnalyticsDownloadsActivityPreview rowCount={recentActivityRowCount} />
      </div>
      <AnalyticsNextActionPreview />
    </DashboardPageStack>
  );
}

export function CreatorDashboardAnalyticsBonesPreview({
  seriesRowCount = 8,
  resourceReviewRowCount = 8,
  recentReviewsRowCount = 4,
  recentActivityRowCount = 6,
}: {
  seriesRowCount?: number;
  resourceReviewRowCount?: number;
  recentReviewsRowCount?: number;
  recentActivityRowCount?: number;
} = {}) {
  return dashboardBonesPreview(
    CREATOR_DASHBOARD_ANALYTICS_NAME,
    <AnalyticsPreview
      seriesRowCount={seriesRowCount}
      resourceReviewRowCount={resourceReviewRowCount}
      recentReviewsRowCount={recentReviewsRowCount}
      recentActivityRowCount={recentActivityRowCount}
    />,
  );
}

export function CreatorDashboardResourcesLoadingShell() {
  return dashboardRuntimeShell(
    <ResourcesPreview />,
    "creator-dashboard-resources",
  );
}

export function CreatorDashboardResourcesResultsSkeleton({
  rowCount = 9,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return (
    <DashboardPageStack>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="mt-3 h-8 w-20" />
            <LoadingSkeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-10 w-40 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-3 w-20" />
        </div>
        {variant === "empty" ? (
          <CreatorResourcesEmptyStatePreview />
        ) : (
          <CreatorResourcesTablePreview rowCount={rowCount} />
        )}
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton className="mt-2 h-3 w-full max-w-[32rem]" />
        <LoadingSkeleton className="mt-1.5 h-3 w-64 max-w-full" />
        <LoadingSkeleton className="mt-3 h-4 w-32" />
      </div>
    </DashboardPageStack>
  );
}

export function CreatorDashboardResourcesBonesPreview({
  rowCount = 9,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return dashboardBonesPreview(
    CREATOR_DASHBOARD_RESOURCES_NAME,
    <ResourcesPreview rowCount={rowCount} variant={variant} />,
  );
}

export function CreatorDashboardSalesLoadingShell() {
  return dashboardRuntimeShell(
    <SalesPreviewWithVariant />,
    "creator-dashboard-sales",
  );
}

export function CreatorDashboardSalesResultsSkeleton({
  rowCount = 5,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return (
    <DashboardPageStack>
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      {variant === "empty" ? (
        <SalesEmptyStatePreview />
      ) : (
        <TableShell titleWidth="w-28" rows={rowCount} columns="grid-cols-[2fr_1.2fr_1fr_1fr]" />
      )}
    </DashboardPageStack>
  );
}

export function CreatorDashboardSalesBonesPreview({
  rowCount = 5,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return dashboardBonesPreview(
    CREATOR_DASHBOARD_SALES_NAME,
    <SalesPreviewWithVariant rowCount={rowCount} variant={variant} />,
  );
}

export function CreatorDashboardProfileLoadingShell() {
  return dashboardRuntimeShell(
    <ProfilePreview />,
    "creator-dashboard-profile",
  );
}

export function CreatorDashboardProfileFormSkeleton() {
  return (
    <DashboardPageStack>
      <ProfileMainPanelSkeleton />
      <ProfileFooterSkeleton />
    </DashboardPageStack>
  );
}

export function CreatorDashboardProfileLinkFallback() {
  return (
    <div className="ml-auto flex shrink-0 flex-col items-end justify-end gap-2 self-end text-right">
      <span className="inline-flex items-center gap-2 self-end text-sm font-medium text-muted-foreground/60">
        View public profile
      </span>
      <p className="max-w-xs text-xs text-muted-foreground">
        Loading your public creator link…
      </p>
    </div>
  );
}

export function CreatorDashboardProfileBonesPreview({
  hasPublicProfile = false,
}: {
  hasPublicProfile?: boolean;
} = {}) {
  return dashboardBonesPreview(
    CREATOR_DASHBOARD_PROFILE_NAME,
    <ProfilePreview hasPublicProfile={hasPublicProfile} />,
  );
}
