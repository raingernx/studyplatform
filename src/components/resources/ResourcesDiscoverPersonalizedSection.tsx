"use client";

import { ArrowRight } from "lucide-react";
import { Skeleton } from "boneyard-js/react";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";
import {
  ResourceCard,
  type ResourceCardData,
  type ResourceCardResource,
} from "@/components/resources/ResourceCard";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { routes } from "@/lib/routes";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { ResourcesViewerDiscoverState } from "@/lib/resources/viewer-state";
import { useResourcesViewerState } from "./ResourcesViewerStateProvider";
import { ViewerAwareResourceCard } from "./ViewerAwareResourceCard";

const BONES_PREVIEW_IMAGE = "/uploads/c8fef7c0a5fecefa.png";
const RESOURCES_DISCOVER_PERSONALIZED_NAME = "resources-discover-personalized";

function dedupeResourceCards(resources: ResourceCardData[]) {
  return resources.filter((resource, index, allResources) => {
    return allResources.findIndex((candidate) => candidate.id === resource.id) === index;
  });
}

const personalizedPreviewFixtures: {
  recommendedForYou: ResourceCardResource[];
  becauseYouStudied: ResourceCardResource[];
  recommendedForLevel: ResourceCardResource[];
} = {
  recommendedForYou: [
    {
      id: "discover-personalized-1",
      slug: "reading-comprehension-exercise-pack-grades-4-6",
      title: "Reading Comprehension Exercise Pack (Grades 4–6)",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Language", slug: "language" },
      highlightBadge: "Recommended for you",
    },
    {
      id: "discover-personalized-2",
      slug: "middle-school-science-quiz-assessment-set",
      title: "Middle School Science Quiz & Assessment Set",
      price: 2000,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Science", slug: "science" },
      socialProofLabel: "Picked from your recent views",
    },
    {
      id: "discover-personalized-3",
      slug: "student-study-planner-goal-tracker-printable",
      title: "Student Study Planner & Goal Tracker (Printable)",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Study Skills", slug: "study-skills" },
    },
    {
      id: "discover-personalized-4",
      slug: "primary-science-experiment-activity-cards",
      title: "Primary Science Experiment Activity Cards",
      price: 0,
      isFree: true,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Science", slug: "science" },
    },
  ],
  becauseYouStudied: [
    {
      id: "discover-because-1",
      slug: "english-vocabulary-flashcards-essential-words",
      title: "English Vocabulary Flashcards — 500 Essential Words",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Language", slug: "language" },
      socialProofLabel: "More in Language",
    },
    {
      id: "discover-because-2",
      slug: "guided-speaking-drills-classroom-pack",
      title: "Guided Speaking Drills Classroom Pack",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Language", slug: "language" },
      socialProofLabel: "More in Language",
    },
    {
      id: "discover-because-3",
      slug: "thai-reading-practice-worksheets-bundle",
      title: "Thai Reading Practice Worksheets Bundle",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Language", slug: "language" },
      socialProofLabel: "More in Language",
    },
  ],
  recommendedForLevel: [
    {
      id: "discover-level-1",
      slug: "grammar-review-worksheet-set-intermediate",
      title: "Grammar Review Worksheet Set — Intermediate",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Language", slug: "language" },
      socialProofLabel: "Recommended for your current pace",
    },
    {
      id: "discover-level-2",
      slug: "science-lab-observation-journal-pack",
      title: "Science Lab Observation Journal Pack",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Science", slug: "science" },
      socialProofLabel: "Recommended for your current pace",
    },
    {
      id: "discover-level-3",
      slug: "critical-thinking-prompt-cards-upper-primary",
      title: "Critical Thinking Prompt Cards — Upper Primary",
      price: 100,
      isFree: false,
      thumbnailUrl: BONES_PREVIEW_IMAGE,
      author: { name: "Kru Craft" },
      category: { name: "Humanities", slug: "humanities" },
      socialProofLabel: "Recommended for your current pace",
    },
  ],
};

function getResourcePreviewUrl(resource: ResourceCardData) {
  return resource.thumbnailUrl ?? resource.previewImages?.[0] ?? resource.previewUrl ?? null;
}

function ResourcesSectionHeader({
  title,
  description,
  viewAllHref,
}: {
  title: string;
  description?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {viewAllHref ? (
        <IntentPrefetchLink
          href={viewAllHref}
          prefetchMode="intent"
          prefetchScope="resources-section-view-all"
          prefetchLimit={2}
          resourcesNavigationMode="listing"
          className="group inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-small font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground sm:self-auto"
        >
          <span className="inline-flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </IntentPrefetchLink>
      ) : null}
    </div>
  );
}

