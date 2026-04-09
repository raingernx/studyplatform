"use client";

import type { ReactNode } from "react";
import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const DASHBOARD_OVERVIEW_NAME = "dashboard-overview";
const DASHBOARD_LIBRARY_NAME = "dashboard-library";
const DASHBOARD_DOWNLOADS_NAME = "dashboard-downloads";
const DASHBOARD_PURCHASES_NAME = "dashboard-purchases";
const DASHBOARD_SUBSCRIPTION_NAME = "dashboard-subscription";
const DASHBOARD_RESOURCES_REDIRECT_NAME = "dashboard-resources-redirect";

function SectionTitle({
  titleWidth = "w-48",
  copyWidth = "w-[32rem]",
}: {
  titleWidth?: string;
  copyWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
      <LoadingSkeleton className={`h-4 ${copyWidth}`} />
    </div>
  );
}

function SmallCardPreview() {
  return (
    <div className="space-y-1.5">
      <LoadingSkeleton className="h-8 w-8 rounded-lg" />
      <LoadingSkeleton className="h-7 w-20" />
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-3 w-20" />
    </div>
  );
}

function ShelfCardPreview() {
  return (
    <div className="flex h-[248px] w-[220px] flex-shrink-0 flex-col rounded-xl border border-border bg-card p-3.5">
      <LoadingSkeleton className="h-[120px] w-full rounded-lg" />
      <div className="mt-3 space-y-2">
        <LoadingSkeleton className="h-4 w-4/5" />
        <LoadingSkeleton className="h-4 w-2/3" />
        <LoadingSkeleton className="h-3 w-1/2" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <LoadingSkeleton className="h-4 w-16" />
        <LoadingSkeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

function OverviewListRowPreview() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <LoadingSkeleton className="h-11 w-11 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <LoadingSkeleton className="h-4 w-4/5" />
        <LoadingSkeleton className="h-3 w-1/2" />
      </div>
      <LoadingSkeleton className="h-4 w-14" />
    </div>
  );
}

function OverviewSidebarPreview() {
  return (
    <aside className="rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <LoadingSkeleton className="h-3 w-14" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
          <div className="flex items-start gap-3">
            <LoadingSkeleton className="h-11 w-11 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-3 w-1/2" />
            </div>
          </div>
          <LoadingSkeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="space-y-1">
            <LoadingSkeleton className="h-3 w-14" />
            <LoadingSkeleton className="h-4 w-52" />
          </div>
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-3 w-40" />
          <LoadingSkeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <LoadingSkeleton className="h-3 w-20" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <LoadingSkeleton className="h-4 w-4 rounded" />
                  <LoadingSkeleton className="h-4 w-20" />
                </div>
                <LoadingSkeleton className="h-4 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function LibraryToolsPreview() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-caption">
          <LoadingSkeleton className="h-4 w-7" />
          <LoadingSkeleton className="h-4 w-12" />
          <LoadingSkeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <LoadingSkeleton className="h-11 min-w-0 flex-1 rounded-xl" />
        <div className="flex flex-wrap items-center gap-1.5">
          <LoadingSkeleton className="h-4 w-12 rounded-full" />
          <LoadingSkeleton className="h-8 w-14 rounded-full" />
          <LoadingSkeleton className="h-8 w-12 rounded-full" />
          <LoadingSkeleton className="h-8 w-24 rounded-full" />
          <LoadingSkeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function LibraryGridCardPreview() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-card">
      <LoadingSkeleton className="aspect-[4/3] w-full rounded-t-xl rounded-b-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-2">
          <LoadingSkeleton className="h-4 w-4/5" />
          <LoadingSkeleton className="h-4 w-2/3" />
          <LoadingSkeleton className="h-3 w-1/2" />
        </div>

        <div className="space-y-2 border-t border-border-subtle pt-3">
          <LoadingSkeleton className="h-3 w-32" />
        </div>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <LoadingSkeleton className="h-9 flex-1 rounded-lg" />
            <LoadingSkeleton className="h-9 flex-1 rounded-lg" />
            <LoadingSkeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TableHeaderPreview({
  widths,
}: {
  widths: string[];
}) {
  return (
    <div className="grid gap-4 border-b border-border bg-muted/70 px-6 py-3" style={{ gridTemplateColumns: widths.join(" ") }}>
      {widths.map((_, index) => (
        <LoadingSkeleton key={index} className="h-3 w-20" />
      ))}
    </div>
  );
}

function DownloadsTableRowsPreview() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-[2fr_1fr_140px_100px_100px] items-center gap-4 px-6 py-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LoadingSkeleton className="h-9 w-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-12" />
          <LoadingSkeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function PurchasesTableRowsPreview() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-[2fr_1fr_120px_120px_100px] items-center gap-4 px-6 py-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LoadingSkeleton className="h-9 w-9 rounded-xl" />
            <div className="min-w-0 flex-1">
              <LoadingSkeleton className="h-4 w-4/5" />
            </div>
          </div>
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-14" />
          <LoadingSkeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DashboardOverviewPreview() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionTitle titleWidth="w-64" copyWidth="w-[34rem]" />
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
      </section>
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
    </div>
  );
}

function DashboardLibraryPreview() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-2.5">
          <SectionTitle titleWidth="w-44" copyWidth="w-[34rem]" />
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
    </div>
  );
}

function DashboardDownloadsPreview() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionTitle titleWidth="w-56" copyWidth="w-[34rem]" />
        <LoadingSkeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview widths={["2fr", "1fr", "140px", "100px", "100px"]} />
        <DownloadsTableRowsPreview />
      </div>
    </div>
  );
}

