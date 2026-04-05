import { Users, Package, CreditCard, Download } from "lucide-react";
import { Card } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatNumber, formatDate, formatPrice } from "@/lib/format";
import { getAdminDashboardOverview } from "@/services/analytics";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
} from "@/components/admin/table";

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
    <div className="space-y-7">
      <AdminPageHeader
        title="Admin dashboard"
        description="Track marketplace health, operational activity, and the metrics that matter most."
        actions={
          <p className="text-small text-muted-foreground">
            Revenue tracked: {formatPrice(metrics.totalRevenue / 100)}
          </p>
        }
      />

      <section>
        <Card className="overflow-hidden rounded-xl p-0">
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {[
              {
                label: "Resources",
                value: formatNumber(metrics.totalResources),
                icon: Package,
                tone: "text-primary-700",
              },
              {
                label: "Users",
                value: formatNumber(metrics.totalUsers),
                icon: Users,
                tone: "text-muted-foreground",
              },
              {
                label: "Purchases",
                value: formatNumber(metrics.totalPurchases),
                icon: CreditCard,
                tone: "text-warning-700",
              },
              {
                label: "Downloads",
                value: formatNumber(metrics.totalDownloads),
                icon: Download,
                tone: "text-success-700",
              },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-small text-muted-foreground">{label}</p>
                  <p className="mt-1 text-[1.375rem] font-semibold tracking-tight text-foreground">
                    {value}
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className={`h-4 w-4 ${tone}`} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-h3 font-semibold text-foreground">
            Recent activity
          </h2>
          <p className="mt-1 text-small text-muted-foreground">
            Latest purchases and newly uploaded resources across the platform.
          </p>
        </div>

        <DataTable minWidth="min-w-[760px]">
          <DataTableHeader>
            <tr>
              <DataTableHeadCell>Type</DataTableHeadCell>
              <DataTableHeadCell>User</DataTableHeadCell>
              <DataTableHeadCell>Resource</DataTableHeadCell>
              <DataTableHeadCell>Action</DataTableHeadCell>
              <DataTableHeadCell>Date</DataTableHeadCell>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {recentPurchases.length === 0 && recentResources.length === 0 ? (
              <TableEmptyState message="No recent activity yet." />
            ) : (
              [
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
                ...recentResources.map((resource) => ({
                  id: `resource-${resource.id}`,
                  type: "Resource",
                  user: resource.author?.name ?? "Unknown creator",
                  resource: resource.title,
                  action: "Uploaded new resource",
                  date: resource.createdAt,
                })),
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 10)
                .map((event) => (
                  <DataTableRow key={event.id}>
                    <DataTableCell className="font-medium">{event.type}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{event.user}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{event.resource}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{event.action}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {formatDate(event.date)}
                    </DataTableCell>
                  </DataTableRow>
                ))
            )}
          </DataTableBody>
        </DataTable>
      </section>
    </div>
  );
}
