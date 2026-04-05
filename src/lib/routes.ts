/**
 * Canonical client-side route constants.
 *
 * All hardcoded path strings for internal navigation should reference these
 * constants instead of being inlined. This makes refactoring routes a
 * single-file change.
 *
 * Usage:
 *   import { routes } from "@/lib/routes";
 *   <Link href={routes.dashboard}>Dashboard</Link>
 *   router.push(routes.library);
 *
 * Notes:
 *   - 


 *   - API routes are intentionally excluded — they are always non-localized
 *     and should remain hardcoded close to their consumers.
 */

// ── User dashboard ────────────────────────────────────────────────────────────

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
  dashboard: "/dashboard",
  creatorDashboard: "/dashboard/creator",
  creatorApply: "/dashboard/creator/apply",
  creatorResources: "/dashboard/creator/resources",
  creatorNewResource: "/dashboard/creator/resources/new",
  creatorAnalytics: "/dashboard/creator/analytics",
  creatorSales: "/dashboard/creator/sales",
  creatorProfile: "/dashboard/creator/profile",
  library: "/dashboard/library",
  downloads: "/dashboard/downloads",
  purchases: "/dashboard/purchases",
  dashboardResources: "/dashboard/resources",
  settings: "/settings",
  subscription: "/subscription",
  libraryPaymentSuccess: () => "/dashboard/library?payment=success",

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
  creatorResource: (id: string) => `/dashboard/creator/resources/${id}`,
  creatorPublicProfile: (slug: string) => `/creators/${slug}`,
  resourcePaymentSuccess: (slug: string) =>
    `/resources/${slug}?payment=success`,

  /**
   * Admin version history page for a resource.
   */
  adminResourceVersions: (id: string) => `/admin/resources/${id}/versions`,
} as const;
