"use client";

import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const ADMIN_ANALYTICS_OVERVIEW_NAME = "admin-analytics-overview";
const ADMIN_ANALYTICS_RECOMMENDATIONS_NAME = "admin-analytics-recommendations";
const ADMIN_ANALYTICS_RANKING_NAME = "admin-analytics-ranking";
const ADMIN_ANALYTICS_RANKING_EXPERIMENT_NAME = "admin-analytics-ranking-experiment";
const ADMIN_ANALYTICS_PURCHASES_NAME = "admin-analytics-purchases";
const ADMIN_ANALYTICS_CREATOR_ACTIVATION_NAME = "admin-analytics-creator-activation";

function PageHeaderPreview({
  eyebrowWidth = "w-16",
  titleWidth = "w-72",
  copyWidth = "w-[32rem]",
}: {
  eyebrowWidth?: string;
  titleWidth?: string;
  copyWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className={`h-3 ${eyebrowWidth}`} />
      <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
      <LoadingSkeleton className={`h-4 ${copyWidth}`} />
    </div>
  );
}

function StatGridPreview({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-3 ${count >= 5 ? "md:grid-cols-5" : "md:grid-cols-4"} grid-cols-2`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-4"
        >
          <LoadingSkeleton className="h-9 w-9 rounded-xl" />
          <LoadingSkeleton className="mt-3 h-8 w-24" />
          <LoadingSkeleton className="mt-2 h-4 w-28" />
          <LoadingSkeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function AnalyticsCardPreview({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <LoadingSkeleton className="h-5 w-44" />
      <LoadingSkeleton className="mt-2 h-3 w-56" />
      <LoadingSkeleton className={`mt-5 w-full rounded-xl ${tall ? "h-44" : "h-28"}`} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <LoadingSkeleton className="h-3 w-20" />
        <LoadingSkeleton className="h-3 w-24" />
        <LoadingSkeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function ToolbarPreview({ inputs = 3, hasStatus = true }: { inputs?: number; hasStatus?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-end gap-3">
        {Array.from({ length: inputs }).map((_, index) => (
          <div key={index} className="space-y-2">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-10 w-40 rounded-xl" />
          </div>
        ))}
        <div className="flex items-end gap-2">
          <LoadingSkeleton className="h-10 w-24 rounded-xl" />
          <LoadingSkeleton className="h-10 w-20 rounded-xl" />
        </div>
        {hasStatus ? <LoadingSkeleton className="ml-auto h-4 w-44" /> : null}
      </div>
    </div>
  );
}

function TablePreview({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/80 px-5 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 px-5 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                className={`h-4 ${colIndex === 0 ? "w-32" : colIndex === columns - 1 ? "w-20 ml-auto" : "w-24"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPreview() {
  return (
    <div className="space-y-5">
      <PageHeaderPreview titleWidth="w-40" copyWidth="w-[30rem]" />
      <section className="space-y-2.5">
        <LoadingSkeleton className="h-6 w-40" />
        <LoadingSkeleton className="h-4 w-80" />
        <StatGridPreview count={5} />
      </section>
      <section className="space-y-2.5">
        <LoadingSkeleton className="h-6 w-36" />
        <LoadingSkeleton className="h-4 w-72" />
        <StatGridPreview count={4} />
      </section>
      <section className="space-y-2.5">
        <LoadingSkeleton className="h-6 w-28" />
        <LoadingSkeleton className="h-4 w-64" />
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          <AnalyticsCardPreview />
          <AnalyticsCardPreview />
          <AnalyticsCardPreview />
          <AnalyticsCardPreview />
        </div>
      </section>
    </div>
  );
}

function RecommendationsPreview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeaderPreview titleWidth="w-60" copyWidth="w-[34rem]" />
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="mt-3 h-8 w-28" />
          <LoadingSkeleton className="mt-2 h-4 w-40" />
        </div>
      </div>
      <ToolbarPreview inputs={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCardPreview tall />
        <AnalyticsCardPreview tall />
      </div>
      <TablePreview rows={6} columns={4} />
    </div>
  );
}

function RankingPreview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeaderPreview titleWidth="w-56" copyWidth="w-[34rem]" />
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="mt-3 h-20 w-72 rounded-xl" />
          <LoadingSkeleton className="mt-3 h-8 w-56" />
        </div>
      </div>
      <ToolbarPreview inputs={3} />
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <LoadingSkeleton className="h-3 w-32" />
          <LoadingSkeleton className="h-3 w-28" />
        </div>
        <TablePreview rows={7} columns={7} />
      </div>
    </div>
  );
}

