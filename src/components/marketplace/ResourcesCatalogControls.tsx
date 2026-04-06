import { Suspense } from "react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { Container } from "@/design-system";
import {
  CategoryChips,
  DiscoverButton,
  type ChipCategory,
} from "@/components/marketplace/CategoryChips";
import {
  ChipsFallback,
  DiscoverFallback,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";
import { getDiscoverCategories } from "@/services/discover";

const CONTROLS_BAR_CLASS_NAME = "border-y border-border bg-background";
const CONTROLS_BAR_MAIN_CLASS_NAME = "flex min-w-0 items-center gap-2.5 overflow-hidden";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2.5 overflow-hidden";

export async function ResourcesCatalogControls() {
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
      <Container className="py-2 sm:py-2.5">
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
