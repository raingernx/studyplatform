"use client";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageStack } from "@/components/dashboard/DashboardPageShell";
import {
  LibraryEmptyStatePreview,
  LibraryGridCardPreview,
  LibraryToolsPreview,
  PurchaseRecoveryPreview,
} from "@/components/skeletons/dashboard-user/shared";
import {
  dashboardBonesPreview,
  dashboardRuntimeShell,
} from "@/components/skeletons/dashboard-loading-contract";

const DASHBOARD_LIBRARY_NAME = "dashboard-library";

function DashboardLibraryPreview({
  variant = "populated",
}: {
  variant?: "populated" | "empty";
}) {
  if (variant === "empty") {
    return (
      <DashboardPageStack>
        <DashboardPageHeaderSkeleton
          titleWidth="w-44"
          descriptionWidth="w-[34rem]"
        />
        <LibraryEmptyStatePreview />
      </DashboardPageStack>
    );
  }

  return (
    <DashboardPageStack>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-2.5">
          <DashboardPageHeaderSkeleton
            titleWidth="w-44"
            descriptionWidth="w-[34rem]"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3.5">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="mt-3 h-5 w-40" />
          <LoadingSkeleton className="mt-2 h-3 w-24" />
          <LoadingSkeleton className="mt-4 h-10 w-36 rounded-xl" />
        </div>
      </section>

      <LibraryToolsPreview />

      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <LibraryGridCardPreview key={index} />
        ))}
      </div>
    </DashboardPageStack>
  );
}

export function DashboardLibraryBonesPreview({
  variant = "populated",
}: {
  variant?: "populated" | "empty";
} = {}) {
  return dashboardBonesPreview(
    DASHBOARD_LIBRARY_NAME,
    <DashboardLibraryPreview variant={variant} />,
  );
}

export function DashboardLibraryEmptyBonesPreview() {
  return dashboardBonesPreview(
    `${DASHBOARD_LIBRARY_NAME}-empty`,
    <DashboardLibraryPreview variant="empty" />,
  );
}

export function DashboardLibrarySkeleton() {
  return dashboardRuntimeShell(<DashboardLibraryPreview />, "dashboard-library");
}

export function DashboardLibraryResultsSkeleton({
  reserveRecovery = false,
  variant = "populated",
}: {
  reserveRecovery?: boolean;
  variant?: "populated" | "empty";
} = {}) {
  if (variant === "empty") {
    return (
      <DashboardPageStack data-loading-scope="dashboard-library-results">
        <LibraryEmptyStatePreview />
      </DashboardPageStack>
    );
  }

  return (
    <DashboardPageStack data-loading-scope="dashboard-library-results">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3.5">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="mt-3 h-5 w-40" />
          <LoadingSkeleton className="mt-2 h-3 w-24" />
          <LoadingSkeleton className="mt-4 h-10 w-36 rounded-xl" />
        </div>
      </section>

      {reserveRecovery ? <PurchaseRecoveryPreview /> : null}

      <LibraryToolsPreview />

      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <LibraryGridCardPreview key={index} />
        ))}
      </div>
    </DashboardPageStack>
  );
}
