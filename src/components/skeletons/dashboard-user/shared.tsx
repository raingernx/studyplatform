"use client";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function SmallCardPreview() {
  return (
    <div className="space-y-1.5">
      <LoadingSkeleton className="h-8 w-8 rounded-lg" />
      <LoadingSkeleton className="h-7 w-20" />
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-3 w-20" />
    </div>
  );
}

export function ShelfCardPreview() {
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

export function OverviewListRowPreview() {
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

export function OverviewSidebarPreview() {
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

export function LibraryToolsPreview() {
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
          <LoadingSkeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LibraryGridCardPreview() {
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
          <div className="mt-2.5 flex items-center gap-1.5">
            <LoadingSkeleton className="h-3 w-20" />
            <LoadingSkeleton className="h-3 w-2 rounded-full" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibraryEmptyStatePreview() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <LoadingSkeleton className="h-12 w-12 rounded-2xl" />
      <LoadingSkeleton className="mt-4 h-5 w-40" />
      <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
      <LoadingSkeleton className="mt-1.5 h-4 w-64 max-w-full" />
      <LoadingSkeleton className="mt-5 h-10 w-44 rounded-xl" />
    </div>
  );
}

export function PurchaseRecoveryPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
      <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-100 px-5 py-2">
        <LoadingSkeleton className="h-2 w-2 rounded-full" />
        <LoadingSkeleton className="h-3 w-28" />
      </div>
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <LoadingSkeleton className="h-5 w-56 max-w-full" />
          <LoadingSkeleton className="h-3 w-28" />
          <LoadingSkeleton className="h-3 w-40" />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <LoadingSkeleton className="h-10 w-32 rounded-xl" />
          <LoadingSkeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TableHeaderPreview({
  widths,
}: {
  widths: string[];
}) {
  return (
    <div
      className="grid gap-4 border-b border-border bg-muted/70 px-6 py-3"
      style={{ gridTemplateColumns: widths.join(" ") }}
    >
      {widths.map((_, index) => (
        <LoadingSkeleton key={index} className="h-3 w-20" />
      ))}
    </div>
  );
}

export function DownloadsTableRowsPreview({
  rowCount = 8,
}: {
  rowCount?: number;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-[2fr_1fr_140px_100px_100px] items-center gap-4 px-6 py-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LoadingSkeleton className="h-9 w-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <LoadingSkeleton className="h-4 w-4/5" />
              <div className="flex items-center gap-2">
                <LoadingSkeleton className="h-3 w-16" />
                <LoadingSkeleton className="h-4 w-12 rounded-full" />
              </div>
            </div>
          </div>
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-14" />
          <LoadingSkeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function DownloadsSummaryPreview({
  rowCount = 8,
}: {
  rowCount?: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
      <LoadingSkeleton className="h-3.5 w-3.5 rounded-full" />
      <LoadingSkeleton className="h-3.5 w-24" />
      <LoadingSkeleton className="h-3.5 w-10" />
      <LoadingSkeleton className="h-3.5 w-4" />
      <LoadingSkeleton className="h-3.5 w-12" />
      <span className="sr-only">{rowCount} downloads</span>
    </div>
  );
}

export function DownloadsEmptyStatePreview() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-20 shadow-card">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <LoadingSkeleton className="h-14 w-14 rounded-2xl" />
        <LoadingSkeleton className="mt-5 h-5 w-40" />
        <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
        <LoadingSkeleton className="mt-1.5 h-4 w-64 max-w-full" />
        <LoadingSkeleton className="mt-6 h-10 w-44 rounded-xl" />
      </div>
    </div>
  );
}

export function PurchasesTableRowsPreview({
  rowCount = 8,
}: {
  rowCount?: number;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-[2fr_1fr_120px_120px_100px] items-center gap-4 px-6 py-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LoadingSkeleton className="h-9 w-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-3 w-16" />
            </div>
          </div>
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PurchasesEmptyStatePreview() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-20 shadow-card">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <LoadingSkeleton className="h-14 w-14 rounded-2xl" />
        <LoadingSkeleton className="mt-5 h-5 w-40" />
        <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
        <LoadingSkeleton className="mt-1.5 h-4 w-64 max-w-full" />
        <LoadingSkeleton className="mt-6 h-10 w-44 rounded-xl" />
      </div>
    </div>
  );
}