function ResourceCardRow({
  resources,
  decorate,
  eagerCardCount = 0,
  eagerPreviewUrls = [],
}: {
  resources: ResourceCardData[];
  decorate?: (resource: ResourceCardData, index: number) => ResourceCardData;
  eagerCardCount?: number;
  eagerPreviewUrls?: string[];
}) {
  const eagerPreviewUrlSet = new Set(eagerPreviewUrls);
  const uniqueResources = dedupeResourceCards(resources);

  return (
    <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {uniqueResources.map((resource, index) => {
        const decoratedResource = decorate ? decorate(resource, index) : resource;
        const previewUrl = getResourcePreviewUrl(decoratedResource);
        const imageLoading =
          index < eagerCardCount ||
          (previewUrl !== null && eagerPreviewUrlSet.has(previewUrl))
            ? "eager"
            : undefined;

        return (
          <ViewerAwareResourceCard
            key={resource.id}
            resource={decoratedResource}
            variant="marketplace"
            linkPrefetchMode="viewport"
            imageLoading={imageLoading}
          />
        );
      })}
    </div>
  );
}

function ResourcesSectionHeaderSkeleton({
  titleWidth,
  descriptionWidth,
  showsViewAll = false,
}: {
  titleWidth: string;
  descriptionWidth: string;
  showsViewAll?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <LoadingSkeleton className={`h-6 ${titleWidth}`} />
        <LoadingSkeleton className={`h-4 ${descriptionWidth}`} />
      </div>
      {showsViewAll ? <LoadingSkeleton className="h-6 w-16 rounded-full" /> : null}
    </div>
  );
}

function ResourceCardRowSkeleton({
  cardCount,
}: {
  cardCount: number;
}) {
  return (
    <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {Array.from({ length: cardCount }).map((_, index) => (
        <ResourceCardSkeleton key={index} />
      ))}
    </div>
  );
}

function PersonalizedDiscoverSectionSkeleton({
  cardCount,
}: {
  cardCount: number;
}) {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <ResourcesSectionHeaderSkeleton
          titleWidth="w-52"
          descriptionWidth="w-full max-w-2xl"
        />
        <ResourceCardRowSkeleton cardCount={cardCount} />
      </section>

      <section className="space-y-5">
        <ResourcesSectionHeaderSkeleton
          titleWidth="w-64"
          descriptionWidth="w-full max-w-xl"
          showsViewAll
        />
        <ResourceCardRowSkeleton cardCount={Math.max(3, Math.min(cardCount, 4))} />
      </section>

      <section className="space-y-5">
        <ResourcesSectionHeaderSkeleton
          titleWidth="w-48"
          descriptionWidth="w-full max-w-2xl"
        />
        <ResourceCardRowSkeleton cardCount={Math.max(3, Math.min(cardCount, 4))} />
      </section>
    </div>
  );
}

