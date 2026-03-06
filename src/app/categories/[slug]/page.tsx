import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { Badge } from "@/components/ui/Badge";
import { getBaseUrl } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

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
  params: { slug: string };
}

async function getCategoryResources(slug: string) {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/resources?category=${slug}&pageSize=12`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return { items: [], total: 0 };
    const json = await res.json();
    return { items: json.data?.items ?? [], total: json.data?.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  return {
    title: `${name} Resources`,
    description: CATEGORY_META[params.slug]?.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const meta = CATEGORY_META[slug] ?? {
    emoji: "📄",
    color: "from-slate-600 to-slate-800",
    description: "Explore resources in this category.",
  };

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const { items, total } = await getCategoryResources(slug);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero banner */}
      <div
        className={`bg-gradient-to-br ${meta.color} relative overflow-hidden px-4 pb-12 pt-10 sm:px-6 lg:px-8`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/resources"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All resources
          </Link>

          <div className="flex items-center gap-4">
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

          <div className="mt-6 flex items-center gap-3">
            <Badge variant="blue" className="bg-white/20 text-white ring-white/20">
              <BookOpen className="mr-1.5 h-3 w-3" />
              {total} resource{total !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </div>

      {/* Resources */}
      <main className="flex-1 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <ResourceGrid
              initialResources={items}
              categories={[]}
            />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
