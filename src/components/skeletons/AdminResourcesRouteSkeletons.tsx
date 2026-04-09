"use client";

import { AdminResourceFormLoadingShell } from "@/components/admin/resources";
import { Navbar } from "@/components/layout/Navbar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageContainer, PageContent } from "@/design-system";

function HeaderBlock({
  titleWidth,
  copyWidth,
  actions = 2,
}: {
  titleWidth: string;
  copyWidth: string;
  actions?: number;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
        <LoadingSkeleton className={`h-4 ${copyWidth}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: actions }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-10 w-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ResourcesFilterBarSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_160px_208px_auto] xl:items-end">
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <LoadingSkeleton className="h-10 w-32 rounded-xl" />
          <LoadingSkeleton className="h-10 w-24 rounded-xl" />
          <LoadingSkeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}

function AdminResourcesTableShell({
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
                {cellIndex === 0 ? (
                  <LoadingSkeleton className="h-3 w-3/4" />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminResourcesPaginationSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/70 px-4 py-3">
      <LoadingSkeleton className="h-4 w-28" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-9 w-24 rounded-xl" />
        <LoadingSkeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

function AdminResourcesFormSidebarSkeleton({
  includeStats = false,
  includeDetails = false,
}: {
  includeStats?: boolean;
  includeDetails?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <LoadingSkeleton className="mb-3 h-3 w-24" />
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card shadow-card">
          <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <LoadingSkeleton className="h-4 w-4/5" />
            <LoadingSkeleton className="h-4 w-2/3" />
            <LoadingSkeleton className="h-3 w-1/2" />
            <LoadingSkeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      {includeStats ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <LoadingSkeleton className="h-4 w-20" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {includeDetails ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <LoadingSkeleton className="h-4 w-20" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminResourcesIndexLoadingShell() {
  return (
    <div className="min-w-0 space-y-7">
      <HeaderBlock titleWidth="w-44" copyWidth="w-80" actions={3} />
      <ResourcesFilterBarSkeleton />
      <AdminResourcesResultsSkeleton />
    </div>
  );
}

export function AdminResourcesResultsSkeleton() {
  return (
    <>
      <AdminResourcesTableShell columns={6} rows={6} />
      <AdminResourcesPaginationSkeleton />
    </>
  );
}

export function AdminResourcesTrashLoadingShell() {
  return (
    <div className="space-y-6">
      <HeaderBlock titleWidth="w-28" copyWidth="w-[32rem]" actions={1} />
      <AdminResourcesTrashResultsSkeleton />
    </div>
  );
}

export function AdminResourcesTrashResultsSkeleton() {
  return <AdminResourcesTableShell columns={4} rows={5} />;
}

export function AdminResourcesBulkLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 bg-background">
        <PageContainer className="py-10">
          <PageContent className="space-y-8">
            <HeaderBlock titleWidth="w-40" copyWidth="w-[30rem]" actions={2} />
            <LoadingSkeleton className="h-9 w-36 rounded-full" />
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-full max-w-2xl" />
              </div>
              <LoadingSkeleton className="mt-5 h-56 w-full rounded-3xl" />
              <div className="mt-5 flex justify-end gap-3">
                <LoadingSkeleton className="h-10 w-28 rounded-xl" />
                <LoadingSkeleton className="h-10 w-36 rounded-xl" />
              </div>
            </div>
          </PageContent>
        </PageContainer>
      </main>
    </div>
  );
}

export function AdminResourcesCreateLoadingShell() {
  return (
    <div className="w-full space-y-6">
      <HeaderBlock titleWidth="w-52" copyWidth="w-[34rem]" actions={0} />
      <AdminResourcesCreateFormSkeleton />
    </div>
  );
}

export function AdminResourcesEditLoadingShell() {
  return (
    <div className="w-full space-y-6">
      <HeaderBlock titleWidth="w-44" copyWidth="w-[30rem]" actions={0} />
      <AdminResourcesEditFormSkeleton />
    </div>
  );
}

export function AdminResourcesCreateFormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <AdminResourceFormLoadingShell />
      <AdminResourcesFormSidebarSkeleton />
    </div>
  );
}

export function AdminResourcesEditFormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <AdminResourceFormLoadingShell />
      <AdminResourcesFormSidebarSkeleton includeStats includeDetails />
    </div>
  );
}

export function AdminResourcesVersionsLoadingShell() {
  return (
    <div className="space-y-6">
      <HeaderBlock titleWidth="w-32" copyWidth="w-[26rem]" actions={0} />
      <AdminResourcesVersionsResultsSkeleton />
    </div>
  );
}

export function AdminResourcesVersionsResultsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-5">
        <LoadingSkeleton className="h-6 w-56" />
        <div className="mt-3 flex flex-wrap gap-2">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-4 w-3" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <LoadingSkeleton className="h-8 w-28 rounded-lg" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
        <AdminResourcesTableShell columns={6} rows={4} />
      </div>
    </div>
  );
}
