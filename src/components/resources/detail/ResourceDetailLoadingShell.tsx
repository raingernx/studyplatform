"use client";

import { Skeleton } from "boneyard-js/react";
import { PurchaseCardSkeleton, PurchaseCardBonesPreview } from "./PurchaseCardSkeleton";
import { ResourceDetailOwnerReviewSlotSkeleton } from "./ResourceDetailOwnerReviewClient";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ResourceDetailShell } from "./ResourceDetailShell";
import { ResourceHeader } from "./ResourceHeader";
import { ResourceGallery } from "./ResourceGallery";
import { ResourceDescription } from "./ResourceDescription";

const RESOURCE_DETAIL_LOADING_SHELL_NAME = "resource-detail-shell";
const BONES_PREVIEW_IMAGE = "/uploads/c8fef7c0a5fecefa.png";

const detailPreviewImages = [
  { id: "preview-1", imageUrl: BONES_PREVIEW_IMAGE, order: 0 },
  { id: "preview-2", imageUrl: BONES_PREVIEW_IMAGE, order: 1 },
  { id: "preview-3", imageUrl: BONES_PREVIEW_IMAGE, order: 2 },
  { id: "preview-4", imageUrl: BONES_PREVIEW_IMAGE, order: 3 },
  { id: "preview-5", imageUrl: BONES_PREVIEW_IMAGE, order: 4 },
];

function DetailSectionCard({
  title,
  body,
  heightClass = "min-h-[224px]",
}: {
  title: string;
  body: string;
  heightClass?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-border bg-card p-6 ${heightClass}`}>
      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-small leading-6 text-muted-foreground">{body}</p>
      </div>
    </section>
  );
}

function ResourceDetailBodyFallback() {
  return (
    <div className="space-y-3 py-2">
      <LoadingSkeleton className="h-5 w-24 rounded-lg" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
        <LoadingSkeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

function ResourceDetailReviewsFallback() {
  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="space-y-1">
        <LoadingSkeleton className="h-5 w-24 rounded-lg" />
        <LoadingSkeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <LoadingSkeleton key={s} className="h-4 w-4" />
                ))}
              </div>
              <LoadingSkeleton className="h-3 w-16" />
            </div>
            <div className="mt-2 space-y-1.5">
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceDetailFooterFallback() {
  return (
    <>
      <div className="space-y-4 border-t border-border pt-6">
        <LoadingSkeleton className="h-5 w-16 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {[72, 96, 64, 88, 80].map((w) => (
            <LoadingSkeleton key={w} className="h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="space-y-4 border-t border-border pt-6">
        <LoadingSkeleton className="h-5 w-20 rounded-lg" />
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-3 w-full" />
            <LoadingSkeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </>
  );
}

function ResourceDetailRelatedQuickLinks({
  categoryName,
  categorySlug,
}: {
  categoryName?: string | null;
  categorySlug?: string | null;
}) {
  if (!categoryName || !categorySlug) {
    return (
      <div className="space-y-4 border-t border-border pt-7">
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-5 w-28 rounded-lg" />
          <LoadingSkeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-3 w-3/4" />
                <LoadingSkeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 border-t border-border pt-7">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-foreground">More like this</h2>
        <p className="text-small leading-6 text-muted-foreground">
          Keep exploring nearby resources while we load tailored suggestions.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[120, 116].map((width) => (
          <LoadingSkeleton key={width} className="h-8 rounded-full" style={{ width }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-3 w-3/4" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResourceDetailLoadingPreview() {
  return (
    <div data-loading-scope="resource-detail-preview">
      <ResourceDetailShell>
        <div className="space-y-6 lg:space-y-9">
          <ResourceHeader
            breadcrumb={[
              { label: "Home", href: "/" },
              { label: "Science", href: "/categories/science" },
            ]}
            title="Middle School Science Quiz & Assessment Set"
            creatorName="Kru Craft"
            averageRating={4.8}
            reviewCount={17}
            downloadCount={156}
          />

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[80px_minmax(0,1fr)]">
                <ResourceGallery
                  previews={detailPreviewImages}
                  resourceTitle="Middle School Science Quiz & Assessment Set"
                />
              </div>
            </div>

            <div className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
              <div className="rounded-2xl border border-border bg-card px-5 py-4">
                <p className="text-sm font-medium text-foreground">
                  Ready to study. Keep this resource in your library for repeat review.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <DetailSectionCard
                  title="What’s inside"
                  body="Structured revision pages, guided prompts, and printable reference material designed to shorten prep time."
                />
                <DetailSectionCard
                  title="Why it helps"
                  body="A compact preview of the most important information so learners can understand the value before purchase."
                />
              </div>

              <div className="rounded-[28px] border border-border bg-card p-6">
                <ResourceDescription
                  description="A full detail layout preview used for skeleton capture. It keeps the final shell geometry close to the live page so the loading state stays consistent with the detail experience."
                />
              </div>
            </div>

            <aside className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2">
              <PurchaseCardBonesPreview />
            </aside>
          </div>
        </div>
      </ResourceDetailShell>
    </div>
  );
}

function ManualResourceDetailLoadingShell() {
  return (
    <div data-loading-scope="resource-detail">
      <ResourceDetailShell>
        <div className="space-y-6 lg:space-y-9">
          <div className="space-y-3">
            <LoadingSkeleton className="h-4 w-40" />
            <LoadingSkeleton className="h-10 w-3/4 max-w-2xl rounded-2xl" />
            <LoadingSkeleton className="h-4 w-64" />
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[80px_minmax(0,1fr)]">
                <LoadingSkeleton className="order-1 aspect-[4/3] min-h-[420px] w-full rounded-xl border border-border bg-card/80 shadow-sm lg:order-2" />
                <div className="order-2 flex w-full gap-2 overflow-hidden pb-1 lg:h-full lg:min-h-0 lg:order-1 lg:w-20 lg:flex-col lg:gap-3 lg:overflow-y-auto">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LoadingSkeleton
                      key={index}
                      className="aspect-square w-16 shrink-0 rounded-lg border border-border bg-card/80 lg:w-20"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
              <LoadingSkeleton className="h-14 rounded-2xl border border-border bg-card/80" />
              <ResourceDetailBodyFallback />
              <ResourceDetailReviewsFallback />
              <ResourceDetailOwnerReviewSlotSkeleton />
              <ResourceDetailFooterFallback />
            </div>

            <aside className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2">
              <PurchaseCardSkeleton />
            </aside>
          </div>

          <ResourceDetailRelatedQuickLinks
            categoryName="Science"
            categorySlug="science"
          />

          <section className="space-y-4 border-t border-border pt-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-28" />
                  <LoadingSkeleton className="h-8 w-72 rounded-xl" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3">
                      <LoadingSkeleton className="mt-2 h-2 w-2 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <LoadingSkeleton className="h-4 w-full" />
                        <LoadingSkeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-8 w-64 rounded-xl" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[112, 132, 120].map((width) => (
                    <LoadingSkeleton key={width} className="h-8 rounded-full" style={{ width }} />
                  ))}
                </div>
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-border pt-6">
            <LoadingSkeleton className="h-4 w-40" />
          </div>
        </div>
      </ResourceDetailShell>
    </div>
  );
}

export function ResourceDetailLoadingShellBonesPreview() {
  return (
    <Skeleton
      name={RESOURCE_DETAIL_LOADING_SHELL_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourceDetailLoadingPreview />
    </Skeleton>
  );
}

export function ResourceDetailLoadingShell() {
  return <ManualResourceDetailLoadingShell />;
}
