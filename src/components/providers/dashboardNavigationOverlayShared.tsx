import { routes } from "@/lib/routes";

const DASHBOARD_ROUTE_SHELL_SELECTOR = '[data-route-shell-ready="dashboard"]';
const DASHBOARD_CREATOR_ROUTE_SHELL_SELECTOR =
  '[data-route-shell-ready^="dashboard-creator"]';

function getDashboardTargetPathname(pathname: string | null, href: string | null) {
  const target = href ?? pathname ?? "";

  if (!target) {
    return "";
  }

  return new URL(target, "http://dashboard.local").pathname;
}

export function isDashboardGroupHref(href: string) {
  const pathname = new URL(href, "http://dashboard.local").pathname;

  return (
    pathname === routes.dashboardV2 ||
    pathname === routes.dashboardV2Library ||
    pathname === routes.dashboardV2Downloads ||
    pathname === routes.dashboardV2Purchases ||
    pathname === routes.dashboardV2Settings ||
    pathname === routes.dashboardV2Membership ||
    pathname.startsWith("/dashboard-v2/")
  );
}

export function isDashboardGroupPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return isDashboardGroupHref(pathname);
}

export function getDashboardReadySelector(pathname: string | null, href: string | null) {
  const targetPathname = getDashboardTargetPathname(pathname, href);

  if (targetPathname === routes.dashboardV2) {
    return '[data-route-shell-ready="dashboard-overview"]';
  }

  if (targetPathname === routes.dashboardV2Library) {
    return '[data-route-shell-ready="dashboard-library"]';
  }

  if (targetPathname === routes.dashboardV2Downloads) {
    return '[data-route-shell-ready="dashboard-downloads"]';
  }

  if (targetPathname === routes.dashboardV2Purchases) {
    return '[data-route-shell-ready="dashboard-purchases"]';
  }

  if (targetPathname === routes.dashboardV2Settings) {
    return '[data-route-shell-ready="dashboard-settings"]';
  }

  if (targetPathname === routes.dashboardV2Membership) {
    return '[data-route-shell-ready="dashboard-subscription"]';
  }

  if (targetPathname === routes.dashboardV2CreatorApply) {
    return '[data-route-shell-ready="dashboard-creator-apply"]';
  }

  if (targetPathname === routes.dashboardV2Creator) {
    return '[data-route-shell-ready="dashboard-creator-overview"]';
  }

  if (targetPathname === routes.dashboardV2CreatorAnalytics) {
    return '[data-route-shell-ready="dashboard-creator-analytics"]';
  }

  if (targetPathname === routes.dashboardV2CreatorResources) {
    return '[data-route-shell-ready="dashboard-creator-resources"]';
  }

  if (
    targetPathname === routes.dashboardV2CreatorNewResource ||
    targetPathname.startsWith(`${routes.dashboardV2CreatorResources}/`)
  ) {
    return '[data-route-shell-ready="dashboard-creator-resource-editor"]';
  }

  if (targetPathname === routes.dashboardV2CreatorSales) {
    return '[data-route-shell-ready="dashboard-creator-sales"]';
  }

  if (targetPathname === routes.dashboardV2CreatorPayouts) {
    return '[data-route-shell-ready="dashboard-creator-payouts"]';
  }

  if (targetPathname === routes.dashboardV2CreatorProfile) {
    return '[data-route-shell-ready="dashboard-creator-profile"]';
  }

  if (targetPathname === routes.dashboardV2CreatorSettings) {
    return '[data-route-shell-ready="dashboard-creator-settings"]';
  }

  if (targetPathname.startsWith("/dashboard-v2/creator")) {
    return DASHBOARD_CREATOR_ROUTE_SHELL_SELECTOR;
  }

  return DASHBOARD_ROUTE_SHELL_SELECTOR;
}
