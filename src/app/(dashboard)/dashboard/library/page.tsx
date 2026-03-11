import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LibraryGridClient } from "@/components/library/LibraryGridClient";
import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Your Library – PaperDock",
  description: "Access all the resources you’ve downloaded on PaperDock.",
};

interface LibraryItem {
  purchaseId: string;
  purchasedAt: Date;
  id: string;
  slug: string;
  title: string;
  authorName?: string | null;
  previewUrl?: string | null;
  type: "PDF" | "DOCUMENT";
  categorySlug?: string | null;
}

function toCardResource(item: LibraryItem): ResourceCardResource {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    authorName: item.authorName,
    previewUrl: item.previewUrl,
    description: "",
    tags: [],
    isFree: true,
    price: 0,
  };
}

async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    include: {
      resource: {
        include: {
          author: { select: { name: true } },
          category: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return purchases
    .filter((p) => Boolean(p.resource))
    .map((p) => ({
      purchaseId: p.id,
      purchasedAt: p.createdAt,
      id: p.resource!.id,
      slug: p.resource!.slug,
      title: p.resource!.title,
      authorName: p.resource!.author?.name,
      previewUrl: p.resource!.previewUrl,
      type: p.resource!.type,
      categorySlug: p.resource!.category?.slug ?? null,
    }));
}

export default async function DashboardLibraryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/library");
  }

  const resources: LibraryItem[] = await getLibrary(
    session.user.id,
  );

  const totalResources = resources.length;
  const totalDownloads = resources.length;
  const lastDownload =
    resources.length > 0
      ? resources[0].purchasedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const lastOpened = resources[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header + top meta */}
      <div className="mb-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Your Library
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Access everything you&apos;ve downloaded and purchased on PaperDock.
          </p>
        </div>

        {resources.length > 0 && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Compact stats chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white/80 px-3 py-1 shadow-sm">
                <span className="uppercase tracking-tightest text-text-secondary">
                  Resources
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {totalResources}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white/80 px-3 py-1 shadow-sm">
                <span className="uppercase tracking-tightest text-text-secondary">
                  Downloads
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {totalDownloads}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white/80 px-3 py-1 shadow-sm">
                <span className="uppercase tracking-tightest text-text-secondary">
                  Last download
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {lastDownload ?? "—"}
                </span>
              </div>
            </div>

            {/* Continue where you left off – inline, no big card */}
            {lastOpened && (
              <div className="flex items-center gap-3 rounded-lg bg-white/90 px-3 py-2 text-sm shadow-sm ring-1 ring-border-subtle">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-tightest text-text-secondary">
                    Continue where you left off
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                    {lastOpened.title}
                  </p>
                </div>
                <Link
                  href={`/resources/${lastOpened.slug}`}
                  className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 h-8 text-[13px] font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <BookOpen className="h-4 w-4" />
                  Quick open
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {resources.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <BookOpen className="h-7 w-7 text-brand-500" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-text-primary">
            You haven&apos;t downloaded any resources yet.
          </h2>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            Browse the marketplace to find study guides, templates, and more.
            Free resources are available right now.
          </p>
          <Link
            href="/resources"
            className="mt-5 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Marketplace
          </Link>
        </Card>
      )}

      {/* Recent downloads */}
      {resources.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Recent downloads
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resources.slice(0, 4).map((item) => (
              <ResourceCard
                key={item.purchaseId}
                resource={toCardResource(item)}
                variant="library"
              />
            ))}
          </div>
        </section>
      )}

      {/* Library grid */}
      {resources.length > 0 && (
        <LibraryGridClient
          items={resources.map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            authorName: item.authorName,
            previewUrl: item.previewUrl,
            downloadedAt: item.purchasedAt,
            type: item.type,
            categorySlug: item.categorySlug,
          }))}
        />
      )}
    </div>
  );
}

