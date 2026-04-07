"use client";

import { ArrowRight } from "lucide-react";
import { Skeleton } from "boneyard-js/react";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";
import { LoadingSkeleton } from "@/design-system";

const RESOURCES_DISCOVER_SECTIONS_NAME = "resources-discover-sections";
const BONES_PREVIEW_IMAGE = "/uploads/c8fef7c0a5fecefa.png";

const discoverPreviewResources: ResourceCardResource[] = [
  {
    id: "discover-resource-1",
    slug: "middle-school-science-quiz-assessment-set",
    title: "Middle School Science Quiz & Assessment Set",
    price: 2000,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Science", slug: "science" },
  },
  {
    id: "discover-resource-2",
    slug: "reading-comprehension-exercise-pack-grades-4-6",
    title: "Reading Comprehension Exercise Pack (Grades 4–6)",
    price: 100,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Language", slug: "language" },
  },
  {
    id: "discover-resource-3",
    slug: "english-vocabulary-flashcards-500-essential-words",
    title: "English Vocabulary Flashcards — 500 Essential Words",
    price: 100,
    isFree: false,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Language", slug: "language" },
  },
  {
    id: "discover-resource-4",
    slug: "primary-science-experiment-activity-cards",
    title: "Primary Science Experiment Activity Cards",
    price: 0,
    isFree: true,
    thumbnailUrl: BONES_PREVIEW_IMAGE,
    author: { name: "Kru Craft" },
    category: { name: "Science", slug: "science" },
  },
];

const browseTileContent = [
  {
    eyebrow: "Browse",
    title: "Top picks",
    body: "A tighter shortlist ranked to surface strong marketplace picks first.",
  },
  {
    eyebrow: "Format",
    title: "Worksheets",
    body: "Jump straight into printable practice materials and guided exercises.",
  },
  {
    eyebrow: "Format",
    title: "Flashcards",
    body: "Review-ready cards for memorisation, recall, and speaking drills.",
  },
  {
    eyebrow: "Budget",
    title: "Free to start",
    body: "Open free resources first, then decide what is worth saving or buying.",
  },
];

const collectionContent = [
  {
    title: "Top picks for weekly planning",
    body: "A compact set of teacher favourites chosen to shortcut lesson prep.",
  },
  {
    title: "Language practice boosters",
    body: "Mix reading, vocabulary, and speaking activities without rebuilding a unit from scratch.",
  },
  {
    title: "Printable classroom essentials",
    body: "Core worksheets and planners that slot into your regular classroom workflow.",
  },
  {
    title: "Free classroom starters",
    body: "Quick-win activities that help new teachers or parents start with zero cost.",
  },
];

function DiscoverDeferredSectionFallback({
  titleWidth,
  cardCount,
}: {
  titleWidth: string;
  cardCount: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className={`h-6 ${titleWidth}`} />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-6 w-16" />
      </div>
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: cardCount }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function DiscoverBrowseTilesFallback() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-6 w-56" />
          <LoadingSkeleton className="h-4 w-80" />
        </div>
        <LoadingSkeleton className="h-6 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-48 rounded-[24px]" />
        ))}
      </div>
    </section>
  );
}

function DiscoverCollectionsFallback() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-6 w-52" />
          <LoadingSkeleton className="h-4 w-72" />
        </div>
        <LoadingSkeleton className="h-6 w-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-72 rounded-[24px]" />
        ))}
      </div>
    </section>
  );
}

export function ResourcesDiscoverSectionsManualSkeleton() {
  return (
    <div className="space-y-16 lg:space-y-20">
      <DiscoverBrowseTilesFallback />
      <DiscoverDeferredSectionFallback titleWidth="w-52" cardCount={4} />
      <DiscoverDeferredSectionFallback titleWidth="w-40" cardCount={4} />
      <DiscoverCollectionsFallback />
    </div>
  );
}

function PreviewSectionHeader({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <p className="text-xl font-semibold tracking-tight text-foreground">{title}</p>
        <p className="text-small text-muted-foreground">{body}</p>
      </div>
      <p className="text-small font-medium text-primary">{cta}</p>
    </div>
  );
}

export function ResourcesDiscoverSectionsPreview() {
  return (
    <div className="space-y-16 lg:space-y-20">
      <section className="space-y-5">
        <PreviewSectionHeader
          title="Start with a clearer path"
          body="Browse by intent first so the marketplace feels closer to a toolkit than a wall of cards."
          cta="Browse everything"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {browseTileContent.map((tile) => (
            <div
              key={tile.title}
              className="rounded-[24px] border border-border-subtle bg-card p-6 shadow-sm"
            >
              <div className="space-y-3">
                <p className="text-caption font-medium text-primary">{tile.eyebrow}</p>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {tile.title}
                </p>
                <p className="text-small leading-6 text-muted-foreground">{tile.body}</p>
                <div className="inline-flex items-center gap-1.5 text-small font-medium text-primary">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <PreviewSectionHeader
          title="Recommended for you"
          body="A focused set of picks to help you keep momentum without sorting through the whole library."
          cta="Browse everything"
        />
        <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {discoverPreviewResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              previewMode
              linkPrefetchMode="none"
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <PreviewSectionHeader
          title="Explore collections"
          body="Curated bundles and themed sets to speed up planning for your next lesson."
          cta="See all collections"
        />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {collectionContent.map((collection, index) => (
            <div
              key={collection.title}
              className="rounded-[24px] border border-border-subtle bg-card p-5 shadow-sm"
            >
              <div className="mb-4 aspect-[4/3] rounded-[18px] border border-border-subtle bg-gradient-to-br from-primary/10 via-card to-card" />
              <div className="space-y-2">
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {collection.title}
                </p>
                <p className="text-small leading-6 text-muted-foreground">
                  {collection.body}
                </p>
                <p className="text-caption font-medium text-primary">
                  Collection {index + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ResourcesDiscoverSectionsBonesPreview() {
  return (
    <Skeleton
      name={RESOURCES_DISCOVER_SECTIONS_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourcesDiscoverSectionsPreview />
    </Skeleton>
  );
}

export function ResourcesDiscoverSectionsSkeleton() {
  return (
    <div data-loading-scope="resources-browse">
      <ResourcesDiscoverSectionsManualSkeleton />
    </div>
  );
}
