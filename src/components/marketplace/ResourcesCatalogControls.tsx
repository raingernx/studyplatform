import { Suspense } from "react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { Container } from "@/components/layout/container";
import {
  CategoryChips,
  DiscoverButton,
  type ChipCategory,
} from "@/components/marketplace/CategoryChips";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";
import { MobileFilterDialog } from "@/components/marketplace/MobileFilterDialog";
import { type FilterCategory } from "@/components/marketplace/FilterSidebar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { getDiscoverCategories } from "@/services/discover.service";

const CONTROLS_BAR_CLASS_NAME = "border-b border-surface-200/80 bg-white/95";
const CONTROLS_BAR_MAIN_CLASS_NAME =
  "flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2 overflow-hidden";
const CONTROLS_BAR_ACTIONS_CLASS_NAME =
  "flex flex-col items-start gap-1.5 lg:items-end";

type ResourcesCatalogControlsProps = {
  activeCount: number;
  showDiscoverMeta?: boolean;
};

export async function ResourcesCatalogControls({
  activeCount,
  showDiscoverMeta = false,
}: ResourcesCatalogControlsProps) {
  let categoriesWithCount: Awaited<ReturnType<typeof getDiscoverCategories>> = [];

  try {
    categoriesWithCount = await getDiscoverCategories();
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  const categories = categoriesWithCount.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));
  const categoryCount = categoriesWithCount.length;
  const resourceCount = categoriesWithCount.reduce(
    (sum, category) => sum + category._count.resources,
    0,
  );

  return (
    <div className={CONTROLS_BAR_CLASS_NAME}>
      <Container className="py-2.5 sm:py-3">
        <div className={CONTROLS_BAR_MAIN_CLASS_NAME}>
          <div className={CONTROLS_BAR_GROUP_CLASS_NAME}>
            <Suspense fallback={<DiscoverFallback />}>
              <DiscoverButton />
            </Suspense>
            <ScrollableCategoryNav>
              <Suspense fallback={<ChipsFallback />}>
                <CategoryChips categories={categories as ChipCategory[]} />
              </Suspense>
            </ScrollableCategoryNav>
          </div>

          <div className={CONTROLS_BAR_ACTIONS_CLASS_NAME}>
            <MobileFilterDialog
              categories={categories as FilterCategory[]}
              activeCount={activeCount}
              className="shrink-0"
            />
            {showDiscoverMeta ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
                <span>{categoryCount} categories</span>
                <span className="text-text-muted/80" aria-hidden>
                  •
                </span>
                <span>{resourceCount} resources</span>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ResourcesCatalogControlsSkeleton({
  showDiscoverMeta = false,
}: {
  showDiscoverMeta?: boolean;
}) {
  return (
    <div className={CONTROLS_BAR_CLASS_NAME}>
      <Container className="py-2.5 sm:py-3">
        <div className={CONTROLS_BAR_MAIN_CLASS_NAME}>
          <div className={CONTROLS_BAR_GROUP_CLASS_NAME}>
            <DiscoverFallback />
            <ScrollableCategoryNav>
              <ChipsFallback />
            </ScrollableCategoryNav>
          </div>

          <div className={CONTROLS_BAR_ACTIONS_CLASS_NAME}>
            <FiltersButtonFallback />
            {showDiscoverMeta ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
                <LoadingSkeleton className="h-4 w-20" />
                <span className="text-text-muted/80" aria-hidden>
                  •
                </span>
                <LoadingSkeleton className="h-4 w-24" />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ResourcesCatalogSearchSkeleton() {
  return <SearchFallback />;
}

function DiscoverFallback() {
  return (
    <div className="inline-flex h-9 sm:h-8 items-center gap-2 rounded-full border border-surface-200 bg-white px-3 text-sm font-medium text-text-secondary shadow-sm sm:px-3.5">
      <LoadingSkeleton className="h-2 w-2 rounded-full bg-primary-500" />
      <span>Loading</span>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="flex h-11 sm:h-10 w-full items-center gap-3 rounded-xl sm:rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-muted shadow-sm">
      <LoadingSkeleton className="h-2.5 w-2.5 rounded-full bg-primary-500" />
      <span>Loading search…</span>
    </div>
  );
}

function FiltersButtonFallback() {
  return (
    <div className="inline-flex h-11 sm:h-10 w-full shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-surface-200 bg-surface-50 px-3.5 text-sm font-medium text-text-muted sm:w-auto">
      Filters
    </div>
  );
}

function ChipsFallback() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {["Loading", "Categories", "Popular", "Recent"].map((label, index) => (
        <div
          key={label}
          className={`inline-flex h-9 sm:h-8 shrink-0 items-center rounded-full border border-surface-200 bg-surface-50 px-3 text-sm text-text-muted ${
            index === 0 ? "gap-2 pr-4" : ""
          }`}
        >
          {index === 0 ? (
            <LoadingSkeleton className="h-2 w-2 rounded-full bg-primary-500" />
          ) : null}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
