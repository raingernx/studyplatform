import {
  AdminAnalyticsCreatorActivationBonesPreview,
  AdminAnalyticsOverviewBonesPreview,
  AdminAnalyticsPurchasesBonesPreview,
  AdminAnalyticsRankingBonesPreview,
  AdminAnalyticsRankingExperimentBonesPreview,
  AdminAnalyticsRecommendationsBonesPreview,
} from "@/components/skeletons/AdminAnalyticsRouteSkeletons";
import {
  DashboardDownloadsBonesPreview,
  DashboardLibraryBonesPreview,
  DashboardOverviewBonesPreview,
  DashboardPurchasesBonesPreview,
  DashboardSubscriptionBonesPreview,
} from "@/components/skeletons/DashboardUserRouteSkeletons";
import { AdminResourceFormLoadingShellBonesPreview } from "@/components/admin/resources/AdminResourceFormLoadingShell";
import { notFound } from "next/navigation";
import {
  HeroSearchEmptyBonesPreview,
  HeroSearchQuickBrowseBonesPreview,
  HeroSearchResultsBonesPreview,
} from "@/components/marketplace/HeroSearchPreviews";
import {
  ResourcesCatalogControlsBonesPreview,
  ResourcesCatalogSearchBonesPreview,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import { ResourcesDiscoverPersonalizedBonesPreview } from "@/components/resources/ResourcesDiscoverPersonalizedSection";
import { SearchRecoveryPanelBonesPreview } from "@/components/resources/SearchRecoveryPanel";
import { CreatorResourceFormLoadingShellBonesPreview } from "@/components/creator/CreatorResourceFormLoadingShell";
import { ResourceCardBonesPreview } from "@/components/resources/ResourceCardSkeleton";
import { ResourceDetailLoadingShellBonesPreview } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { CreatorApplyPageSkeletonBonesPreview } from "@/components/skeletons/CreatorApplyPageSkeleton";
import { AdminSettingsPageSkeletonBonesPreview } from "@/components/skeletons/AdminSettingsPageSkeleton";
import {
  CreatorDashboardAnalyticsBonesPreview,
  CreatorDashboardOverviewBonesPreview,
  CreatorDashboardProfileBonesPreview,
  CreatorDashboardResourcesBonesPreview,
  CreatorDashboardSalesBonesPreview,
} from "@/components/skeletons/CreatorDashboardRouteSkeletons";
import { CreatorResourceNewRouteBonesPreview } from "@/components/skeletons/CreatorResourceNewRouteSkeleton";
import { LoginFormSkeletonBonesPreview } from "@/components/skeletons/LoginFormSkeleton";
import { ResourcesDiscoverSectionsBonesPreview } from "@/components/skeletons/ResourcesDiscoverSectionsSkeleton";
import { ResourcesListingShellBonesPreview } from "@/components/skeletons/ResourcesContentFallback";
import {
  ResourcesIntroSectionDiscoverBonesPreview,
  ResourcesIntroSectionListingBonesPreview,
} from "@/components/skeletons/ResourcesIntroSectionSkeleton";
import { ResourcesRouteSkeletonBonesPreview } from "@/components/skeletons/ResourcesRouteSkeleton";
import { SettingsPageSkeletonBonesPreview } from "@/components/skeletons/SettingsPageSkeleton";

export const metadata = {
  title: "Bones Capture",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BonesCapturePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Boneyard capture</p>
          <h1 className="text-2xl font-semibold tracking-tight">Shared skeleton fixtures</h1>
        </header>
        <section className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          <ResourceCardBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Empty-result surfaces</p>
          <SearchRecoveryPanelBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Catalog chrome</p>
          <div className="space-y-4">
            <ResourcesCatalogSearchBonesPreview />
            <ResourcesCatalogControlsBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Search dropdowns</p>
          <div className="space-y-6">
            <HeroSearchQuickBrowseBonesPreview />
            <HeroSearchResultsBonesPreview />
            <HeroSearchEmptyBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Intro sections</p>
          <div className="space-y-6">
            <ResourcesIntroSectionDiscoverBonesPreview />
            <ResourcesIntroSectionListingBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Discover sections</p>
          <ResourcesDiscoverSectionsBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Personalized discover sections</p>
          <ResourcesDiscoverPersonalizedBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Listing shell</p>
          <ResourcesListingShellBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Discover route shell</p>
          <ResourcesRouteSkeletonBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Route-level shell</p>
          <ResourceDetailLoadingShellBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Settings shells</p>
          <div className="space-y-8">
            <SettingsPageSkeletonBonesPreview />
            <AdminSettingsPageSkeletonBonesPreview />
            <CreatorApplyPageSkeletonBonesPreview />
            <AdminResourceFormLoadingShellBonesPreview />
            <CreatorResourceFormLoadingShellBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Creator dashboard route shells</p>
          <div className="space-y-8">
            <CreatorDashboardOverviewBonesPreview />
            <CreatorDashboardAnalyticsBonesPreview />
            <CreatorDashboardResourcesBonesPreview />
            <CreatorDashboardSalesBonesPreview />
            <CreatorDashboardProfileBonesPreview />
            <CreatorResourceNewRouteBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Auth shells</p>
          <LoginFormSkeletonBonesPreview />
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Admin analytics route shells</p>
          <div className="space-y-8">
            <AdminAnalyticsOverviewBonesPreview />
            <AdminAnalyticsRecommendationsBonesPreview />
            <AdminAnalyticsRankingBonesPreview />
            <AdminAnalyticsRankingExperimentBonesPreview />
            <AdminAnalyticsPurchasesBonesPreview />
            <AdminAnalyticsCreatorActivationBonesPreview />
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">User dashboard route shells</p>
          <div className="space-y-8">
            <DashboardOverviewBonesPreview />
            <DashboardLibraryBonesPreview />
            <DashboardDownloadsBonesPreview />
            <DashboardPurchasesBonesPreview />
            <DashboardSubscriptionBonesPreview />
          </div>
        </section>
      </div>
    </main>
  );
}
