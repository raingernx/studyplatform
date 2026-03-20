import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { ResourceSection } from "./ResourceSection";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";
import { RESOURCE_GRID_CLASSES } from "@/components/resources/ResourceGrid";
import Link from "next/link";
import { ArrowRight, Sparkles, Grid3x3 } from "lucide-react";
import { getPlatform } from "@/services/platform.service";

/**
 * Full-page marketplace home sections.
 * Rendered only when no search / filter params are active.
 * Server component — queries Prisma directly.
 */
export async function MarketplaceHome() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const platform = await getPlatform();

  const listedWhere = LISTED_RESOURCE_WHERE;
  const [trendingRaw, newReleasesRaw, categories, purchases] = await Promise.all([
    prisma.resource.findMany({
      where: listedWhere,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        previews: { orderBy: { order: "asc" }, select: { imageUrl: true } },
        _count: { select: { purchases: true, reviews: true } },
      },
      orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.resource.findMany({
      where: listedWhere,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        previews: { orderBy: { order: "asc" }, select: { imageUrl: true } },
        _count: { select: { purchases: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { resources: { some: listedWhere } },
      include: {
        resources: {
          where: listedWhere,
          include: {
            author: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
            previews: { orderBy: { order: "asc" }, select: { imageUrl: true } },
            _count: { select: { purchases: true, reviews: true } },
          },
          orderBy: { downloadCount: "desc" },
          take: 8,
        },
      },
      orderBy: { name: "asc" },
      take: 4,
    }),
    userId
      ? prisma.purchase.findMany({
          where: {
            userId,
            status: "COMPLETED",
          },
          select: { resourceId: true },
        })
      : Promise.resolve([] as { resourceId: string }[]),
  ]);

  const ownedIds: string[] = (purchases as { resourceId: string }[]).map(
    (p) => p.resourceId
  );

  const withPreviewUrl = <T extends { previewUrl?: string | null; previews?: { imageUrl: string }[] }>(
    r: T
  ): T & { previewUrl: string | null } => ({
    ...r,
    previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null,
  });
  const trending = trendingRaw.map(withPreviewUrl);
  const newReleases = newReleasesRaw.map(withPreviewUrl);
  const categoriesWithPreviews = categories.map((c) => ({
    ...c,
    resources: c.resources.map(withPreviewUrl),
  }));

  const hasTrending = trending.length > 0;
  const hasNew = newReleases.length > 0;
  const hasCats = categoriesWithPreviews.some((c) => c.resources.length > 0);

  if (!hasTrending && !hasNew && !hasCats) {
    return <EmptyMarketplace platformShortName={platform.platformShortName} />;
  }

  return (
    <div className="space-y-12">
      {/* ── Trending ────────────────────────────────────────────── */}
      {hasTrending && (
        <ResourceSection
          title="Trending resources"
          viewAllHref="/resources?sort=trending"
          resources={trending as ResourceCardData[]}
          ownedIds={ownedIds}
        />
      )}

      {/* ── Category sections ───────────────────────────────────── */}
      {categoriesWithPreviews
        .filter((c) => c.resources.length > 0)
        .map((cat) => (
          <ResourceSection
            key={cat.id}
            title={cat.name}
            viewAllHref={`/resources?category=${cat.slug}`}
            resources={cat.resources as ResourceCardData[]}
            ownedIds={ownedIds}
          />
        ))}

      {/* ── New releases ────────────────────────────────────────── */}
      {hasNew && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-h3 font-semibold tracking-tight text-zinc-900">
              New releases
            </h2>
            <Link
              href="/resources?sort=newest"
              className="flex items-center gap-1 text-[13px] font-medium text-brand-600 transition hover:text-brand-700"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className={RESOURCE_GRID_CLASSES}>
            {newReleases.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r as ResourceCardData}
                variant="marketplace"
                owned={ownedIds.includes(r.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Creator CTA ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-center text-white">
        <div className="mx-auto max-w-md">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="h-6 w-6 text-amber-300" />
          </span>
          <h2 className="mt-4 font-display text-h3 font-semibold">
            Share your knowledge
          </h2>
          <p className="mt-2 text-[14px] text-zinc-400">
            Sell your worksheets, flashcards, and study guides to students
            worldwide.
          </p>
          <Link
            href="/admin/resources/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            <Grid3x3 className="h-4 w-4" />
            Start selling
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyMarketplace({
  platformShortName,
}: {
  platformShortName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50">
        <Grid3x3 className="h-7 w-7 text-zinc-300" />
      </span>
      <p className="mt-4 font-semibold text-zinc-900">
        No resources yet
      </p>
      <p className="mt-1.5 max-w-xs text-[13px] text-zinc-500">
        Be the first to publish a resource on {platformShortName}.
      </p>
      <Link
        href="/admin/resources/new"
        className="mt-5 inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700"
      >
        Add a resource
      </Link>
    </div>
  );
}
