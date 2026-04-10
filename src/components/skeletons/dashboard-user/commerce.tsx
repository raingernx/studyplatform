"use client";

import { Check, CreditCard, Sparkles } from "lucide-react";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  DashboardPageHeader,
  DashboardPageHeaderSkeleton,
} from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageStack } from "@/components/dashboard/DashboardPageShell";
import {
  DownloadsEmptyStatePreview,
  DownloadsSummaryPreview,
  DownloadsTableRowsPreview,
  PurchasesEmptyStatePreview,
  PurchasesTableRowsPreview,
  TableHeaderPreview,
} from "@/components/skeletons/dashboard-user/shared";
import {
  dashboardBonesPreview,
  dashboardRuntimeShell,
} from "@/components/skeletons/dashboard-loading-contract";

const DASHBOARD_DOWNLOADS_NAME = "dashboard-downloads";
const DASHBOARD_PURCHASES_NAME = "dashboard-purchases";
const DASHBOARD_SUBSCRIPTION_NAME = "dashboard-subscription";
const DASHBOARD_RESOURCES_REDIRECT_NAME = "dashboard-resources-redirect";

function DashboardDownloadsPreview({
  variant = "populated",
  rowCount = 8,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
}) {
  return (
    <DashboardPageStack>
      <DashboardPageHeader
        title="Download history"
        description="Files you've actually downloaded. Re-download any owned resource from your library any time."
      />
      {variant === "empty" ? (
        <DownloadsEmptyStatePreview />
      ) : (
        <>
          <DownloadsSummaryPreview rowCount={rowCount} />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <TableHeaderPreview
              widths={["2fr", "1fr", "140px", "100px", "100px"]}
            />
            <DownloadsTableRowsPreview rowCount={rowCount} />
          </div>
        </>
      )}
    </DashboardPageStack>
  );
}

function DashboardDownloadsRouteShellPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton
        titleWidth="w-56"
        descriptionWidth="w-[34rem]"
      />
    </DashboardPageStack>
  );
}

function DashboardDownloadsResultsPreview({
  variant = "populated",
  rowCount = 8,
  loadingScope,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
  loadingScope?: string;
}) {
  if (variant === "empty") {
    return (
      <DashboardPageStack data-loading-scope={loadingScope}>
        <DownloadsEmptyStatePreview />
      </DashboardPageStack>
    );
  }

  return (
    <DashboardPageStack data-loading-scope={loadingScope}>
      <DownloadsSummaryPreview rowCount={rowCount} />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview
          widths={["2fr", "1fr", "140px", "100px", "100px"]}
        />
        <DownloadsTableRowsPreview rowCount={rowCount} />
      </div>
    </DashboardPageStack>
  );
}

function DashboardPurchasesPreview({
  variant = "populated",
  rowCount = 8,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
}) {
  return (
    <DashboardPageStack>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DashboardPageHeader
          title="Purchases"
          description="Your complete order history on Krukraft."
        />
        <div className="space-y-2">
          <LoadingSkeleton className="ml-auto h-3 w-16" />
          <LoadingSkeleton className="ml-auto h-7 w-24" />
        </div>
      </div>
      {variant === "empty" ? (
        <PurchasesEmptyStatePreview />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <TableHeaderPreview
            widths={["2fr", "1fr", "120px", "120px", "100px"]}
          />
          <PurchasesTableRowsPreview rowCount={rowCount} />
          <div className="flex items-center justify-between border-t border-border bg-muted/70 px-6 py-3">
            <LoadingSkeleton className="h-3 w-20" />
            <LoadingSkeleton className="h-4 w-24" />
          </div>
        </div>
      )}
    </DashboardPageStack>
  );
}

function DashboardPurchasesRouteShellPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton
        titleWidth="w-48"
        descriptionWidth="w-[28rem]"
      />
    </DashboardPageStack>
  );
}

