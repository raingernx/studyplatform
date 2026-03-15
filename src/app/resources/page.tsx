import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Languages,
  LayoutGrid,
  Palette,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { HeroBanner } from "@/components/marketplace/HeroBanner";
import { DiscoverButton, CategoryChips, type ChipCategory } from "@/components/marketplace/CategoryChips";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { FilterSidebar, type FilterCategory } from "@/components/marketplace/FilterSidebar";
import { CreatorCTA } from "@/components/discover/CreatorCTA";
import { BlogSection } from "@/components/discover/BlogSection";
import { EmailSignup } from "@/components/discover/EmailSignup";
import { formatNumber } from "@/lib/format";

// ── Service imports ───────────────────────────────────────────────────────────

import {
  getDiscoverData,
  getDiscoverCategories,
  getHeroConfig,
  type DiscoverData,
} from "@/services/discover.service";
import { getMarketplaceResources } from "@/services/resource.service";
import { getOwnedResourceIds } from "@/services/purchase.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PaperDock — Discover Study Resources",
  description: "Browse and download study resources.",
};

// ── Config ────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

interface ResourcesPageProps {
  searchParams: {
    search?: string;
    category?: string;
    price?: string;
    featured?: string;
    tag?: string;
    sort?: string;
    page?: string;
  };
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resolvedParams =
    typeof (searchParams as Promise<unknown>)?.then === "function"
      ? await (searchParams as Promise<Record<string, string | undefined>>)
      : (searchParams as Record<string, string | undefined>);

  const {
    search,
    category,
    price,
    featured,
    tag,
    sort = "newest",
    page: pageParam,
  } = resolvedParams;

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Discover = no category selected; Category = any category (including "all")
  const isDiscoverMode = !category;

  const session = await getServerSession(authOptions);
  const userId  = session?.user?.id;

  // ── Mode-specific data ──────────────────────────────────────────────────────

  let categories: { id: string; name: string; slug: string }[] = [];
  let discoverCategoriesWithCount: { id: string; name: string; slug: string; _count: { resources: number } }[] = [];
  let resources: ResourceCardData[] = [];
  let total      = 0;
  let totalPages = 1;
  let safePage   = 1;
  let discoverData: DiscoverData | null = null;
  let heroConfig: Awaited<ReturnType<typeof getHeroConfig>> = null;

  if (isDiscoverMode) {
    const [heroResult, categoriesWithCount, data] = await Promise.all([
      getHeroConfig(),
      getDiscoverCategories(),
      getDiscoverData(),
    ]);
    heroConfig     = heroResult;
    categories     = categoriesWithCount.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    discoverData   = data;
    discoverCategoriesWithCount = categoriesWithCount;
  } else {
    const data = await getMarketplaceResources({
      search,
      category,
      price,
      featured: featured === "true",
      tag,
      sort,
      page:     currentPage,
      pageSize: ITEMS_PER_PAGE,
    });
    resources   = data.resources as ResourceCardData[];
    total       = data.total;
    categories  = data.categories;
    totalPages  = data.totalPages;
    safePage    = Math.min(currentPage, totalPages);
    discoverCategoriesWithCount = [];
  }

  // ── Owned IDs (both modes) ──────────────────────────────────────────────────