export function ResourcesDiscoverPersonalizedSection({
  fallbackCards,
  eagerCardCount = 0,
  eagerPreviewUrls = [],
}: {
  fallbackCards: ResourceCardData[];
  eagerCardCount?: number;
  eagerPreviewUrls?: string[];
}) {
  const { isAuthenticated, isReady } = useResourcesViewerState();
  const { data: discover, isReady: isDiscoverReady } = useFetchJson<ResourcesViewerDiscoverState>({
    cacheKey: "resources-viewer-discover",
    ttlMs: 15_000,
    url: "/api/resources/viewer-state?scope=discover",
    enabled: isReady && isAuthenticated,
  });
  const shouldShowPersonalizedLoading =
    isReady && isAuthenticated && !isDiscoverReady;

  if (shouldShowPersonalizedLoading) {
    return (
      <PersonalizedDiscoverSectionSkeleton
        cardCount={Math.max(3, Math.min(fallbackCards.length || 4, 4))}
      />
    );
  }

  const recommendationVariant = discover?.recommendationVariant ?? null;
  const recommendedForYou =
    discover?.recommendedForYou && discover.recommendedForYou.length > 0
      ? discover.recommendedForYou
      : fallbackCards;
  const uniqueRecommendedForYou = dedupeResourceCards(recommendedForYou);
  const uniqueBecauseYouStudied = dedupeResourceCards(discover?.becauseYouStudied ?? []);
  const uniqueRecommendedForLevel = dedupeResourceCards(discover?.recommendedForLevel ?? []);
  const shouldUseRecommendedLabel = Boolean(discover);
  const eagerPreviewUrlSet = new Set(eagerPreviewUrls);

  return (
    <>
      {uniqueRecommendedForYou.length > 0 ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title={shouldUseRecommendedLabel ? "Recommended for you" : "Top picks"}
            description={
              shouldUseRecommendedLabel
                ? "A focused set of picks to help you keep momentum without sorting through the whole library."
                : "A tighter shortlist of strong marketplace picks when you want a faster place to start."
            }
            viewAllHref={
              shouldUseRecommendedLabel
                ? undefined
                : routes.marketplaceQuery("sort=recommended&category=all")
            }
          />
          {recommendationVariant ? (
            <RecommendationSection
              variant={recommendationVariant}
              section="recommended_for_you"
              resourceIds={uniqueRecommendedForYou.map((resource) => resource.id)}
            >
              <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {uniqueRecommendedForYou.map((resource, index) => {
                  const previewUrl = getResourcePreviewUrl(resource);
                  const imageLoading =
                    index < eagerCardCount ||
                    (previewUrl !== null && eagerPreviewUrlSet.has(previewUrl))
                      ? "eager"
                      : undefined;

                  return (
                    <div key={resource.id} data-resource-id={resource.id}>
                      <ViewerAwareResourceCard
                        resource={resource}
                        variant="marketplace"
                        linkPrefetchMode="viewport"
                        imageLoading={imageLoading}
                      />
                    </div>
                  );
                })}
              </div>
            </RecommendationSection>
          ) : (
            <ResourceCardRow
              resources={uniqueRecommendedForYou}
              eagerCardCount={eagerCardCount}
              eagerPreviewUrls={eagerPreviewUrls}
            />
          )}
        </section>
      ) : null}

      {uniqueBecauseYouStudied.length > 0 && discover?.recentStudyTitle && discover?.recentCategoryName ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title={`Because you studied ${discover.recentStudyTitle}`}
            description={`More resources in ${discover.recentCategoryName} you haven't tried yet.`}
            viewAllHref={
              discover.recentCategorySlug
                ? routes.marketplaceQuery(
                    new URLSearchParams({
                      category: discover.recentCategorySlug,
                      sort: "newest",
                    }),
                  )
                : undefined
            }
          />
          <ResourceCardRow
            resources={uniqueBecauseYouStudied}
            decorate={(resource) => ({
              ...resource,
              socialProofLabel: `More in ${discover.recentCategoryName}`,
            })}
            eagerCardCount={eagerCardCount}
            eagerPreviewUrls={eagerPreviewUrls}
          />
        </section>
      ) : null}

      {uniqueRecommendedForLevel.length > 0 ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title="Recommended for your level"
            description="Deterministic picks shaped by the difficulty level your recent purchases suggest."
          />
          <ResourceCardRow
            resources={uniqueRecommendedForLevel}
            decorate={(resource) => ({
              ...resource,
              socialProofLabel: "Recommended for your current pace",
            })}
            eagerCardCount={eagerCardCount}
            eagerPreviewUrls={eagerPreviewUrls}
          />
        </section>
      ) : null}
    </>
  );
}

function PreviewResourceCardRow({
  resources,
}: {
  resources: ResourceCardResource[];
}) {
  return (
    <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id ?? resource.slug ?? resource.title}
          resource={resource}
          variant="marketplace"
          previewMode
        />
      ))}
    </div>
  );
}

export function ResourcesDiscoverPersonalizedPreview() {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <ResourcesSectionHeader
          title="Recommended for you"
          description="A focused set of picks to help you keep momentum without sorting through the whole library."
        />
        <PreviewResourceCardRow resources={personalizedPreviewFixtures.recommendedForYou} />
      </section>

      <section className="space-y-5">
        <ResourcesSectionHeader
          title="Because you studied English Vocabulary Flashcards"
          description="More resources in Language you haven't tried yet."
          viewAllHref={routes.marketplaceQuery("category=language&sort=newest")}
        />
        <PreviewResourceCardRow resources={personalizedPreviewFixtures.becauseYouStudied} />
      </section>

      <section className="space-y-5">
        <ResourcesSectionHeader
          title="Recommended for your level"
          description="Deterministic picks shaped by the difficulty level your recent purchases suggest."
        />
        <PreviewResourceCardRow resources={personalizedPreviewFixtures.recommendedForLevel} />
      </section>
    </div>
  );
}

export function ResourcesDiscoverPersonalizedBonesPreview() {
  return (
    <Skeleton
      name={RESOURCES_DISCOVER_PERSONALIZED_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourcesDiscoverPersonalizedPreview />
    </Skeleton>
  );
}
