import { Suspense } from "react";
import {
  isMissingTableError,
  isTransientPrismaInfrastructureError,
} from "@/lib/prismaErrors";
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
import { runBestEffortAsync, runWithTimeoutFallback } from "@/lib/async";

const RESOURCES_CATALOG_CATEGORIES_TIMEOUT_MS = 400;
const FALLBACK_DISCOVER_CATEGORIES = [
  { id: "category_art_creativity", name: "Art & Creativity", slug: "art-creativity" },
  { id: "category_early_learning", name: "Early Learning", slug: "early-learning" },
  { id: "category_humanities", name: "Humanities", slug: "humanities" },
  { id: "category_language", name: "Language", slug: "language" },
  { id: "category_mathematics", name: "Mathematics", slug: "mathematics" },
  { id: "category_science", name: "Science", slug: "science" },
  { id: "category_study_skills", name: "Study Skills", slug: "study-skills" },
  { id: "category_test_prep", name: "Test Prep", slug: "test-prep" },
] satisfies Awaited<ReturnType<typeof getDiscoverCategories>>;

const CONTROLS_BAR_CLASS_NAME = "bg-background";
const CONTROLS_BAR_MAIN_CLASS_NAME = "flex min-w-0 items-center gap-2.5 overflow-hidden";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2.5 overflow-hidden";

export async function ResourcesCatalogControls() {
  let categoriesWithCount: Awaited<ReturnType<typeof getDiscoverCategories>> =
    FALLBACK_DISCOVER_CATEGORIES;

  try {
    categoriesWithCount = await runWithTimeoutFallback(
      () =>
        runBestEffortAsync(() => getDiscoverCategories(), {
          fallback: FALLBACK_DISCOVER_CATEGORIES,
          warningLabel: "[RESOURCES_CATALOG_CATEGORIES_BEST_EFFORT]",
        }),
      {
        timeoutMs: RESOURCES_CATALOG_CATEGORIES_TIMEOUT_MS,
        fallback: FALLBACK_DISCOVER_CATEGORIES,
        warningLabel: "[RESOURCES_CATALOG_CATEGORIES_TIMEOUT]",
      },
    );
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isTransientPrismaInfrastructureError(error)
    ) {
      throw error;
    }

    console.error("[RESOURCES_CATALOG_CATEGORIES_FALLBACK]", {
      error:
        error instanceof Error
          ? { message: error.message, name: error.name }
          : String(error),
      fallbackApplied: true,
    });
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