function DashboardPurchasesPreview() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionTitle titleWidth="w-48" copyWidth="w-[28rem]" />
        <div className="space-y-2">
          <LoadingSkeleton className="ml-auto h-3 w-16" />
          <LoadingSkeleton className="ml-auto h-7 w-24" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview widths={["2fr", "1fr", "120px", "120px", "100px"]} />
        <PurchasesTableRowsPreview />
        <div className="flex items-center justify-between border-t border-border bg-muted/70 px-6 py-3">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

function DashboardSubscriptionPreview() {
  return (
    <div className="space-y-8">
      <SectionTitle titleWidth="w-48" copyWidth="w-[28rem]" />
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="mt-3 h-8 w-48" />
          <LoadingSkeleton className="mt-2 h-4 w-[24rem]" />
          <LoadingSkeleton className="mt-6 h-12 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
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
    </div>
  );
}

function DashboardResourcesRedirectPreview() {
  return (
    <div className="space-y-6">
      <SectionTitle titleWidth="w-52" copyWidth="w-[26rem]" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="mt-3 h-4 w-[28rem]" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <LoadingSkeleton className="h-28 rounded-2xl" />
          <LoadingSkeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function previewSkeleton(name: string, preview: ReactNode) {
  return (
    <Skeleton name={name} loading={false} className="w-full">
      {preview}
    </Skeleton>
  );
}

function runtimeSkeleton(preview: ReactNode, scope: string) {
  return <div data-loading-scope={scope}>{preview}</div>;
}

export function DashboardOverviewBonesPreview() {
  return previewSkeleton(DASHBOARD_OVERVIEW_NAME, <DashboardOverviewPreview />);
}

export function DashboardOverviewSkeleton() {
  return runtimeSkeleton(<DashboardOverviewPreview />, "dashboard-overview");
}

export function DashboardLibraryBonesPreview() {
  return previewSkeleton(DASHBOARD_LIBRARY_NAME, <DashboardLibraryPreview />);
}

export function DashboardLibrarySkeleton() {
  return runtimeSkeleton(<DashboardLibraryPreview />, "dashboard-library");
}

export function DashboardLibraryResultsSkeleton() {
  return (
    <div data-loading-scope="dashboard-library-results" className="space-y-5">
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

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="mt-2 h-3 w-56" />
        <LoadingSkeleton className="mt-2 h-9 w-24 rounded-lg" />
      </div>

      <LibraryToolsPreview />

      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <LibraryGridCardPreview key={index} />
        ))}
      </div>
    </div>
  );
}

export function DashboardDownloadsBonesPreview() {
  return previewSkeleton(DASHBOARD_DOWNLOADS_NAME, <DashboardDownloadsPreview />);
}

export function DashboardDownloadsSkeleton() {
  return runtimeSkeleton(<DashboardDownloadsPreview />, "dashboard-downloads");
}

export function DashboardDownloadsResultsSkeleton() {
  return runtimeSkeleton(
    <div className="space-y-4">
      <div className="flex justify-start">
        <LoadingSkeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview widths={["2fr", "1fr", "140px", "100px", "100px"]} />
        <DownloadsTableRowsPreview />
      </div>
    </div>,
    "dashboard-downloads-results",
  );
}

export function DashboardPurchasesBonesPreview() {
  return previewSkeleton(DASHBOARD_PURCHASES_NAME, <DashboardPurchasesPreview />);
}

export function DashboardPurchasesSkeleton() {
  return runtimeSkeleton(<DashboardPurchasesPreview />, "dashboard-purchases");
}

export function DashboardPurchasesResultsSkeleton() {
  return runtimeSkeleton(
    <div className="space-y-4">
      <div className="hidden justify-end sm:flex">
        <div className="space-y-2">
          <LoadingSkeleton className="ml-auto h-3 w-16" />
          <LoadingSkeleton className="ml-auto h-7 w-24" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <TableHeaderPreview widths={["2fr", "1fr", "120px", "120px", "100px"]} />
        <PurchasesTableRowsPreview />
        <div className="flex items-center justify-between border-t border-border bg-muted/70 px-6 py-3">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
    </div>,
    "dashboard-purchases-results",
  );
}

export function DashboardSubscriptionBonesPreview() {
  return previewSkeleton(DASHBOARD_SUBSCRIPTION_NAME, <DashboardSubscriptionPreview />);
}

export function DashboardSubscriptionSkeleton() {
  return runtimeSkeleton(<DashboardSubscriptionPreview />, "dashboard-subscription");
}

export function DashboardSubscriptionResultsSkeleton() {
  return runtimeSkeleton(
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-blue-500 p-6 text-white shadow-glow-violet">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-24 rounded-full bg-white/15" />
            <LoadingSkeleton className="h-8 w-52 rounded-xl bg-white/15" />
            <LoadingSkeleton className="h-4 w-72 max-w-full rounded-xl bg-white/10" />
          </div>
          <LoadingSkeleton className="h-12 w-12 rounded-2xl bg-white/15" />
        </div>
        <div className="relative mt-6 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
          <LoadingSkeleton className="h-3 w-20 rounded-full bg-white/15" />
          <LoadingSkeleton className="h-4 w-24 rounded-full bg-white/15" />
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
    </div>,
    "dashboard-subscription-results",
  );
}

export function DashboardResourcesRedirectBonesPreview() {
  return previewSkeleton(
    DASHBOARD_RESOURCES_REDIRECT_NAME,
    <DashboardResourcesRedirectPreview />,
  );
}

export function DashboardResourcesRedirectSkeleton() {
  return runtimeSkeleton(<DashboardResourcesRedirectPreview />, "dashboard-resources-redirect");
}

export function DashboardRouteRedirectSkeleton() {
  return runtimeSkeleton(<DashboardResourcesRedirectPreview />, "dashboard-route-redirect");
}
