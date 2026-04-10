import Link from "next/link";
import { DollarSign, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getCreatorSales,
} from "@/services/creator";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { getCreatorProtectedUserContext } from "../creatorProtectedUser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Creator Sales",
};

export const dynamic = "force-dynamic";

export default async function CreatorSalesPage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorSales);

  const salesData = await getCreatorSales(userId);

  return (
    <DashboardPageShell routeReady="dashboard-creator-sales">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Sales"
        description="Recent transactions and the gross revenue your resources have generated."
      />

      <CreatorSalesResults salesData={salesData} />
    </DashboardPageShell>
  );
}

function CreatorSalesResults({
  salesData,
}: {
  salesData: Awaited<ReturnType<typeof getCreatorSales>>;
}) {
  const stats = [
    {
      label: "Gross revenue",
      value: formatPrice(salesData.totals.grossRevenue / 100),
      icon: DollarSign,
      colorClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Creator share",
      value: formatPrice(salesData.totals.creatorShare / 100),
      icon: Wallet,
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Platform fees",
      value: formatPrice(salesData.totals.platformFees / 100),
      icon: Receipt,
      colorClass: "bg-rose-50 text-rose-600",
    },
    {
      label: "Sales count",
      value: salesData.sales.length.toLocaleString(),
      icon: ShoppingBag,
      colorClass: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <DashboardPageStack>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.colorClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border/70 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent sales</h2>
        </div>

        {salesData.sales.length === 0 ? (
          <p className="px-6 py-14 text-sm text-muted-foreground">No sales recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Your share</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {salesData.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <ResourceIntentLink
                          href={routes.resource(sale.resourceSlug)}
                          className="truncate font-medium text-foreground hover:text-blue-600"
                        >
                          {sale.resourceTitle}
                        </ResourceIntentLink>
                        <p className="mt-1 text-xs text-muted-foreground">{sale.resourceSlug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <div>{sale.buyerName}</div>
                      {sale.buyerEmail && (
                        <div className="mt-1 text-xs text-muted-foreground">{sale.buyerEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-foreground">
                      {formatPrice(sale.amount / 100)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-blue-700">
                      {formatPrice(sale.creatorShare / 100)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {formatDate(sale.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardPageStack>
  );
}
