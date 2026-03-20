import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/design-system";
import { Input } from "@/design-system";
import { Button } from "@/design-system";
import { formatPrice, formatNumber, formatDate } from "@/lib/format";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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
  const session = await getServerSession(authOptions);

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

  const where: any = {};

  if (statusFilter && ["COMPLETED", "REFUNDED", "FAILED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  if (from || to) {
    where.createdAt = {};
    if (from && !isNaN(from.getTime())) {
      where.createdAt.gte = from;
    }
    if (to && !isNaN(to.getTime())) {
      where.createdAt.lte = to;
    }
  }

  const [orders, revenueAgg, ordersTodayAgg] = await Promise.all([
    prisma.purchase.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      where,
      include: {
        user: { select: { name: true, email: true } },
        resource: { select: { title: true } },
      },
    }),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    (() => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return prisma.purchase.aggregate({
        _count: true,
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfToday },
        },
      });
    })(),
  ]);

  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const ordersToday = ordersTodayAgg._count ?? 0;

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const averageOrderValue =
    completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + o.amount, 0) /
        completedOrders.length
      : 0;

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Orders"
        description="View marketplace purchases and revenue."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            Total revenue
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {formatPrice(totalRevenue / 100)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            Orders today
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {formatNumber(ordersToday)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            Average order value
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {formatPrice(averageOrderValue / 100)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card">
        <form className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="status"
              className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="input-base w-40"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="from"
              className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
            >
              From
            </label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={resolvedSearchParams.from}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="to"
              className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
            >
              To
            </label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={resolvedSearchParams.to}
            />
          </div>

          <div className="ml-auto">
            <Button type="submit" variant="outline" size="sm">
              Apply filters
            </Button>
          </div>
        </form>
      </div>

      {/* Orders table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Order ID
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  User
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Resource
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Price
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Status
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No orders found for this filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? {
                    label: order.status,
                    tone: "muted" as StatusBadgeTone,
                  };

                  return (
                    <tr key={order.id} className="bg-white transition-colors hover:bg-surface-50">
                      <td className="px-2 py-3 text-sm font-mono text-text-secondary">
                        {order.id}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        <div className="flex flex-col">
                          <span>{order.user.name ?? "Unknown"}</span>
                          <span className="text-xs text-text-muted">
                            {order.user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {order.resource.title}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary tabular-nums">
                        {formatPrice(order.amount / 100)}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        <StatusBadge
                          status={order.status}
                          label={badge.label}
                          tone={badge.tone}
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
