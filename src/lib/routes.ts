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
 *   - These are path segments WITHOUT a locale prefix. next-intl's
 *     `<Link>` and `useRouter` from `@/i18n/navigation` prepend the
 *     current locale automatically.
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
  adminSettings: "/admin/settings",

  /**
   * Admin edit page for a specific resource.
   * @example routes.adminResource("clxyz123") → "/admin/resources/clxyz123"
   */
  adminResource: (id: string) => `/admin/resources/${id}`,

  /**
   * Admin version history page for a resource.
   */
  adminResourceVersions: (id: string) => `/admin/resources/${id}/versions`,
} as const;
