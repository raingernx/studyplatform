"use client";

import { ArrowRight } from "lucide-react";
import { Skeleton } from "boneyard-js/react";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";
import { LoadingSkeleton } from "@/design-system";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";
import { ResourcesDiscoverSectionsSkeleton } from "@/components/skeletons/ResourcesDiscoverSectionsSkeleton";

const RESOURCES_LISTING_SHELL_NAME = "resources-listing-shell";
const BONES_PREVIEW_IMAGE = "/uploads/c8fef7c0a5fecefa.png";

const listingCardFixtures: ResourceCardResource[] = [
  {
    id: "listing-resource-1",
    slug: "middle-school-science-quiz-assessment-set",
    title: "Middle School Science Quiz & Assessment Set",
    price: 2000,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Science", slug: "science" },
    highlightBadge: "Trending this week",
  },
  {
    id: "listing-resource-2",
    slug: "student-study-planner-goal-tracker",
    title: "Student Study Planner & Goal Tracker (Printable)",
    price: 100,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Study Skills", slug: "study-skills" },
  },
  {
    id: "listing-resource-3",
    slug: "creative-classroom-art-project-pack",
    title: "Creative Classroom Art Project Pack — 10 Activities",
    price: 100,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Art & Creativity", slug: "art-creativity" },
  },
  {
    id: "listing-resource-4",
    slug: "thailand-geography-worksheet-set",
    title: "Thailand Geography Worksheet Set",
    price: 100,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Humanities", slug: "humanities" },
  },
];

export function FilterBarFallback() {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <LoadingSkeleton className="h-5 w-24 rounded-md" />
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
        <LoadingSkeleton className="h-11 w-full rounded-full border border-border bg-card sm:w-28" />
        <LoadingSkeleton className="h-11 w-full rounded-full border border-border bg-muted sm:w-36" />
        <LoadingSkeleton className="h-11 w-16 rounded-full sm:w-20" />
      </div>
    </div>
  );
}

