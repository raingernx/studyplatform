"use client";

import { ArrowRight } from "lucide-react";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { routes } from "@/lib/routes";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { ResourcesViewerDiscoverState } from "@/lib/resources/viewer-state";
import { useResourcesViewerState } from "./ResourcesViewerStateProvider";
import { ViewerAwareResourceCard } from "./ViewerAwareResourceCard";

function ResourcesSectionHeader({
  title,
  description,
  viewAllHref,
}: {
  title: string;
  description?: string;
  viewAllHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
      <IntentPrefetchLink
        href={viewAllHref}
        prefetchMode="intent"
        prefetchScope="resources-section-view-all"
        prefetchLimit={2}
        resourcesNavigationMode="listing"
        className="group inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-small font-medium text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-800 sm:self-auto"
      >
        <span className="inline-flex items-center gap-1">
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </IntentPrefetchLink>
    </div>
  );
}

function ResourceCardRow({
  resources,
  decorate,
}: {
  resources: ResourceCardData[];
  decorate?: (resource: ResourceCardData, index: number) => ResourceCardData;
}) {
  return (
    <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {resources.map((resource, index) => (
        <ViewerAwareResourceCard
          key={resource.id}
          resource={decorate ? decorate(resource, index) : resource}
          variant="marketplace"
          linkPrefetchMode="viewport"
        />
      ))}
    </div>
  );
}

export function ResourcesDiscoverPersonalizedSection({
  fallbackCards,
}: {
  fallbackCards: ResourceCardData[];
}) {
  const { isAuthenticated, isReady } = useResourcesViewerState();
  const { data: discover } = useFetchJson<ResourcesViewerDiscoverState>({
    cacheKey: "resources-viewer-discover",
    ttlMs: 15_000,
    url: "/api/resources/viewer-state?scope=discover",
    enabled: isReady && isAuthenticated,
  });
  const recommendationVariant = discover?.recommendationVariant ?? null;
  const recommendedForYou =
    discover?.recommendedForYou && discover.recommendedForYou.length > 0
      ? discover.recommendedForYou
      : fallbackCards;
  const shouldUseRecommendedLabel = Boolean(discover);

  return (
    <>
      {recommendedForYou.length > 0 ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title={shouldUseRecommendedLabel ? "Recommended for you" : "Popular right now"}
            description={
              shouldUseRecommendedLabel
                ? "A focused set of picks to help you keep momentum without sorting through the whole library."
                : "Top resources other learners are exploring this week."
            }
            viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
          />
          {recommendationVariant ? (
            <RecommendationSection
              variant={recommendationVariant}
              section="recommended_for_you"
              resourceIds={recommendedForYou.map((resource) => resource.id)}
            >
              <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {recommendedForYou.map((resource) => (
                  <div key={resource.id} data-resource-id={resource.id}>
                    <ViewerAwareResourceCard
                      resource={resource}
                      variant="marketplace"
                      linkPrefetchMode="viewport"
                    />
                  </div>
                ))}
              </div>
            </RecommendationSection>
          ) : (
            <ResourceCardRow resources={recommendedForYou} />
          )}
        </section>
      ) : null}

      {discover?.becauseYouStudied && discover.becauseYouStudied.length > 0 && discover.recentStudyTitle && discover.recentCategoryName ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title={`Because you studied ${discover.recentStudyTitle}`}
            description={`More resources in ${discover.recentCategoryName} you haven't tried yet.`}
            viewAllHref={routes.marketplaceQuery("category=all&sort=newest")}
          />
          <ResourceCardRow
            resources={discover.becauseYouStudied}
            decorate={(resource) => ({
              ...resource,
              socialProofLabel: `More in ${discover.recentCategoryName}`,
            })}
          />
        </section>
      ) : null}

      {discover?.recommendedForLevel && discover.recommendedForLevel.length > 0 ? (
        <section className="space-y-5">
          <ResourcesSectionHeader
            title="Recommended for your level"
            description="Deterministic picks shaped by the difficulty level your recent purchases suggest."
            viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
          />
          <ResourceCardRow
            resources={discover.recommendedForLevel}
            decorate={(resource) => ({
              ...resource,
              socialProofLabel: "Recommended for your current pace",
            })}
          />
        </section>
      ) : null}
    </>
  );
}
