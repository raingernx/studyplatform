import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { LibraryGridClient } from "@/components/library/LibraryGridClient";
import { LastPurchaseRecovery } from "@/components/library/LastPurchaseRecovery";
import { BookOpen } from "lucide-react";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getUserLibraryItems } from "@/services/purchases";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { DashboardLibraryResultsSkeleton } from "@/components/skeletons/DashboardUserRouteSkeletons";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "My Library",
};

export const dynamic = "force-dynamic";

const RECENT_PURCHASE_WINDOW_MS = 15 * 60 * 1000;

async function LibraryResultsSection({
  isReturningFromCheckout,
  resourcesPromise,
}: {
  isReturningFromCheckout: boolean;
  resourcesPromise: ReturnType<typeof getUserLibraryItems>;
}) {
  const resources = await resourcesPromise;
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
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-2.5">
          {resources.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-muted-foreground">
              <span className="font-medium text-foreground">
                {resources.length} resources
              </span>
              <span>{resources.length} downloads</span>
              {lastDownload ? <span>Last added {lastDownload}</span> : null}
            </div>
          )}
        </div>

        {lastOpened ? (
          <div className="rounded-xl border border-border bg-card px-5 py-3.5">
            <p className="text-caption font-semibold text-muted-foreground">
              Continue
            </p>
            <p className="mt-1 truncate text-small font-semibold text-foreground">
              {lastOpened.title}
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              {lastOpened.authorName ?? "Unknown"}
            </p>
            <ResourceIntentLink
              href={routes.resource(lastOpened.slug)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted px-4 py-2.5 text-small font-medium text-foreground transition hover:bg-card"
            >
              <BookOpen className="h-4 w-4" />
              Open resource
            </ResourceIntentLink>
          </div>
        ) : null}
      </section>

      {(showRecoveryBlock || showPendingState) && (
        <LastPurchaseRecovery
          item={showRecoveryBlock ? mostRecent : null}
          isPending={showPendingState}
        />
      )}

      {resources.length > 0 ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Your library is empty
          </h2>
          <p className="mt-1.5 max-w-sm text-small leading-6 text-muted-foreground">
            Everything you get or purchase lands here. Find your first
            resource and start building your collection.
          </p>
          <Link
            href={routes.marketplace}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-small font-semibold text-background transition hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" />
            Find your first resource
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function DashboardLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const isReturningFromCheckout = params.payment === "success";

  return withRequestPerformanceTrace(
    "route:/dashboard/library",
    {
      paymentFlow: isReturningFromCheckout ? "success_return" : "direct",
    },
    async () => {
      const { userId } = await traceServerStep(
        "dashboard_library.requireSession",
        () => requireSession(routes.library),
      );

      const resourcesPromise = traceServerStep(
        "dashboard_library.getUserLibraryItems",
        () => getUserLibraryItems(userId),
      );

      return (
        <div data-route-shell-ready="dashboard-library">
          <div className="min-w-0 space-y-8">
            <DashboardPageHeader
              title="My Library"
              description="Open what you own, pick up where you left off, and find the right resource quickly."
            />

            <Suspense fallback={<DashboardLibraryResultsSkeleton />}>
              <LibraryResultsSection
                isReturningFromCheckout={isReturningFromCheckout}
                resourcesPromise={resourcesPromise}
              />
            </Suspense>
          </div>
        </div>
      );
    },
  );
}
