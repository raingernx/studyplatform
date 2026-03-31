import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { Container } from "@/components/layout/container";
import { Badge } from "@/design-system";
import { ResourceGrid, RESOURCE_GRID_CLASSES } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { routes } from "@/lib/routes";
import { getMarketplaceResources } from "@/services/resources/public-resource-read.service";

const CATEGORY_META: Record<
  string,
  { emoji: string; color: string; description: string }
> = {
  mathematics: {
    emoji: "📐",
    color: "from-blue-600 to-blue-800",
    description:
      "Worksheets, practice sets, and study guides covering algebra, calculus, geometry, and more.",
  },
  science: {
    emoji: "🔬",
    color: "from-emerald-600 to-teal-800",
    description:
      "Lab guides, exam prep packs, and reference materials for physics, chemistry, and biology.",
  },
  humanities: {
    emoji: "📚",
    color: "from-purple-600 to-purple-800",
    description:
      "Study guides and essay frameworks for history, literature, philosophy, and social studies.",
  },
  languages: {
    emoji: "🌐",
    color: "from-orange-500 to-rose-700",
    description:
      "Grammar references, vocabulary sheets, and reading comprehension packs for every language.",
  },
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function getCategoryResources(slug: string) {
  try {
    const data = await getMarketplaceResources({
      category: slug,
      page: 1,
      pageSize: 12,
      sort: "newest",
    });

    return { items: data.resources, total: data.total };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} Resources`,
    description: CATEGORY_META[slug]?.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const meta = CATEGORY_META[slug] ?? {
    emoji: "📄",
    color: "from-slate-600 to-slate-800",
    description: "Explore resources in this category.",
  };

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const { items, total } = await getCategoryResources(slug);

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${meta.color}`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <Container className="relative space-y-6 pb-12 pt-10 lg:pb-14 lg:pt-12">
          <Link
            href={routes.marketplace}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All resources
          </Link>

          <div className="flex items-center gap-4 sm:gap-5">
            <span className="text-5xl">{meta.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {categoryName}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/70 leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white ring-white/20">
              <BookOpen className="mr-1.5 h-3 w-3" />
              {total} resource{total !== 1 ? "s" : ""}
            </Badge>
          </div>
        </Container>
      </div>

      {/* Resources */}
      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-surface-200 bg-white/85 p-4 shadow-card sm:p-5 lg:p-6">
              <div className="mb-6 flex flex-col gap-3 border-b border-surface-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Curated collection
                  </p>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                    Latest in {categoryName}
                  </h2>
                  <p className="text-sm leading-6 text-text-secondary">
                    Browse the newest and most useful resources in this category with the same calm rhythm as the wider marketplace.
                  </p>
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  {total} resource{total !== 1 ? "s" : ""}
                </p>
              </div>
              <Suspense fallback={null}>
                <ResourceGrid
                  resources={items}
                  total={total}
                  page={1}
                  totalPages={1}
                />
              </Suspense>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
