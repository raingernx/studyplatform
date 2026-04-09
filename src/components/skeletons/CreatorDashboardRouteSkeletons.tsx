"use client";

import { Skeleton } from "boneyard-js/react";
import type { ReactNode } from "react";
import { LoadingSkeleton } from "@/design-system";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/DashboardPageHeader";

const CREATOR_DASHBOARD_OVERVIEW_NAME = "creator-dashboard-overview";
const CREATOR_DASHBOARD_ANALYTICS_NAME = "creator-dashboard-analytics";
const CREATOR_DASHBOARD_RESOURCES_NAME = "creator-dashboard-resources";
const CREATOR_DASHBOARD_SALES_NAME = "creator-dashboard-sales";
const CREATOR_DASHBOARD_PROFILE_NAME = "creator-dashboard-profile";

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
    <div className="space-y-8">
      <DashboardPageHeaderSkeleton
        eyebrowWidth="w-16"
        titleWidth="w-64"
        descriptionWidth="w-full max-w-xl"
      />

      <StatCardRowCompact count={3} columns="md:grid-cols-3" />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-5 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border/70 px-4 py-4">
              <LoadingSkeleton className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-28" />
              </div>
              <LoadingSkeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="space-y-8">
      <DashboardPageHeaderSkeleton
        eyebrowWidth="w-16"
        titleWidth="w-48"
        descriptionWidth="w-full max-w-xl"
        actionWidth="w-52"
      />
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <TableShell titleWidth="w-40" subtitleWidth="w-64" rows={5} columns="grid-cols-[1.4fr_1fr_1fr_1fr]" />
    </div>
  );
}

function ResourcesPreview() {
  return (
    <div className="space-y-8">
      <DashboardPageHeaderSkeleton
        eyebrowWidth="w-16"
        titleWidth="w-56"
        descriptionWidth="w-full max-w-lg"
        actionWidth="w-40"
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

      <TableShell titleWidth="w-32" rows={5} columns="grid-cols-[2fr_1fr_1fr_1fr]" padded="px-4 py-4" />
    </div>
  );
}

function SalesPreview() {
  return (
    <div className="space-y-8">
      <DashboardPageHeaderSkeleton
        eyebrowWidth="w-16"
        titleWidth="w-40"
        descriptionWidth="w-full max-w-lg"
      />
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <TableShell titleWidth="w-28" rows={5} columns="grid-cols-[2fr_1.2fr_1fr_1fr]" />
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="space-y-8">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <DashboardPageHeaderSkeleton
            eyebrowWidth="w-16"
            titleWidth="w-52"
            descriptionWidth="w-full max-w-xl"
          />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="ml-auto h-4 w-36" />
          <LoadingSkeleton className="ml-auto h-3 w-48" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-4">
          <LoadingSkeleton className="h-5 w-28" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <LoadingSkeleton className="h-12 w-full rounded-xl" />
            <LoadingSkeleton className="h-12 w-full rounded-xl" />
          </div>
          <LoadingSkeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function BoneyardPreview({
  name,
  preview,
}: {
  name: string;
  preview: ReactNode;
}) {
  return (
    <Skeleton name={name} loading={false} className="w-full">
      {preview}
    </Skeleton>
  );
}

function RuntimeShell({
  preview,
  scope,
}: {
  preview: ReactNode;
  scope: string;
}) {
  return <div data-loading-scope={scope}>{preview}</div>;
}

export function CreatorDashboardOverviewLoadingShell() {
  return <RuntimeShell preview={<OverviewPreview />} scope="creator-dashboard-overview" />;
}

export function CreatorDashboardOverviewResultsSkeleton() {
  return (
    <div className="space-y-8">
      <StatCardRowCompact count={3} columns="md:grid-cols-3" />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-5 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border/70 px-4 py-4">
              <LoadingSkeleton className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-28" />
              </div>
              <LoadingSkeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TableShell
          titleWidth="w-28"
          subtitleWidth="w-56"
          rows={3}
          columns="grid-cols-[1fr_1fr]"
        />
        <TableShell
          titleWidth="w-24"
          rows={3}
          columns="grid-cols-[1fr_1fr]"
        />
      </div>

      <TableShell
        titleWidth="w-40"
        subtitleWidth="w-64"
        rows={5}
        columns="grid-cols-[2fr_1fr_1fr_1fr]"
      />
    </div>
  );
}

export function CreatorDashboardOverviewBonesPreview() {
  return <BoneyardPreview name={CREATOR_DASHBOARD_OVERVIEW_NAME} preview={<OverviewPreview />} />;
}

export function CreatorDashboardAnalyticsLoadingShell() {
  return <RuntimeShell preview={<AnalyticsPreview />} scope="creator-dashboard-analytics" />;
}

export function CreatorDashboardAnalyticsResultsSkeleton() {
  return (
    <div className="space-y-8">
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-10 w-10 rounded-xl" />
            <LoadingSkeleton className="mt-4 h-8 w-24" />
            <LoadingSkeleton className="mt-2 h-4 w-32" />
            <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TableShell
          titleWidth="w-40"
          subtitleWidth="w-64"
          rows={5}
          columns="grid-cols-[1.4fr_1fr_1fr_1fr]"
        />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <LoadingSkeleton className="h-5 w-28" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="space-y-2">
                    <LoadingSkeleton className="h-4 w-full" />
                    <LoadingSkeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreatorDashboardAnalyticsBonesPreview() {
  return <BoneyardPreview name={CREATOR_DASHBOARD_ANALYTICS_NAME} preview={<AnalyticsPreview />} />;
}

export function CreatorDashboardResourcesLoadingShell() {
  return <RuntimeShell preview={<ResourcesPreview />} scope="creator-dashboard-resources" />;
}

export function CreatorDashboardResourcesResultsSkeleton() {
  return (
    <div className="space-y-8">
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

      <TableShell titleWidth="w-32" rows={5} columns="grid-cols-[2fr_1fr_1fr_1fr]" padded="px-4 py-4" />
    </div>
  );
}

export function CreatorDashboardResourcesBonesPreview() {
  return <BoneyardPreview name={CREATOR_DASHBOARD_RESOURCES_NAME} preview={<ResourcesPreview />} />;
}

export function CreatorDashboardSalesLoadingShell() {
  return <RuntimeShell preview={<SalesPreview />} scope="creator-dashboard-sales" />;
}

export function CreatorDashboardSalesResultsSkeleton() {
  return (
    <div className="space-y-8">
      <StatCardRow count={4} columns="md:grid-cols-2 xl:grid-cols-4" />
      <TableShell titleWidth="w-28" rows={5} columns="grid-cols-[2fr_1.2fr_1fr_1fr]" />
    </div>
  );
}

export function CreatorDashboardSalesBonesPreview() {
  return <BoneyardPreview name={CREATOR_DASHBOARD_SALES_NAME} preview={<SalesPreview />} />;
}

export function CreatorDashboardProfileLoadingShell() {
  return <RuntimeShell preview={<ProfilePreview />} scope="creator-dashboard-profile" />;
}

export function CreatorDashboardProfileFormSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="space-y-4">
        <LoadingSkeleton className="h-5 w-28" />
        <LoadingSkeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
        </div>
        <LoadingSkeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
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

export function CreatorDashboardProfileBonesPreview() {
  return <BoneyardPreview name={CREATOR_DASHBOARD_PROFILE_NAME} preview={<ProfilePreview />} />;
}
