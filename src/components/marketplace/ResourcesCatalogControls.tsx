import { Suspense } from "react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { Container } from "@/components/layout/container";
import {
  CategoryChips,
  DiscoverButton,
  type ChipCategory,
} from "@/components/marketplace/CategoryChips";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { getDiscoverCategories } from "@/services/discover.service";

const CONTROLS_BAR_CLASS_NAME = "border-b border-surface-200 bg-white";
const CONTROLS_BAR_MAIN_CLASS_NAME = "flex min-w-0 items-center gap-2 overflow-hidden";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2 overflow-hidden";

type ResourcesCatalogControlsProps = {
  activeCount: number;
  showDiscoverMeta?: boolean;
};

export async function ResourcesCatalogControls({
  activeCount: _activeCount,
  showDiscoverMeta: _showDiscoverMeta = false,
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
        </div>
      </Container>
    </div>
  );
}

export function ResourcesCatalogControlsSkeleton({
  showDiscoverMeta: _showDiscoverMeta = false,
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
    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-4 text-base font-medium text-text-secondary shadow-sm">
      <LoadingSkeleton className="h-2 w-2 rounded-full bg-primary-500" />
      <span>กำลังโหลด</span>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 text-base text-text-muted shadow-sm sm:rounded-2xl">
      <LoadingSkeleton className="h-2.5 w-2.5 rounded-full bg-primary-500" />
      <span>กำลังค้นหา...</span>
    </div>
  );
}

function ChipsFallback() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {["กำลังโหลด", "หมวดหมู่", "ยอดนิยม", "ล่าสุด", "เพิ่มเติม"].map((label, index) => (
        <div
          key={label}
          className={`inline-flex h-10 shrink-0 items-center rounded-full border border-surface-200 bg-surface-50 px-4 text-base text-text-muted ${
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