function RankingExperimentPreview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeaderPreview titleWidth="w-64" copyWidth="w-[36rem]" />
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="mt-3 h-4 w-72" />
          <LoadingSkeleton className="mt-2 h-4 w-72" />
          <LoadingSkeleton className="mt-2 h-4 w-64" />
          <LoadingSkeleton className="mt-3 h-3 w-48" />
        </div>
      </div>
      <ToolbarPreview inputs={2} />
      <TablePreview rows={8} columns={4} />
    </div>
  );
}

function PurchasesPreview() {
  return (
    <div className="space-y-8">
      <PageHeaderPreview titleWidth="w-60" copyWidth="w-[32rem]" />
      <ToolbarPreview inputs={2} />
      <StatGridPreview count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCardPreview />
        <AnalyticsCardPreview />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <LoadingSkeleton className="h-5 w-36" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2 text-right">
                <LoadingSkeleton className="ml-auto h-6 w-20 rounded-full" />
                <LoadingSkeleton className="ml-auto h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <TablePreview rows={6} columns={4} />
    </div>
  );
}

function CreatorActivationPreview() {
  return (
    <div className="space-y-8 px-6 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <PageHeaderPreview eyebrowWidth="hidden" titleWidth="w-72" copyWidth="w-[34rem]" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-7 w-24 rounded-full" />
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-2">
              <LoadingSkeleton className="h-3 w-10" />
              <LoadingSkeleton className="h-10 w-36 rounded-xl" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-3 w-8" />
              <LoadingSkeleton className="h-10 w-36 rounded-xl" />
            </div>
            <LoadingSkeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card px-6 py-4">
        <LoadingSkeleton className="h-5 w-48" />
        <LoadingSkeleton className="mt-2 h-4 w-[28rem]" />
      </div>
      <div className="space-y-4">
        <LoadingSkeleton className="h-3 w-40" />
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="contents xl:contents">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <LoadingSkeleton className="h-9 w-9 rounded-xl" />
                  <LoadingSkeleton className="h-3 w-12" />
                </div>
                <LoadingSkeleton className="mt-3 h-8 w-24" />
                <LoadingSkeleton className="mt-2 h-4 w-40" />
                <LoadingSkeleton className="mt-2 h-3 w-full" />
              </div>
              {index < 3 ? (
                <div className="hidden xl:flex items-center justify-center">
                  <LoadingSkeleton className="h-8 w-16 rounded-full" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function makePreviewSkeleton(name: string, preview: React.ReactNode) {
  return (
    <Skeleton name={name} loading={false} className="w-full">
      {preview}
    </Skeleton>
  );
}

function makeRuntimeSkeleton(name: string, preview: React.ReactNode) {
  return <div data-loading-scope={name}>{preview}</div>;
}

export function AdminAnalyticsOverviewBonesPreview() {
  return makePreviewSkeleton(ADMIN_ANALYTICS_OVERVIEW_NAME, <OverviewPreview />);
}

export function AdminAnalyticsOverviewSkeleton() {
  return makeRuntimeSkeleton(ADMIN_ANALYTICS_OVERVIEW_NAME, <OverviewPreview />);
}

export function AdminAnalyticsReportingSkeleton() {
  return (
    <section className="space-y-2.5">
      <div>
        <LoadingSkeleton className="h-6 w-28" />
        <LoadingSkeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <AnalyticsCardPreview />
        <AnalyticsCardPreview />
        <AnalyticsCardPreview />
        <AnalyticsCardPreview />
      </div>
    </section>
  );
}

export function AdminAnalyticsRecommendationsBonesPreview() {
  return makePreviewSkeleton(
    ADMIN_ANALYTICS_RECOMMENDATIONS_NAME,
    <RecommendationsPreview />,
  );
}

export function AdminAnalyticsRecommendationsSkeleton() {
  return makeRuntimeSkeleton(
    ADMIN_ANALYTICS_RECOMMENDATIONS_NAME,
    <RecommendationsPreview />,
  );
}

export function AdminAnalyticsRecommendationsResultsSkeleton() {
  return (
    <div className="space-y-8">
      <StatGridPreview count={3} />
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <LoadingSkeleton className="h-5 w-56" />
        <LoadingSkeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AnalyticsCardPreview tall />
        <AnalyticsCardPreview tall />
      </div>
      <TablePreview rows={5} columns={4} />
      <LoadingSkeleton className="h-3 w-40" />
    </div>
  );
}

export function AdminAnalyticsRankingBonesPreview() {
  return makePreviewSkeleton(ADMIN_ANALYTICS_RANKING_NAME, <RankingPreview />);
}

export function AdminAnalyticsRankingSkeleton() {
  return makeRuntimeSkeleton(ADMIN_ANALYTICS_RANKING_NAME, <RankingPreview />);
}

export function AdminAnalyticsRankingResultsSkeleton() {
  return (
    <div className="space-y-8">
      <TablePreview rows={8} columns={7} />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/80 px-5 py-3">
          <LoadingSkeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-4 px-5 py-4">
              <LoadingSkeleton className="h-4 w-8" />
              <LoadingSkeleton className="h-4 w-40" />
              <LoadingSkeleton className="ml-auto h-4 w-20" />
              <LoadingSkeleton className="ml-auto h-4 w-20" />
              <LoadingSkeleton className="ml-auto h-4 w-20" />
              <LoadingSkeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <LoadingSkeleton className="h-3 w-40" />
    </div>
  );
}

export function AdminAnalyticsRankingFiltersSkeleton() {
  return <ToolbarPreview inputs={3} />;
}

export function AdminAnalyticsRankingExperimentBonesPreview() {
  return makePreviewSkeleton(
    ADMIN_ANALYTICS_RANKING_EXPERIMENT_NAME,
    <RankingExperimentPreview />,
  );
}

export function AdminAnalyticsRankingExperimentSkeleton() {
  return makeRuntimeSkeleton(
    ADMIN_ANALYTICS_RANKING_EXPERIMENT_NAME,
    <RankingExperimentPreview />,
  );
}

export function AdminAnalyticsRankingExperimentResultsSkeleton() {
  return (
    <div className="space-y-8">
      <TablePreview rows={8} columns={4} />
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-32" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-5/6" />
      </div>
      <LoadingSkeleton className="h-3 w-40" />
    </div>
  );
}

export function AdminAnalyticsPurchasesBonesPreview() {
  return makePreviewSkeleton(ADMIN_ANALYTICS_PURCHASES_NAME, <PurchasesPreview />);
}

export function AdminAnalyticsPurchasesSkeleton() {
  return makeRuntimeSkeleton(ADMIN_ANALYTICS_PURCHASES_NAME, <PurchasesPreview />);
}

export function AdminAnalyticsPurchasesResultsSkeleton() {
  return (
    <div className="space-y-8">
      <StatGridPreview count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCardPreview />
        <AnalyticsCardPreview />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <LoadingSkeleton className="h-5 w-36" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2 text-right">
                <LoadingSkeleton className="ml-auto h-6 w-20 rounded-full" />
                <LoadingSkeleton className="ml-auto h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <TablePreview rows={6} columns={4} />
      <LoadingSkeleton className="h-3 w-40" />
    </div>
  );
}

export function AdminAnalyticsCreatorActivationBonesPreview() {
  return makePreviewSkeleton(
    ADMIN_ANALYTICS_CREATOR_ACTIVATION_NAME,
    <CreatorActivationPreview />,
  );
}

export function AdminAnalyticsCreatorActivationSkeleton() {
  return makeRuntimeSkeleton(
    ADMIN_ANALYTICS_CREATOR_ACTIVATION_NAME,
    <CreatorActivationPreview />,
  );
}

export function AdminAnalyticsCreatorActivationResultsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card px-6 py-4">
        <LoadingSkeleton className="h-6 w-32" />
        <LoadingSkeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <AnalyticsCardPreview tall />
        <AnalyticsCardPreview tall />
        <AnalyticsCardPreview tall />
        <AnalyticsCardPreview tall />
      </div>
      <TablePreview rows={4} columns={4} />
      <LoadingSkeleton className="h-3 w-32" />
    </div>
  );
}