function DashboardPurchasesResultsPreview({
  variant = "populated",
  rowCount = 8,
  loadingScope,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
  loadingScope?: string;
}) {
  if (variant === "empty") {
    return (
      <DashboardPageStack data-loading-scope={loadingScope}>
        <PurchasesEmptyStatePreview />
      </DashboardPageStack>
    );
  }

  return (
    <DashboardPageStack data-loading-scope={loadingScope}>
      <div className="hidden flex-col items-end gap-0.5 sm:flex">
        <LoadingSkeleton className="ml-auto h-3 w-16" />
        <LoadingSkeleton className="ml-auto h-7 w-24" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview
          widths={["2fr", "1fr", "120px", "120px", "100px"]}
        />
        <PurchasesTableRowsPreview rowCount={rowCount} />
        <div className="flex items-center justify-between border-t border-border bg-muted/70 px-6 py-3">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
    </DashboardPageStack>
  );
}

function DashboardSubscriptionPreview({
  planVariant = "unknown",
}: {
  planVariant?: "active" | "free" | "unknown";
}) {
  if (planVariant === "free") {
    return (
      <DashboardPageStack>
        <DashboardPageHeader
          title="Membership"
          description="Manage your plan and unlock full access to Krukraft."
        />
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    Free Plan
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Purchase resources individually.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                Current plan
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-100/40" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <span className="text-[13px] font-bold text-violet-700">
                  Pro Plan
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                Unlock everything
              </h2>
              <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
                Get unlimited access to every resource, plus priority support and
                early content drops.
              </p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Unlimited resource access",
                  "Unlimited downloads",
                  "Early access to new content",
                  "Priority support",
                ].map((label) => (
                  <li
                    key={label}
                    className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-3 ring-1 ring-white/80"
                  >
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        Loading benefit details.
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  disabled
                  className="cursor-not-allowed rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background opacity-60"
                >
                  Upgrade to Pro (soon)
                </button>
                <span className="text-[12px] text-muted-foreground">
                  Payments and billing portal are being finalized.
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardPageStack>
    );
  }

  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton
        titleWidth="w-48"
        descriptionWidth="w-[28rem]"
      />
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="mt-3 h-8 w-48" />
          <LoadingSkeleton className="mt-2 h-4 w-[24rem]" />
          <LoadingSkeleton className="mt-6 h-12 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="mt-3 h-8 w-20" />
              <LoadingSkeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <LoadingSkeleton className="h-5 w-32" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <LoadingSkeleton className="h-8 w-8 rounded-xl" />
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-40" />
                  <LoadingSkeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardPageStack>
  );
}

function DashboardSubscriptionRouteShellPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton titleWidth="w-48" descriptionWidth="w-[28rem]" />
    </DashboardPageStack>
  );
}

function DashboardResourcesRedirectPreview() {
  return (
    <DashboardPageStack className="space-y-6">
      <DashboardPageHeaderSkeleton
        titleWidth="w-52"
        descriptionWidth="w-[26rem]"
      />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="mt-3 h-4 w-[28rem]" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <LoadingSkeleton className="h-28 rounded-2xl" />
          <LoadingSkeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </DashboardPageStack>
  );
}

export function DashboardDownloadsBonesPreview({
  variant = "populated",
  rowCount = 8,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
} = {}) {
  return dashboardBonesPreview(
    DASHBOARD_DOWNLOADS_NAME,
    <DashboardDownloadsPreview variant={variant} rowCount={rowCount} />,
  );
}

export function DashboardDownloadsSkeleton() {
  return dashboardRuntimeShell(
    <DashboardDownloadsRouteShellPreview />,
    "dashboard-downloads",
  );
}

