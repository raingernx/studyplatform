import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";
import {
  DashboardDownloadsSkeleton,
  DashboardLibrarySkeleton,
  DashboardOverviewSkeleton,
  DashboardPurchasesSkeleton,
  DashboardResourcesRedirectSkeleton,
  DashboardSubscriptionSkeleton,
} from "@/components/skeletons/DashboardUserRouteSkeletons";
import {
  CreatorDashboardAnalyticsLoadingShell,
  CreatorDashboardOverviewLoadingShell,
  CreatorDashboardProfileLoadingShell,
  CreatorDashboardResourcesLoadingShell,
  CreatorDashboardSalesLoadingShell,
} from "@/components/skeletons/CreatorDashboardRouteSkeletons";
import { CreatorApplyPageSkeleton } from "@/components/skeletons/CreatorApplyPageSkeleton";
import { CreatorResourceNewRouteSkeleton } from "@/components/skeletons/CreatorResourceNewRouteSkeleton";
import { SettingsPageSkeleton } from "@/components/skeletons/SettingsPageSkeleton";
import { routes } from "@/lib/routes";

const DASHBOARD_ROUTE_SHELL_SELECTOR = '[data-route-shell-ready="dashboard"]';
const DASHBOARD_CREATOR_ROUTE_SHELL_SELECTOR =
  '[data-route-shell-ready^="dashboard-creator"]';

export function isDashboardGroupHref(href: string) {
  return (
    href === "/dashboard" ||
    href === "/settings" ||
    href === "/subscription" ||
    href === "/purchases" ||
    href.startsWith("/dashboard/")
  );
}

export function isDashboardGroupPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return isDashboardGroupHref(pathname);
}

export function renderDashboardOverlayContent(
  pathname: string | null,
  href: string | null,
) {
  const target = href ?? pathname ?? "";
  const targetPathname = target
    ? new URL(target, "http://dashboard.local").pathname
    : "";

  if (targetPathname === routes.library) {
    return <DashboardLibrarySkeleton />;
  }

  if (targetPathname === routes.downloads) {
    return <DashboardDownloadsSkeleton />;
  }

  if (targetPathname === routes.purchases) {
    return <DashboardPurchasesSkeleton />;
  }

  if (targetPathname === routes.subscription) {
    return <DashboardSubscriptionSkeleton />;
  }

  if (targetPathname === routes.settings) {
    return <SettingsPageSkeleton />;
  }

  if (targetPathname === routes.dashboardResources) {
    return <DashboardResourcesRedirectSkeleton />;
  }

  if (targetPathname === routes.creatorApply) {
    return <CreatorApplyPageSkeleton />;
  }

  if (targetPathname === routes.creatorDashboard) {
    return <CreatorDashboardOverviewLoadingShell />;
  }

  if (targetPathname === routes.creatorAnalytics) {
    return <CreatorDashboardAnalyticsLoadingShell />;
  }

  if (targetPathname === routes.creatorResources) {
    return <CreatorDashboardResourcesLoadingShell />;
  }

  if (
    targetPathname === routes.creatorNewResource ||
    targetPathname.startsWith(`${routes.creatorResources}/`)
  ) {
    return <CreatorResourceNewRouteSkeleton />;
  }

  if (targetPathname === routes.creatorSales) {
    return <CreatorDashboardSalesLoadingShell />;
  }

  if (
    targetPathname === routes.creatorProfile ||
    targetPathname === "/dashboard/creator/settings"
  ) {
    return <CreatorDashboardProfileLoadingShell />;
  }

  if (targetPathname === routes.dashboard || targetPathname.startsWith("/dashboard/")) {
    return <DashboardOverviewSkeleton />;
  }

  return <DashboardGroupLoadingShell />;
}

export function shouldWrapDashboardOverlayInShell(
  pathname: string | null,
  href: string | null,
) {
  const target = href ?? pathname ?? "";
  const targetPathname = target
    ? new URL(target, "http://dashboard.local").pathname
    : "";

  if (
    targetPathname === routes.creatorApply ||
    targetPathname === routes.creatorDashboard ||
    targetPathname === routes.creatorAnalytics ||
    targetPathname === routes.creatorResources ||
    targetPathname === routes.creatorSales ||
    targetPathname === routes.creatorProfile ||
    targetPathname === "/dashboard/creator/settings" ||
    targetPathname === routes.creatorNewResource ||
    targetPathname.startsWith(`${routes.creatorResources}/`)
  ) {
    return false;
  }

  return true;
}

export function getDashboardReadySelector(pathname: string | null, href: string | null) {
  const target = href ?? pathname ?? "";
  const targetPathname = target
    ? new URL(target, "http://dashboard.local").pathname
    : "";

  if (targetPathname === routes.dashboard) {
    return '[data-route-shell-ready="dashboard-overview"]';
  }

  if (targetPathname === routes.library) {
    return '[data-route-shell-ready="dashboard-library"]';
  }

  if (targetPathname === routes.downloads) {
    return '[data-route-shell-ready="dashboard-downloads"]';
  }

  if (targetPathname === routes.purchases) {
    return '[data-route-shell-ready="dashboard-purchases"]';
  }

  if (targetPathname === routes.settings) {
    return '[data-route-shell-ready="dashboard-settings"]';
  }

  if (targetPathname === routes.subscription) {
    return '[data-route-shell-ready="dashboard-subscription"]';
  }

  if (targetPathname === routes.creatorApply) {
    return '[data-route-shell-ready="dashboard-creator-apply"]';
  }

  if (targetPathname === routes.creatorDashboard) {
    return '[data-route-shell-ready="dashboard-creator-overview"]';
  }

  if (targetPathname === routes.creatorAnalytics) {
    return '[data-route-shell-ready="dashboard-creator-analytics"]';
  }

  if (targetPathname === routes.creatorResources) {
    return '[data-route-shell-ready="dashboard-creator-resources"]';
  }

  if (
    targetPathname === routes.creatorNewResource ||
    targetPathname.startsWith(`${routes.creatorResources}/`)
  ) {
    return '[data-route-shell-ready="dashboard-creator-resource-editor"]';
  }

  if (targetPathname === routes.creatorSales) {
    return '[data-route-shell-ready="dashboard-creator-sales"]';
  }

  if (
    targetPathname === routes.creatorProfile ||
    targetPathname === "/dashboard/creator/settings"
  ) {
    return '[data-route-shell-ready="dashboard-creator-profile"]';
  }

  if (targetPathname.startsWith("/dashboard/creator")) {
    return DASHBOARD_CREATOR_ROUTE_SHELL_SELECTOR;
  }

  return DASHBOARD_ROUTE_SHELL_SELECTOR;
}
