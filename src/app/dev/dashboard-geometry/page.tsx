import { notFound } from "next/navigation";

import { Container } from "@/design-system";
import { getCachedServerSession } from "@/lib/auth";
import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import {
  DashboardDownloadsBonesPreview,
  DashboardLibraryBonesPreview,
  DashboardPurchasesBonesPreview,
  DashboardSubscriptionBonesPreview,
} from "@/components/skeletons/DashboardUserRouteSkeletons";
import { SettingsPageSkeletonBonesPreview } from "@/components/skeletons/SettingsPageSkeleton";
import {
  CreatorDashboardAnalyticsBonesPreview,
  CreatorDashboardOverviewBonesPreview,
  CreatorDashboardProfileBonesPreview,
  CreatorDashboardResourcesBonesPreview,
  CreatorDashboardSalesBonesPreview,
} from "@/components/skeletons/CreatorDashboardRouteSkeletons";
import {
  getUserDownloadHistorySurfaceSummary,
  getUserPurchaseHistorySurfaceSummary,
} from "@/services/purchases";
import {
  getCreatorAnalyticsSurfaceSummaryForWorkspace,
  getCreatorProfile,
  getCreatorResourceManagementSurfaceSummary,
  getCreatorSalesSurfaceSummaryForWorkspace,
} from "@/services/creator";

export const metadata = {
  title: "Dashboard Geometry Proof",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function DashboardGeometryProofPage({
  searchParams,
}: {
  searchParams?: Promise<{
    libraryVariant?: string;
    subscriptionVariant?: string;
  }>;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  const libraryVariant =
    params.libraryVariant === "empty" ? "empty" : "populated";
  const subscriptionVariant =
    params.subscriptionVariant === "active" || params.subscriptionVariant === "free"
      ? params.subscriptionVariant
      : "unknown";
  const tokenSnapshot = await getServerAuthTokenSnapshot();
  const session =
    !tokenSnapshot.authenticated || !tokenSnapshot.userId
      ? await getCachedServerSession()
      : null;
  const userId = tokenSnapshot.userId ?? session?.user?.id ?? null;

  const purchasesSurface = userId
    ? await getUserPurchaseHistorySurfaceSummary(userId)
    : { count: 0, rowCount: 1 };
  const downloadsSurface = userId
    ? await getUserDownloadHistorySurfaceSummary(userId)
    : { count: 0, rowCount: 1 };
  const creatorResourcesSurface = userId
    ? await getCreatorResourceManagementSurfaceSummary(userId, {
        status: "all",
        pricing: "all",
        sort: "latest",
      })
    : { count: 0, rowCount: 1 };
  const creatorProfile = userId ? await getCreatorProfile(userId) : null;
  const creatorSalesSurface = userId
    ? await getCreatorSalesSurfaceSummaryForWorkspace(userId)
    : { count: 0, rowCount: 1 };
  const creatorAnalyticsSurface = userId
    ? await getCreatorAnalyticsSurfaceSummaryForWorkspace(userId, "30d")
      : {
        seriesRowCount: 8,
        resourceReviewRowCount: 8,
        recentReviewsRowCount: 4,
        recentActivityRowCount: 4,
      };

  return (
    <main className="min-h-screen bg-background py-6 text-foreground">
      <Container className="space-y-10">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Dashboard geometry proof
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Targeted dashboard skeleton previews
          </h1>
        </header>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Membership</p>
          <DashboardSubscriptionBonesPreview planVariant={subscriptionVariant} />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">My Library</p>
          <DashboardLibraryBonesPreview variant={libraryVariant} />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Downloads</p>
          <DashboardDownloadsBonesPreview
            rowCount={downloadsSurface.rowCount}
            variant={downloadsSurface.count === 0 ? "empty" : "populated"}
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Purchases</p>
          <DashboardPurchasesBonesPreview
            rowCount={purchasesSurface.rowCount}
            variant={purchasesSurface.count === 0 ? "empty" : "populated"}
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Settings</p>
          <SettingsPageSkeletonBonesPreview />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator overview</p>
          <CreatorDashboardOverviewBonesPreview />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator analytics</p>
          <CreatorDashboardAnalyticsBonesPreview
            seriesRowCount={creatorAnalyticsSurface.seriesRowCount}
            resourceReviewRowCount={creatorAnalyticsSurface.resourceReviewRowCount}
            recentReviewsRowCount={creatorAnalyticsSurface.recentReviewsRowCount}
            recentActivityRowCount={creatorAnalyticsSurface.recentActivityRowCount}
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator resources</p>
          <CreatorDashboardResourcesBonesPreview
            rowCount={creatorResourcesSurface.rowCount}
            variant={creatorResourcesSurface.count === 0 ? "empty" : "populated"}
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator sales</p>
          <CreatorDashboardSalesBonesPreview
            rowCount={creatorSalesSurface.rowCount}
            variant={creatorSalesSurface.count === 0 ? "empty" : "populated"}
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator profile</p>
          <CreatorDashboardProfileBonesPreview
            hasPublicProfile={Boolean(creatorProfile?.creatorSlug)}
          />
        </section>
      </Container>
    </main>
  );
}
