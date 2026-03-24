import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/design-system";
import { Input } from "@/design-system";
import { Button } from "@/design-system";
import { formatPrice, formatNumber, formatDate } from "@/lib/format";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
  TableToolbar,
} from "@/components/admin/table";
import { getAdminOrdersPageData } from "@/services/admin-operations.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "Orders – Admin",
  description: "View and analyze marketplace purchases.",
};

interface AdminOrdersPageProps {
  searchParams?: Promise<{
    status?: string;
    from?: string;
    to?: string;
  }>;
}

const STATUS_BADGE: Record<string, { label: string; tone: StatusBadgeTone }> = {
  COMPLETED: { label: "Completed", tone: "success" },
  REFUNDED:  { label: "Refunded",  tone: "warning" },
  FAILED:    { label: "Failed",    tone: "danger"  },
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  return withRequestPerformanceTrace("route:/admin/orders", {}, async () => {
  const session = await traceServerStep(
    "admin_orders.getServerSession",
    () => getServerSession(authOptions),
  );

  if (!session?.user) {
    redirect("/auth/login?next=/admin/orders");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusFilter = resolvedSearchParams.status?.toUpperCase() || "";
  const from = resolvedSearchParams.from ? new Date(resolvedSearchParams.from) : null;
  const to = resolvedSearchParams.to ? new Date(resolvedSearchParams.to) : null;

  const {
    orders,
    totalRevenue,
    ordersToday,
    averageOrderValue,
  } = await traceServerStep(
    "admin_orders.getAdminOrdersPageData",
    () =>
      getAdminOrdersPageData({
        statusFilter,
        from,
        to,
      }),
    {
      hasDateFilter: Boolean(from || to),
      statusFilter: statusFilter || "all",
    },
  );

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Orders"
        description="View marketplace purchases and revenue."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="font-ui text-caption text-text-muted">
            Total revenue
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            {formatPrice(totalRevenue / 100)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="font-ui text-caption text-text-muted">
            Orders today
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            {formatNumber(ordersToday)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="font-ui text-caption text-text-muted">
            Average order value
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            {formatPrice(averageOrderValue / 100)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <TableToolbar>
        <form className="flex flex-1 flex-wrap items-end gap-x-3 gap-y-2.5">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label
              htmlFor="status"
              className="font-ui text-caption text-text-muted"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="input-base w-full sm:w-40"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label
              htmlFor="from"
              className="font-ui text-caption text-text-muted"
            >
              From
            </label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={resolvedSearchParams.from}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label
              htmlFor="to"
              className="font-ui text-caption text-text-muted"
            >
              To
            </label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={resolvedSearchParams.to}
              className="w-full sm:w-40"
            />
          </div>

          <div className="w-full sm:ml-auto sm:w-auto">
            <Button type="submit" variant="outline" size="sm">
              Apply filters
            </Button>
          </div>
        </form>
      </TableToolbar>

      {/* Orders table */}
      <DataTable minWidth="min-w-[900px]">
        <DataTableHeader>
          <tr>
            <DataTableHeadCell className="px-2">
                  Order ID
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  User
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Resource
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Price
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Status
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Created
            </DataTableHeadCell>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {orders.length === 0 ? (
            <TableEmptyState
              message="No orders found"
              description="Try widening the date range or clearing the current status filter."
            />
          ) : (
            orders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? {
                label: order.status,
                tone: "muted" as StatusBadgeTone,
              };

              return (
                <DataTableRow key={order.id}>
                  <DataTableCell className="px-2 font-mono text-sm text-text-secondary">
                    {order.id}
                  </DataTableCell>
                  <DataTableCell className="px-3 text-text-secondary">
                    <div className="flex flex-col">
                      <span>{order.user.name ?? "Unknown"}</span>
                      <span className="text-caption text-text-muted">
                        {order.user.email}
                      </span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="px-3 text-text-secondary">
                    {order.resource.title}
                  </DataTableCell>
                  <DataTableCell className="px-3 tabular-nums text-text-secondary">
                    {formatPrice(order.amount / 100)}
                  </DataTableCell>
                  <DataTableCell className="px-3 text-text-secondary">
                    <StatusBadge
                      status={order.status}
                      label={badge.label}
                      tone={badge.tone}
                    />
                  </DataTableCell>
                  <DataTableCell className="px-3 text-text-secondary">
                    {formatDate(order.createdAt)}
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
  });
}
