import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { getCachedServerSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { isMissingTableError } from "@/lib/prismaErrors";
import { normaliseSortParam } from "@/config/sortOptions";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import {
  RANKING_EXPERIMENT_COOKIE,
  isValidRankingVariant,
  variantToSort,
} from "@/lib/ranking-experiment";
import {
  ResourcesDiscoverHero,
  ResourcesPageContent,
  ResourcesContentFallback,
} from "./ResourcesPageContent";
import { HeroBannerSkeleton } from "@/components/marketplace/HeroBanner";
import { ResourcesCatalogControls } from "@/components/marketplace/ResourcesCatalogControls";
import {
  ResourcesCatalogSearchSkeleton,
  ResourcesCatalogControlsSkeleton,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import {
  trackRequestWork,
  traceServerStep,
  updateRequestPerformanceDetails,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "Discover Study Resources",
  description: "Browse and download study resources.",
};

type SearchParamValue = string | string[] | undefined;
type OptionalUserIdPromise = Promise<string | undefined> | null;

interface ResourcesPageProps {
  searchParams?: Promise<Record<string, SearchParamValue>>;
}

function getSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function hasSessionTokenCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return (
    cookieStore.has("next-auth.session-token") ||
    cookieStore.has("__Secure-next-auth.session-token") ||
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token")
  );
}

async function getOptionalSessionUserId() {
  try {
    return (await getCachedServerSession())?.user?.id;
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    return undefined;
  }
}

async function AwaitResolvedNode({
  promise,
}: {
  promise: Promise<ReactNode>;
}) {
  return <>{await promise}</>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  const {
    search: rawSearch,
    category: rawCategory,
    price: rawPrice,
    featured: rawFeatured,
    tag: rawTag,
    sort: rawSort,
    page: rawPage,
  } = resolvedParams;

  const search = getSearchParamValue(rawSearch)?.trim();
  const category = getSearchParamValue(rawCategory)?.trim();
  const rawPriceValue = getSearchParamValue(rawPrice)?.trim() ?? "";
  const price = rawPriceValue === "free" || rawPriceValue === "paid" ? rawPriceValue : "";
  const featured = getSearchParamValue(rawFeatured)?.trim();
  const tag = getSearchParamValue(rawTag)?.trim();
  const sort = normaliseSortParam(getSearchParamValue(rawSort));
  const pageParam = getSearchParamValue(rawPage)?.trim();
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const isDiscoverMode = !category;
  const mobileFilterActiveCount = isDiscoverMode
    ? 0
    : [Boolean(category && category !== "all"), Boolean(tag)].filter(Boolean).length;
  const discoverHeroClassName =
    "min-h-[440px] rounded-[26px] border-white/70 bg-surface-100 sm:min-h-[500px] lg:min-h-[540px]";

  return withRequestPerformanceTrace(
    "route:/resources",
    {
      category: category ?? null,
      currentPage,
      mode: isDiscoverMode ? "discover" : "listing",
      sort,
    },
    async () => {
      let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
      try {
        cookieStore = await cookies();
      } catch {
        cookieStore = null;
      }

      const hasSessionCookie = cookieStore ? hasSessionTokenCookie(cookieStore) : false;

      let effectiveSort = sort;
      if (cookieStore) {
        const rawVariant = cookieStore.get(RANKING_EXPERIMENT_COOKIE)?.value;
        effectiveSort = variantToSort(isValidRankingVariant(rawVariant) ? rawVariant : null);
      }

      const userIdPromise: OptionalUserIdPromise = hasSessionCookie
        ? trackRequestWork(
            traceServerStep(
              "resources.optional_session_user",
              () => getOptionalSessionUserId(),
              { isDiscoverMode },
            ).then((userId) => {
              updateRequestPerformanceDetails({
                hasSession: Boolean(userId),
              });

              return userId;
            }),
          )
        : null;

      if (!userIdPromise) {
        updateRequestPerformanceDetails({
          hasSession: false,
        });
      }

      const heroPromise = isDiscoverMode
        ? trackRequestWork(
            ResourcesDiscoverHero({
              className: discoverHeroClassName,
            }),
          )
        : null;
      const contentPromise = trackRequestWork(
        ResourcesPageContent({
          isDiscoverMode,
          search,
          category,
          price,
          featured,
          tag,
          sort,
          effectiveSort,
          currentPage,
          userIdPromise,
        }),
      );

      return (
        <div className="flex min-h-screen flex-col bg-surface-50">
          <Navbar
            headerSearch={
              <Suspense fallback={<ResourcesCatalogSearchSkeleton />}>
                <HeroSearch variant="listing" />
              </Suspense>
            }
            secondaryRow={
              <Suspense fallback={<ResourcesCatalogControlsSkeleton showDiscoverMeta={isDiscoverMode} />}>
                <ResourcesCatalogControls
                  activeCount={mobileFilterActiveCount}
                  showDiscoverMeta={isDiscoverMode}
                />
              </Suspense>
            }
          />

          <main className="flex-1">
            {isDiscoverMode ? (
              <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(224,231,255,0.78),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
                <Container className="space-y-4 py-4 sm:space-y-5 sm:py-6 lg:space-y-6 lg:py-7">
                  {heroPromise ? (
                    <Suspense fallback={<HeroBannerSkeleton className={discoverHeroClassName} />}>
                      <AwaitResolvedNode promise={heroPromise} />
                    </Suspense>
                  ) : null}
                </Container>
              </section>
            ) : null}

            <Container
              className={
                isDiscoverMode
                  ? "space-y-10 pb-12 pt-5 sm:space-y-12 sm:pb-14 sm:pt-6 lg:space-y-14 lg:pb-16 lg:pt-8"
                  : "space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16"
              }
            >
              <Suspense fallback={<ResourcesContentFallback isDiscoverMode={isDiscoverMode} />}>
                <AwaitResolvedNode promise={contentPromise} />
              </Suspense>
            </Container>
          </main>
        </div>
      );
    },
  );
}
