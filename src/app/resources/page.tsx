import { Suspense } from "react";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourcesNavigationFeedback } from "@/components/marketplace/ResourcesNavigationFeedback";
import { isMissingTableError } from "@/lib/prismaErrors";
import { normaliseSortParam } from "@/config/sortOptions";
import {
  RANKING_EXPERIMENT_COOKIE,
  isValidRankingVariant,
  variantToSort,
} from "@/lib/ranking-experiment";
import {
  ResourcesContentFallback,
  ResourcesDiscoverHero,
  ResourcesPageContent,
} from "./ResourcesPageContent";

export const metadata = {
  title: "Discover Study Resources",
  description: "Browse and download study resources.",
};

type SearchParamValue = string | string[] | undefined;

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
  return cookieStore.getAll().some(({ name }) =>
    name === "next-auth.session-token" ||
    name === "__Secure-next-auth.session-token" ||
    name === "authjs.session-token" ||
    name === "__Secure-authjs.session-token",
  );
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

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  let session: Session | null = null;
  if (cookieStore && hasSessionTokenCookie(cookieStore)) {
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const userId = session?.user?.id;

  let effectiveSort = sort;
  if (cookieStore) {
    const rawVariant = cookieStore.get(RANKING_EXPERIMENT_COOKIE)?.value;
    effectiveSort = variantToSort(isValidRankingVariant(rawVariant) ? rawVariant : null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <ResourcesNavigationFeedback />
      <Navbar />

      <main className="flex-1">
        {isDiscoverMode ? (
          <section className="w-full px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <div className="mx-auto max-w-[1600px] space-y-4">
              <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-surface-200 bg-surface-50 px-5 py-2.5 text-center">
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium text-text-secondary">
                  New: Discover top-rated study resources curated by educators.{" "}
                  <span className="font-semibold text-text-primary">
                    Explore the library →
                  </span>
                </p>
              </div>
              <ResourcesDiscoverHero userId={userId} />
            </div>
          </section>
        ) : null}

        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
          <Suspense fallback={<ResourcesContentFallback isDiscoverMode={isDiscoverMode} />}>
            <ResourcesPageContent
              isDiscoverMode={isDiscoverMode}
              search={search}
              category={category}
              price={price}
              featured={featured}
              tag={tag}
              sort={sort}
              effectiveSort={effectiveSort}
              currentPage={currentPage}
              userId={userId}
            />
          </Suspense>
        </Container>
      </main>
    </div>
  );
}
