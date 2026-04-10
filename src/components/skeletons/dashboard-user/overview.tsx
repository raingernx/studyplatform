"use client";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageStack } from "@/components/dashboard/DashboardPageShell";
import {
  OverviewListRowPreview,
  OverviewSidebarPreview,
  ShelfCardPreview,
  SmallCardPreview,
} from "@/components/skeletons/dashboard-user/shared";
import {
  dashboardBonesPreview,
  dashboardRuntimeShell,
} from "@/components/skeletons/dashboard-loading-contract";

const DASHBOARD_OVERVIEW_NAME = "dashboard-overview";

function DashboardOverviewResultsPreviewContent() {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <div className="rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SmallCardPreview key={index} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3.5 sm:px-6">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="mt-3 h-6 w-48" />
          <LoadingSkeleton className="mt-2 h-4 w-full" />
          <LoadingSkeleton className="mt-4 h-10 w-32 rounded-xl" />
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div className="space-y-1">
              <LoadingSkeleton className="h-4 w-48" />
              <LoadingSkeleton className="h-3 w-72" />
            </div>
            <LoadingSkeleton className="h-4 w-14" />
          </div>

          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <OverviewListRowPreview key={index} />
            ))}
          </div>
        </div>

        <OverviewSidebarPreview />
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <LoadingSkeleton className="h-4 w-40" />
            <LoadingSkeleton className="h-3 w-[28rem]" />
          </div>
          <LoadingSkeleton className="h-4 w-12" />
        </div>
        <div className="flex gap-3.5 overflow-hidden pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ShelfCardPreview key={index} />
          ))}
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <LoadingSkeleton className="h-4 w-36" />
            <LoadingSkeleton className="h-3 w-[30rem]" />
          </div>
          <LoadingSkeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
          {Array.from({ length: 4 }).map((_, index) => (
            <ShelfCardPreview key={index} />
          ))}
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <LoadingSkeleton className="h-4 w-44" />
            <LoadingSkeleton className="h-3 w-[26rem]" />
          </div>
          <LoadingSkeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3.5 overflow-hidden pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ShelfCardPreview key={index} />
          ))}
        </div>
      </section>
    </>
  );
}

function DashboardOverviewPreview() {
  return (
    <DashboardPageStack>
      <section className="space-y-4">
        <DashboardPageHeaderSkeleton
          titleWidth="w-64"
          descriptionWidth="w-[34rem]"
        />
        <DashboardOverviewResultsPreviewContent />
      </section>
    </DashboardPageStack>
  );
}

export function DashboardOverviewBonesPreview() {
  return dashboardBonesPreview(DASHBOARD_OVERVIEW_NAME, <DashboardOverviewPreview />);
}

export function DashboardOverviewSkeleton() {
  return dashboardRuntimeShell(
    <DashboardOverviewPreview />,
    "dashboard-overview",
  );
}

export function DashboardOverviewResultsSkeleton() {
  return (
    <DashboardPageStack data-loading-scope="dashboard-overview-results">
      <DashboardOverviewResultsPreviewContent />
    </DashboardPageStack>
  );
}