export function DashboardDownloadsResultsSkeleton({
  rowCount = 8,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return (
    <DashboardDownloadsResultsPreview
      variant={variant}
      rowCount={rowCount}
      loadingScope="dashboard-downloads-results"
    />
  );
}

export function DashboardPurchasesBonesPreview({
  variant = "populated",
  rowCount = 8,
}: {
  variant?: "populated" | "empty";
  rowCount?: number;
} = {}) {
  return dashboardBonesPreview(
    DASHBOARD_PURCHASES_NAME,
    <DashboardPurchasesPreview variant={variant} rowCount={rowCount} />,
  );
}

export function DashboardPurchasesSkeleton() {
  return dashboardRuntimeShell(
    <DashboardPurchasesRouteShellPreview />,
    "dashboard-purchases",
  );
}

export function DashboardPurchasesResultsSkeleton({
  rowCount = 8,
  variant = "populated",
}: {
  rowCount?: number;
  variant?: "populated" | "empty";
} = {}) {
  return (
    <DashboardPurchasesResultsPreview
      variant={variant}
      rowCount={rowCount}
      loadingScope="dashboard-purchases-results"
    />
  );
}

export function DashboardSubscriptionBonesPreview({
  planVariant = "unknown",
}: {
  planVariant?: "active" | "free" | "unknown";
} = {}) {
  return dashboardBonesPreview(
    DASHBOARD_SUBSCRIPTION_NAME,
    <DashboardSubscriptionPreview planVariant={planVariant} />,
    { width: "narrow" },
  );
}

export function DashboardSubscriptionSkeleton() {
  return dashboardRuntimeShell(
    <DashboardSubscriptionPreview />,
    "dashboard-subscription",
    { width: "narrow" },
  );
}

export function DashboardSubscriptionRouteShellSkeleton() {
  return dashboardRuntimeShell(
    <DashboardSubscriptionRouteShellPreview />,
    "dashboard-subscription",
    { width: "narrow" },
  );
}

export function DashboardSubscriptionResultsSkeleton({
  planVariant = "unknown",
}: {
  planVariant?: "active" | "free" | "unknown";
} = {}) {
  return (
    <DashboardPageStack
      className="space-y-5"
      data-loading-scope="dashboard-subscription-results"
    >
      {planVariant === "free" ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LoadingSkeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-3 w-36" />
                </div>
              </div>
              <LoadingSkeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6">
            <LoadingSkeleton className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-100/40" />
            <div className="relative space-y-2">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-8 w-64 max-w-full" />
              <LoadingSkeleton className="h-4 w-full max-w-[34rem]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white/80 px-3 py-3 ring-1 ring-white/80"
                >
                  <div className="flex items-start gap-2">
                    <LoadingSkeleton className="mt-0.5 h-4 w-4 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <LoadingSkeleton className="h-4 w-36 max-w-full" />
                      <LoadingSkeleton className="h-3 w-full max-w-[15rem]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LoadingSkeleton className="h-10 w-40 rounded-xl" />
              <LoadingSkeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-24 rounded-full" />
                <LoadingSkeleton className="h-8 w-52 rounded-xl" />
                <LoadingSkeleton className="h-4 w-72 max-w-full rounded-xl" />
              </div>
              <LoadingSkeleton className="h-12 w-12 rounded-2xl" />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/60 px-4 py-3">
              <LoadingSkeleton className="h-3 w-20 rounded-full" />
              <LoadingSkeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="mt-3 h-9 w-16" />
              <LoadingSkeleton className="mt-2 h-4 w-28" />
              <LoadingSkeleton className="mt-3 h-4 w-24" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <LoadingSkeleton className="h-3 w-14" />
              <LoadingSkeleton className="mt-3 h-7 w-24" />
              <LoadingSkeleton className="mt-2 h-4 w-28" />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <LoadingSkeleton className="h-5 w-28" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <LoadingSkeleton className="h-8 w-8 rounded-xl" />
                  <div className="space-y-1.5">
                    <LoadingSkeleton className="h-4 w-40" />
                    <LoadingSkeleton className="h-3 w-72 max-w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="h-4 w-56 max-w-full" />
              </div>
              <LoadingSkeleton className="h-9 w-36 rounded-xl" />
            </div>
          </div>
        </>
      )}
    </DashboardPageStack>
  );
}

export function DashboardResourcesRedirectBonesPreview() {
  return dashboardBonesPreview(
    DASHBOARD_RESOURCES_REDIRECT_NAME,
    <DashboardResourcesRedirectPreview />,
  );
}

export function DashboardResourcesRedirectSkeleton() {
  return dashboardRuntimeShell(
    <DashboardResourcesRedirectPreview />,
    "dashboard-resources-redirect",
  );
}

export function DashboardRouteRedirectSkeleton() {
  return dashboardRuntimeShell(
    <DashboardResourcesRedirectPreview />,
    "dashboard-route-redirect",
  );
}
