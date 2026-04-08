"use client";

import { NavbarShell } from "@/components/layout/NavbarShell";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageContainer, PageContentWide } from "@/design-system";

function AdminHeaderSkeleton({
  titleWidth,
  descriptionWidth,
  actions = 0,
}: {
  titleWidth: string;
  descriptionWidth: string;
  actions?: number;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
        <LoadingSkeleton className={`h-4 ${descriptionWidth}`} />
      </div>
      {actions > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actions }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AdminTableShell({
  columns,
  rows,
}: {
  columns: number;
  rows: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div
        className="grid gap-4 border-b border-border bg-muted/70 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid items-center gap-4 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, cellIndex) => (
              <div key={cellIndex} className="space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                {cellIndex === 0 ? <LoadingSkeleton className="h-3 w-3/4" /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminToolbarSkeleton({
  inputs = 3,
  trailingAction = true,
}: {
  inputs?: number;
  trailingAction?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
      {Array.from({ length: inputs }).map((_, index) => (
        <div key={index} className="w-full max-w-xs space-y-1.5">
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      {trailingAction ? (
        <div className="w-full sm:ml-auto sm:w-auto">
          <LoadingSkeleton className="h-10 w-28 rounded-xl" />
        </div>
      ) : null}
    </div>
  );
}

function AdminStatsSkeleton({
  count,
}: {
  count: number;
}) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${count === 4 ? "xl:grid-cols-4 md:grid-cols-2" : "md:grid-cols-3"}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="mt-3 h-8 w-24 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/70 px-4 py-3">
      <LoadingSkeleton className="h-4 w-28" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-9 w-20 rounded-xl" />
        <LoadingSkeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function AdminDashboardLoadingShell() {
  return (
    <div className="space-y-7">
      <AdminHeaderSkeleton
        titleWidth="w-56"
        descriptionWidth="w-[32rem]"
        actions={1}
      />
      <AdminStatsSkeleton count={4} />
      <div className="space-y-3">
        <div className="space-y-2">
          <LoadingSkeleton className="h-8 w-44 rounded-2xl" />
          <LoadingSkeleton className="h-4 w-[28rem]" />
        </div>
        <AdminTableShell columns={5} rows={6} />
      </div>
    </div>
  );
}

export function AdminDashboardRecentActivitySkeleton() {
  return (
    <section className="space-y-3">
      <div>
        <LoadingSkeleton className="h-8 w-44 rounded-2xl" />
        <LoadingSkeleton className="mt-1 h-4 w-[28rem]" />
      </div>
      <AdminTableShell columns={5} rows={6} />
    </section>
  );
}

export function AdminActivityLoadingShell() {
  return (
    <div className="space-y-8">
      <AdminHeaderSkeleton titleWidth="w-44" descriptionWidth="w-64" />
      <AdminToolbarSkeleton inputs={4} trailingAction={false} />
      <AdminTableShell columns={4} rows={6} />
      <PaginationSkeleton />
    </div>
  );
}

export function AdminAuditLoadingShell() {
  return (
    <div className="space-y-8">
      <AdminHeaderSkeleton titleWidth="w-40" descriptionWidth="w-80" />
      <AdminToolbarSkeleton inputs={4} trailingAction={false} />
      <AdminTableShell columns={4} rows={6} />
      <PaginationSkeleton />
    </div>
  );
}

export function AdminCategoriesLoadingShell() {
  return (
    <div className="space-y-8">
      <AdminHeaderSkeleton titleWidth="w-40" descriptionWidth="w-80" actions={1} />
      <AdminTableShell columns={5} rows={6} />
    </div>
  );
}

export function AdminOrdersLoadingShell() {
  return (
    <div className="space-y-8">
      <AdminHeaderSkeleton titleWidth="w-28" descriptionWidth="w-64" />
      <AdminStatsSkeleton count={3} />
      <AdminToolbarSkeleton inputs={3} trailingAction />
      <AdminTableShell columns={6} rows={6} />
    </div>
  );
}

export function AdminReviewsLoadingShell() {
  return (
    <div className="space-y-8">
      <AdminHeaderSkeleton titleWidth="w-32" descriptionWidth="w-[34rem]" />
      <AdminTableShell columns={7} rows={6} />
    </div>
  );
}

export function AdminUsersLoadingShell() {
  return (
    <div className="space-y-7">
      <AdminHeaderSkeleton titleWidth="w-28" descriptionWidth="w-52" />
      <AdminToolbarSkeleton inputs={1} trailingAction />
      <AdminTableShell columns={6} rows={6} />
    </div>
  );
}

export function AdminTagsLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavbarShell />
      <main className="flex-1 bg-background">
        <PageContainer className="py-10">
          <PageContentWide className="space-y-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <LoadingSkeleton className="h-3 w-12" />
                <LoadingSkeleton className="h-10 w-56 rounded-2xl" />
                <LoadingSkeleton className="h-4 w-[30rem]" />
              </div>
              <LoadingSkeleton className="h-10 w-28 rounded-xl" />
            </div>

            <AdminStatsSkeleton count={3} />

            <div className="rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <LoadingSkeleton className="h-4 w-4 rounded-full" />
                <LoadingSkeleton className="h-4 w-32" />
              </div>
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <LoadingSkeleton className="h-11 flex-1 rounded-xl" />
                  <LoadingSkeleton className="h-11 w-28 rounded-xl" />
                </div>
                <LoadingSkeleton className="mt-3 h-4 w-44" />
              </div>
            </div>

            <AdminTableShell columns={4} rows={6} />
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}