function SidebarFallbackGroup({
  titleWidth,
  rowWidths,
  pillWidths,
}: {
  titleWidth: string;
  rowWidths?: string[];
  pillWidths?: string[];
}) {
  return (
    <div className="border-b border-border pb-4">
      <div className="mb-3 flex items-center justify-between">
        <LoadingSkeleton className={`h-4 rounded ${titleWidth}`} />
        <LoadingSkeleton className="h-4 w-4 rounded" />
      </div>

      {rowWidths ? (
        <div className="space-y-0.5">
          {rowWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-row-${index}`}
              className={`h-10 rounded-xl ${width}`}
            />
          ))}
        </div>
      ) : null}

      {pillWidths ? (
        <div className="flex flex-wrap gap-2">
          {pillWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-pill-${index}`}
              className={`h-8 rounded-full border border-border bg-card ${width}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarFallback() {
  return (
    <div className="w-[260px] flex-shrink-0 space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <LoadingSkeleton className="h-4 w-12 rounded" />
        <LoadingSkeleton className="h-4 w-14 rounded" />
      </div>
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-5/6", "w-3/4", "w-[92%]", "w-[88%]", "w-[80%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-16"
        rowWidths={["w-full", "w-[90%]", "w-[84%]", "w-[72%]", "w-[76%]", "w-[68%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-4/5", "w-[70%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-20"
        pillWidths={["w-24", "w-28", "w-24"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-24"
        pillWidths={["w-20", "w-28", "w-24"]}
      />
    </div>
  );
}

export function ResourcesListingContentManualFallback() {
  return (
    <>
      <ResourcesIntroSectionSkeleton isDiscoverMode={false} />

      <section className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="hidden lg:block">
            <SidebarFallback />
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <FilterBarFallback />
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-4 w-28 rounded" />
                    <LoadingSkeleton className="h-10 w-full max-w-md rounded-lg" />
                    <LoadingSkeleton className="h-4 w-full max-w-2xl rounded" />
                    <LoadingSkeleton className="h-4 w-11/12 max-w-xl rounded" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LoadingSkeleton className="h-7 w-24 rounded-full border border-border bg-muted/40" />
                    <LoadingSkeleton className="h-7 w-28 rounded-full border border-border-strong bg-background/80" />
                  </div>
                  <LoadingSkeleton className="h-5 w-32 rounded" />
                </div>
                <div className="w-full max-w-[320px] justify-self-start lg:justify-self-end">
                  <div className="rounded-[1.35rem] border border-border-strong bg-background/85 p-2 shadow-sm">
                    <ResourceCardSkeleton />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              {Array.from({ length: 8 }).map((_, index) => (
                <ResourceCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PreviewSidebarGroup({
  title,
  rows,
  activeRow,
}: {
  title: string;
  rows: string[];
  activeRow?: string;
}) {
  return (
    <div className="border-b border-border pb-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <span className="text-caption text-muted-foreground">-</span>
      </div>
      <div className="space-y-0.5">
        {rows.map((row) => {
          const isActive = row === activeRow;
          return (
            <div
              key={`${title}-${row}`}
              className={
                isActive
                  ? "w-full rounded-xl border border-border-strong bg-muted/40 px-3 py-2.5 text-left text-small font-medium text-foreground"
                  : "w-full rounded-xl px-3 py-2.5 text-left text-small text-muted-foreground"
              }
            >
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResourcesListingShellPreview() {
  const spotlightResource = listingCardFixtures[0];
  const gridResources = listingCardFixtures;

  return (
    <>
      <section className="space-y-5 pb-7 sm:space-y-6 sm:pb-8">
        <div className="flex flex-col gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
              Browse
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              All resources
            </h1>
            <p className="max-w-2xl text-small leading-6 text-muted-foreground">
              Explore printable worksheets, flashcards, and teaching materials across every category.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
            <span className="font-medium text-foreground">20 results</span>
            <span aria-hidden>•</span>
            <span>Sorted by Trending</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <aside className="hidden w-[260px] flex-shrink-0 space-y-5 lg:block">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
                Filters
              </p>
              <span className="text-caption text-muted-foreground">Clear all</span>
            </div>
            <PreviewSidebarGroup
              title="Sort by"
              rows={[
                "Trending",
                "Newest",
                "Most downloaded",
                "Price: Low → High",
                "Price: High → Low",
              ]}
              activeRow="Trending"
            />
            <PreviewSidebarGroup
              title="Category"
              rows={[
                "All categories",
                "Art & Creativity",
                "Early Learning",
                "Humanities",
                "Language",
                "Mathematics",
              ]}
              activeRow="All categories"
            />
            <PreviewSidebarGroup
              title="Price"
              rows={["All prices", "Free only", "Paid only"]}
              activeRow="All prices"
            />
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="shrink-0 text-small text-muted-foreground">20 resources</p>
              <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                <div className="min-h-11 rounded-full border border-border-strong bg-background px-3.5 py-2.5 text-small text-muted-foreground">
                  Any price
                </div>
                <div className="min-h-11 rounded-full border border-border-strong bg-muted/40 px-3.5 py-2.5 text-small text-muted-foreground">
                  Trending
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
                      Trending this week
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      Start with the strongest pick first
                    </h2>
                    <p className="max-w-2xl text-small leading-6 text-muted-foreground">
                      Use this highlighted pick as your first stop in the marketplace before you scan the rest of the collection.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                      Trending
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border-strong bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      All categories
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-small font-medium text-muted-foreground">
                    View resource
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="w-full max-w-[320px] justify-self-start lg:justify-self-end">
                  <div className="rounded-[1.35rem] border border-border-strong bg-background/85 p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.48)]">
                    <ResourceCard
                      resource={spotlightResource}
                      previewMode
                      linkPrefetchMode="none"
                      imageLoading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              {gridResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  previewMode
                  linkPrefetchMode="none"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function ResourcesListingShellBonesPreview() {
  return (
    <Skeleton
      name={RESOURCES_LISTING_SHELL_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourcesListingShellPreview />
    </Skeleton>
  );
}

export function ResourcesContentFallback({
  isDiscoverMode,
}: {
  isDiscoverMode: boolean;
}) {
  if (isDiscoverMode) {
    return <ResourcesDiscoverSectionsSkeleton />;
  }

  return (
    <div data-loading-scope="resources-browse">
      <ResourcesListingContentManualFallback />
    </div>
  );
}
