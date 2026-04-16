/**
 * Canonical client-side route constants.
 *
 * All hardcoded path strings for internal navigation should reference these
 * constants instead of being inlined. This makes refactoring routes a
 * single-file change.
 *
 * Usage:
 *   import { routes } from "@/lib/routes";
 *   <Link href={routes.dashboardV2}>Dashboard</Link>
 *   router.push(routes.dashboardV2Library);
 *
 * Notes:
 *   - API routes are intentionally excluded — they are always non-localized
 *     and should remain hardcoded close to their consumers.
 */

// ── User dashboard ────────────────────────────────────────────────────────────

const canonicalDashboardRoutes = {
  dashboardV2: "/dashboard-v2",
  dashboardV2Library: "/dashboard-v2/library",
  dashboardV2Downloads: "/dashboard-v2/downloads",
  dashboardV2Purchases: "/dashboard-v2/purchases",
  dashboardV2Membership: "/dashboard-v2/membership",
  dashboardV2Settings: "/dashboard-v2/settings",
  dashboardV2Creator: "/dashboard-v2/creator",
  dashboardV2CreatorApply: "/dashboard-v2/creator/apply",
  dashboardV2CreatorResources: "/dashboard-v2/creator/resources",
  dashboardV2CreatorNewResource: "/dashboard-v2/creator/resources/new",
  dashboardV2CreatorResource: (id: string) =>
    `/dashboard-v2/creator/resources/${id}`,
  dashboardV2CreatorAnalytics: "/dashboard-v2/creator/analytics",
  dashboardV2CreatorSales: "/dashboard-v2/creator/sales",
  dashboardV2CreatorPayouts: "/dashboard-v2/creator/payouts",
  dashboardV2CreatorStorefront: "/dashboard-v2/creator/storefront",
  dashboardV2CreatorProfile: "/dashboard-v2/creator/profile",
  dashboardV2CreatorSettings: "/dashboard-v2/creator/settings",
  dashboardV2LibraryPaymentSuccess: () => "/dashboard-v2/library?payment=success",
} as const;

export const routes = {
  // ── Public / marketing ─────────────────────────────────────────────────────
  home: "/",
  marketplace: "/resources",
  membership: "/membership",
  support: "/support",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",

  marketplaceCategory: (category?: string | null) =>
    category ? `/resources?category=${encodeURIComponent(category)}` : "/resources",
  marketplaceSearch: (query: string) =>
    `/resources?search=${encodeURIComponent(query)}`,
  marketplaceQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/resources?${query}` : "/resources";
  },
  marketplaceTag: (tag: string) =>
    `/resources?tag=${encodeURIComponent(tag)}`,
  marketplacePrice: (price: string) =>
    `/resources?price=${encodeURIComponent(price)}`,
  marketplacePaymentSuccess: () => "/resources?payment=success",

  /**
   * Category browse page.
   * @example routes.category("design-templates") → "/categories/design-templates"
   */
  category: (slug: string) => `/categories/${slug}`,

  /**
   * Resource detail page.
   * @example routes.resource("my-guide") → "/resources/my-guide"
   */
  resource: (slug: string) => `/resources/${slug}`,
  resourcePreview: (slug: string) => `/resources/${slug}?preview=true`,

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: "/auth/login",
  register: "/auth/register",
  resetPassword: "/auth/reset-password",
  resetPasswordConfirm: "/auth/reset-password/confirm",
  verifyEmail: "/api/auth/verify-email",
  loginWithNext: (next: string) =>
    `/auth/login?next=${encodeURIComponent(next)}`,

  // ── User dashboard ────────────────────────────────────────────────────────
  ...canonicalDashboardRoutes,

  // ── Admin panel ───────────────────────────────────────────────────────────
  admin: "/admin",
  adminResources: "/admin/resources",
  adminNewResource: "/admin/resources/new",
  adminBulkUpload: "/admin/resources/bulk",
  adminTrash: "/admin/resources/trash",
  adminCategories: "/admin/categories",
  adminTags: "/admin/tags",
  adminUsers: "/admin/users",
  adminOrders: "/admin/orders",
  adminReviews: "/admin/reviews",
  adminAnalytics: "/admin/analytics",
  adminRecommendationReport: "/admin/analytics/recommendations",
  adminCreatorActivation: "/admin/analytics/creator-activation",
  adminRankingDebug: "/admin/analytics/ranking",
  adminRankingExperiment: "/admin/analytics/ranking-experiment",
  adminPurchasesAnalytics: "/admin/analytics/purchases",
  adminActivity: "/admin/activity",
  adminAudit: "/admin/audit",
  adminSettings: "/admin/settings",
  adminCreators: "/admin/creators",

  /**
   * Admin edit page for a specific resource.
   * @example routes.adminResource("clxyz123") → "/admin/resources/clxyz123"
   */
  adminResource: (id: string) => `/admin/resources/${id}`,
  adminUsersSearch: (query: string) =>
    `/admin/users?q=${encodeURIComponent(query)}`,
  adminOrdersOrder: (orderId: string) =>
    `/admin/orders?orderId=${encodeURIComponent(orderId)}`,
  adminRecommendationReportQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/analytics/recommendations?${query}` : "/admin/analytics/recommendations";
  },
  adminCreatorActivationQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/analytics/creator-activation?${query}` : "/admin/analytics/creator-activation";
  },
  adminPurchasesAnalyticsQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/analytics/purchases?${query}` : "/admin/analytics/purchases";
  },
  adminRankingDebugQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/analytics/ranking?${query}` : "/admin/analytics/ranking";
  },
  adminRankingExperimentQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/analytics/ranking-experiment?${query}` : "/admin/analytics/ranking-experiment";
  },
  adminResourcesQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/resources?${query}` : "/admin/resources";
  },
  adminAuditQuery: (params: URLSearchParams | string) => {
    const query = typeof params === "string" ? params : params.toString();
    return query ? `/admin/audit?${query}` : "/admin/audit";
  },
  creatorPublicProfile: (slug: string) => `/creators/${slug}`,
  resourcePaymentSuccess: (slug: string) =>
    `/resources/${slug}?payment=success`,

  /**
   * Admin version history page for a resource.
   */
  adminResourceVersions: (id: string) => `/admin/resources/${id}/versions`,
} as const;
