import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DollarSign, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getCreatorAccessState, getCreatorSales } from "@/services/creator.service";

export const metadata = {
  title: "Creator Sales",
};

export const dynamic = "force-dynamic";

export default async function CreatorSalesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/sales");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const salesData = await getCreatorSales(session.user.id);

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
    <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
            Creator
          </p>
          <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
            Sales
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Recent transactions and the gross revenue your resources have generated.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-700">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">Recent sales</h2>
          </div>

          {salesData.sales.length === 0 ? (
            <p className="px-6 py-14 text-sm text-neutral-500">No sales recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Your share</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {salesData.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <Link
                            href={routes.resource(sale.resourceSlug)}
                            className="truncate font-medium text-neutral-900 hover:text-blue-600"
                          >
                            {sale.resourceTitle}
                          </Link>
                          <p className="mt-1 text-xs text-neutral-400">{sale.resourceSlug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-700">
                        <div>{sale.buyerName}</div>
                        {sale.buyerEmail && (
                          <div className="mt-1 text-xs text-neutral-400">{sale.buyerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-900">
                        {formatPrice(sale.amount / 100)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-blue-700">
                        {formatPrice(sale.creatorShare / 100)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500">
                        {formatDate(sale.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}