  const ownedIds = userId ? await getOwnedResourceIds(userId) : new Set<string>();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] space-y-8 px-6 py-8 sm:px-8">

          {/* ── Hero (discover only) ──────────────────────────────────────── */}
          {isDiscoverMode && (
            <section>
              <HeroBanner config={heroConfig} />
            </section>
          )}

          {/* ── Category nav + Search (always visible) ────────────────────── */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 items-center gap-4">
              <Suspense fallback={<DiscoverFallback />}>
                <DiscoverButton />
              </Suspense>
              <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
              <ScrollableCategoryNav>
                <Suspense fallback={<ChipsFallback />}>
                  <CategoryChips categories={categories as ChipCategory[]} />
                </Suspense>
              </ScrollableCategoryNav>
            </div>

            <div className="w-full max-w-lg shrink-0">
              <Suspense fallback={<SearchFallback />}>
                <HeroSearch />
              </Suspense>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* DISCOVER MODE — curated sections, no sidebar                    */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {isDiscoverMode && discoverData && (
            <div className="space-y-12">

              {/* Browse by category */}
              {discoverCategoriesWithCount.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Browse by category
                  </h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {discoverCategoriesWithCount.map((cat) => {
                      const Icon  = getCategoryIcon(cat.slug);
                      const color = getCategoryColor(cat.slug);
                      return (
                        <Link
                          key={cat.id}
                          href={`/resources?category=${encodeURIComponent(cat.slug)}`}
                          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block font-medium text-zinc-900">{cat.name}</span>
                            <span className="block text-[13px] text-zinc-500">
                              {formatNumber(cat._count.resources)} resources
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Trending resources */}
              {discoverData.trending.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Trending resources"
                    viewAllHref="/resources?sort=trending&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.trending as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Recommended for you */}
              {discoverData.recommended.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Recommended for you"
                    viewAllHref="/resources?sort=trending&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.recommended as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* New releases */}
              {discoverData.newReleases.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="New releases"
                    viewAllHref="/resources?sort=newest&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.newReleases as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Featured picks */}
              {discoverData.featured.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Featured picks"
                    viewAllHref="/resources?sort=featured&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.featured as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Free resources */}
              {discoverData.freeResources.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Free resources"
                    viewAllHref="/resources?price=free&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.freeResources as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Most downloaded */}
              {discoverData.mostDownloaded.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Most downloaded"
                    viewAllHref="/resources?sort=downloads&category=all"
                  />
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {(discoverData.mostDownloaded as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <CreatorCTA />
              <BlogSection />
              <EmailSignup />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY MODE — filter sidebar + paginated grid                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {!isDiscoverMode && (
            <section>
              <div className="flex gap-8">
                {/* Sidebar filters */}
                <Suspense fallback={<SidebarFallback />}>
                  <FilterSidebar categories={categories as FilterCategory[]} />
                </Suspense>

                {/* Sort bar + grid */}
                <div className="min-w-0 flex-1 space-y-5">
                  <Suspense fallback={<FilterBarFallback />}>
                    <FilterBar total={total} />
                  </Suspense>

                  {search?.trim() && (
                    <p className="text-[13px] text-zinc-500">
                      {total === 0 ? (
                        <>
                          No results for{" "}
                          <strong className="text-zinc-900">
                            &ldquo;{search.trim()}&rdquo;
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Showing results for{" "}
                          <strong className="text-zinc-900">
                            &ldquo;{search.trim()}&rdquo;
                          </strong>
                        </>
                      )}
                    </p>
                  )}

                  <ResourceGrid
                    resources={resources}
                    ownedIds={Array.from(ownedIds)}
                    total={total}
                    page={safePage}
                    totalPages={totalPages}
                  />
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Category icon and color mapping ───────────────────────────────────────────

function getCategoryIcon(slug: string): typeof Calculator {
  const s = slug.toLowerCase();
  if (s.includes("math"))          return Calculator;
  if (s.includes("science"))       return FlaskConical;
  if (s.includes("humanities"))    return BookOpen;
  if (s.includes("language"))      return Languages;
  if (s.includes("art"))           return Palette;
  if (s.includes("early-learning"))return GraduationCap;
  if (s.includes("study-skills"))  return ClipboardList;
  if (s.includes("test-prep"))     return GraduationCap;
  return LayoutGrid;
}

function getCategoryColor(slug: string): { bg: string; text: string } {
  const s = slug.toLowerCase();
  if (s.includes("math"))          return { bg: "bg-blue-100",   text: "text-blue-600" };
  if (s.includes("science"))       return { bg: "bg-green-100",  text: "text-green-600" };
  if (s.includes("language"))      return { bg: "bg-orange-100", text: "text-orange-600" };
  if (s.includes("humanities"))    return { bg: "bg-purple-100", text: "text-purple-600" };
  if (s.includes("art"))           return { bg: "bg-pink-100",   text: "text-pink-600" };
  if (s.includes("early-learning"))return { bg: "bg-yellow-100", text: "text-yellow-600" };
  if (s.includes("study-skills"))  return { bg: "bg-indigo-100", text: "text-indigo-600" };
  if (s.includes("test-prep"))     return { bg: "bg-red-100",    text: "text-red-600" };
  return { bg: "bg-zinc-100", text: "text-zinc-600" };
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  viewAllHref,
}: {
  title:       string;
  viewAllHref: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <Link
        href={viewAllHref}
        className="group flex items-center gap-1 text-[13px] font-medium text-brand-600 transition hover:underline hover:text-brand-700"
      >
        View all
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

// ── Fallback skeletons ────────────────────────────────────────────────────────

function DiscoverFallback() {
  return (
    <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-100" />
  );
}

function SearchFallback() {
  return (
    <div className="h-10 w-full animate-pulse rounded-xl border border-surface-200 bg-white shadow-sm" />
  );
}

function ChipsFallback() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[48, 64, 72, 56, 80, 60].map((w, i) => (
        <div
          key={i}
          className="h-8 shrink-0 animate-pulse rounded-full bg-surface-100"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

function FilterBarFallback() {
  return (
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
      <div className="flex gap-2">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-surface-100" />
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="w-[220px] flex-shrink-0 space-y-4">
      {[80, 120, 80, 60].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-zinc-100"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
