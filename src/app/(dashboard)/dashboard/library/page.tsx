import { requireSession } from "@/lib/auth/require-session";
import { LibraryGridClient } from "@/components/library/LibraryGridClient";
import { LastPurchaseRecovery } from "@/components/library/LastPurchaseRecovery";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getUserLibraryItems } from "@/services/purchase.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "My Library",
};

export const dynamic = "force-dynamic";

/**
 * A COMPLETED purchase is considered "just purchased" when its createdAt is
 * within this window.  Covers all realistic webhook processing delays while
 * preventing a stale old purchase from being mislabelled as newly bought.
 */
const RECENT_PURCHASE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default async function DashboardLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  return withRequestPerformanceTrace("route:/dashboard/library", {}, async () => {
  const { userId } = await traceServerStep(
    "dashboard_library.requireSession",
    () => requireSession("/dashboard/library"),
  );

  const resources = await traceServerStep(
    "dashboard_library.getUserLibraryItems",
    () => getUserLibraryItems(userId),
  );

  const params = searchParams ? await searchParams : {};
  const isReturningFromCheckout = params.payment === "success";

  // Derive recovery state from existing data — no extra query.
  // resources is sorted createdAt DESC, so resources[0] is always the newest
  // COMPLETED purchase.  A 15-minute recency window prevents a stale older
  // purchase from being surfaced as "just purchased".
  const mostRecent = resources[0] ?? null;
  const isRecentlyCompleted =
    mostRecent !== null &&
    Date.now() - new Date(mostRecent.purchasedAt).getTime() <
      RECENT_PURCHASE_WINDOW_MS;

  const showRecoveryBlock = isReturningFromCheckout && isRecentlyCompleted;
  const showPendingState = isReturningFromCheckout && !isRecentlyCompleted;

  const lastOpened = resources[0] ?? null;
  const lastDownload =
    resources.length > 0 ? formatDate(resources[0].purchasedAt) : null;

  return (
    <div>
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-2.5">
              <div>
                <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
                  My Library
                </h1>
                <p className="mt-1 text-small leading-6 text-zinc-500">
                  Open what you own, pick up where you left off, and find the right resource
                  quickly.
                </p>
              </div>

              {resources.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-zinc-500">
                  <span className="font-medium text-zinc-700">{resources.length} resources</span>
                  <span>{resources.length} downloads</span>
                  {lastDownload ? <span>Last added {lastDownload}</span> : null}
                </div>
              )}
            </div>

            {lastOpened ? (
              <div className="rounded-xl border border-surface-200 bg-white px-5 py-3.5">
                <p className="text-caption font-semibold text-zinc-500">Continue</p>
                <p className="mt-1 truncate text-small font-semibold text-zinc-900">
                  {lastOpened.title}
                </p>
                <p className="mt-1 text-caption text-zinc-400">
                  {lastOpened.authorName ?? "Unknown"}
                </p>
                <Link
                  href={`/resources/${lastOpened.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-small font-medium text-zinc-700 transition hover:bg-white"
                >
                  <BookOpen className="h-4 w-4" />
                  Open resource
                </Link>
              </div>
            ) : null}
          </section>

          {/* Post-payment recovery — shown when arriving from checkout success page.
              Rendered whether or not the grid has items: pending state covers the
              empty-library race condition, confirmed state surfaces the download. */}
          {(showRecoveryBlock || showPendingState) && (
            <LastPurchaseRecovery
              item={showRecoveryBlock ? mostRecent : null}
              isPending={showPendingState}
            />
          )}

          {resources.length > 0 && (
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
          )}

          {resources.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-200 bg-white py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-50">
                <BookOpen className="h-6 w-6 text-zinc-300" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-zinc-900">
                Your library is empty
              </h2>
              <p className="mt-1.5 max-w-sm text-small leading-6 text-zinc-500">
                Everything you get or purchase lands here. Find your first resource and start
                building your collection.
              </p>
              <Link
                href="/resources"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-small font-semibold text-white hover:bg-zinc-700"
              >
                <BookOpen className="h-4 w-4" />
                Find your first resource
              </Link>
            </div>
          )}
        </div>
    </div>
  );
  });
}
