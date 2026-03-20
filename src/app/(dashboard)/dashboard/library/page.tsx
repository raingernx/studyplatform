import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LibraryGridClient } from "@/components/library/LibraryGridClient";
import Link from "next/link";
import { BookOpen, Download } from "lucide-react";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "My Library",
};

export const dynamic = "force-dynamic";

interface LibraryItem {
  purchaseId: string;
  purchasedAt: Date;
  id: string;
  slug: string;
  title: string;
  authorName?: string | null;
  previewUrl?: string | null;
  mimeType?: string | null;
  type: "PDF" | "DOCUMENT";
  categorySlug?: string | null;
}

async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
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
      mimeType: p.resource!.mimeType,
      type: p.resource!.type,
      categorySlug: p.resource!.category?.slug ?? null,
    }));
}

export default async function DashboardLibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/dashboard/library");

  const resources = await getLibrary(session.user.id);

  const lastOpened = resources[0] ?? null;
  const lastDownload =
    resources.length > 0 ? formatDate(resources[0].purchasedAt) : null;

  return (
    <div>
        {/* Header */}
        <div className="mb-6 flex items-start">
          <div>
            <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
              My Library
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              Access everything you&apos;ve downloaded and purchased.
            </p>
          </div>
        </div>

        {resources.length > 0 && (
          <>
            {/* Stats + Continue row */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Stat chips */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                  <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-900">
                    {resources.length}
                  </span>
                  <span className="text-[11px] text-zinc-400">Resources</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                  <Download className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-900">
                    {resources.length}
                  </span>
                  <span className="text-[11px] text-zinc-400">Downloads</span>
                </div>
                {lastDownload && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                    <span className="text-[11px] text-zinc-400">
                      Last download:
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-900">
                      {lastDownload}
                    </span>
                  </div>
                )}
              </div>

              {/* Continue where you left off */}
              {lastOpened && (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      Continue
                    </p>
                    <p className="mt-0.5 max-w-[160px] truncate text-[13px] font-semibold text-zinc-900">
                      {lastOpened.title}
                    </p>
                  </div>
                  <Link
                    href={`/resources/${lastOpened.slug}`}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Open
                  </Link>
                </div>
              )}
            </div>

            {/* Library grid (search + filter + grid inside) */}
            <LibraryGridClient
              items={resources.map((item) => ({
                id: item.id,
                slug: item.slug,
                title: item.title,
                authorName: item.authorName,
                previewUrl: item.previewUrl,
                mimeType: item.mimeType,
                downloadedAt: item.purchasedAt,
                type: item.type,
                categorySlug: item.categorySlug,
              }))}
            />
          </>
        )}

        {/* Empty state */}
        {resources.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <BookOpen className="h-7 w-7 text-blue-400" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold text-zinc-900">
              Your library is empty
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] text-zinc-500">
              Browse the marketplace to find study guides, templates, and more.
            </p>
            <Link
              href="/resources"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700"
            >
              <BookOpen className="h-4 w-4" />
              Browse marketplace
            </Link>
          </div>
        )}
    </div>
  );
}
