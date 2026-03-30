import { Users, Package, CreditCard, Download } from "lucide-react";
import { Card } from "@/design-system";
import { formatNumber, formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getAdminDashboardOverview } from "@/services/analytics.service";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Admin Dashboard",
  description: "Overview of users, resources, purchases, and revenue.",
};

export default async function AdminDashboardPage() {
  await requireAdminSession(routes.admin);

  const {
    metrics,
    recentPurchases,
    recentResources,
  } = await getAdminDashboardOverview();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          Overview
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
              Admin dashboard
            </h1>
            <p className="mt-1 text-meta text-text-secondary">
              Track marketplace health, new activity, and the operating metrics that matter most.
            </p>
          </div>
          <p className="text-xs text-text-muted">
            Revenue tracked: {formatPrice(metrics.totalRevenue / 100)}
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-meta font-medium text-text-muted">
                  Total resources
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {formatNumber(metrics.totalResources)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <Package className="h-5 w-5 text-brand-600" />
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-meta font-medium text-text-muted">
                  Total users
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {formatNumber(metrics.totalUsers)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100">
                <Users className="h-5 w-5 text-text-muted" />
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-meta font-medium text-text-muted">
                  Total purchases
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {formatNumber(metrics.totalPurchases)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight-50">
                <CreditCard className="h-5 w-5 text-highlight-600" />
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-meta font-medium text-text-muted">
                  Total downloads
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {formatNumber(metrics.totalDownloads)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50">
                <Download className="h-5 w-5 text-success-600" />
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Recent activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-h3 font-semibold text-text-primary">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Latest purchases and newly uploaded resources across the platform.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/70">
              <tr>
                <th className="px-5 py-2.5 text-meta font-medium text-text-muted">
                  Type
                </th>
                <th className="px-3 py-2.5 text-meta font-medium text-text-muted">
                  User
                </th>
                <th className="px-3 py-2.5 text-meta font-medium text-text-muted">
                  Resource
                </th>
                <th className="px-3 py-2.5 text-meta font-medium text-text-muted">
                  Action
                </th>
                <th className="px-3 py-2.5 text-meta font-medium text-text-muted">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {recentPurchases.length === 0 && recentResources.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No recent activity yet.
                  </td>
                </tr>
              ) : (
                [
                  // Purchase events
                  ...recentPurchases.map((purchase) => ({
                    id: `purchase-${purchase.id}`,
                    type: "Purchase",
                    user: purchase.user.name ?? purchase.user.email ?? "Unknown",
                    resource: purchase.resource.title,
                    action:
                      purchase.amount === 0
                        ? "Claimed free resource"
                        : "Purchased resource",
                    date: purchase.createdAt,
                  })),
                  // New resource events
                  ...recentResources.map((resource) => ({
                    id: `resource-${resource.id}`,
                    type: "Resource",
                    user: resource.author?.name ?? "Unknown creator",
                    resource: resource.title,
                    action: "Uploaded new resource",
                    date: resource.createdAt,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      b.date.getTime() - a.date.getTime()
                  )
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="bg-white/80">
                      <td className="px-5 py-3 text-sm font-medium text-text-primary">
                        {event.type}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {event.user}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {event.resource}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {event.action}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {formatDate(event.date)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
