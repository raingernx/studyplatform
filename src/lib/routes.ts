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

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: "/auth/login",
  register: "/auth/register",

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
  settings: "/settings",
  subscription: "/subscription",

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
  adminActivity: "/admin/activity",
  adminAudit: "/admin/audit",
  adminHeroes: "/admin/heroes",
  adminNewHero: "/admin/heroes/new",
  adminSettings: "/admin/settings",
  adminTypographySettings: "/admin/settings/typography",

  /**
   * Admin edit page for a specific resource.
   * @example routes.adminResource("clxyz123") → "/admin/resources/clxyz123"
   */
  adminResource: (id: string) => `/admin/resources/${id}`,
  adminHero: (id: string) => `/admin/heroes/${id}`,
  creatorResource: (id: string) => `/dashboard/creator/resources/${id}`,
  creatorPublicProfile: (slug: string) => `/creators/${slug}`,

  /**
   * Admin version history page for a resource.
   */
  adminResourceVersions: (id: string) => `/admin/resources/${id}/versions`,
} as const;
