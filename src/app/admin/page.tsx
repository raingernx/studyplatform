import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, Package, CreditCard, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Admin Dashboard – PaperDock",
  description: "Overview of users, resources, purchases, and revenue.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getDashboardData() {
  const [
    totalUsers,
    totalResources,
    totalPurchases,
    downloadsResult,
    recentPurchases,
    recentResources,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.resource.count(),
    prisma.purchase.count(),
    prisma.resource.aggregate({
      _sum: { downloadCount: true },
    }),
    prisma.purchase.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        resource: true,
      },
    }),
    prisma.resource.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalResources,
    totalPurchases,
    totalDownloads: downloadsResult._sum.downloadCount ?? 0,
    recentPurchases,
    recentResources,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  // ── 1. Require login ───────────────────────────────────────────────────────
  if (!session?.user) {
    redirect("/auth/login?next=/admin");
  }

  // ── 2. Require ADMIN role ──────────────────────────────────────────────────
  const role = session.user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const {
    totalUsers,
    totalResources,
    totalPurchases,
    totalDownloads,
    recentPurchases,
    recentResources,
  } = await getDashboardData();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Stat cards */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total resources
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {totalResources.toLocaleString()}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <Package className="h-5 w-5 text-brand-600" />
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total users
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {totalUsers.toLocaleString()}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100">
                <Users className="h-5 w-5 text-text-muted" />
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total purchases
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {totalPurchases.toLocaleString()}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight-50">
                <CreditCard className="h-5 w-5 text-highlight-600" />
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total downloads
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {totalDownloads.toLocaleString()}
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
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Recent activity
          </h2>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/70">
              <tr>
                <th className="px-5 py-2.5 font-medium text-text-secondary">
                  Type
                </th>
                <th className="px-3 py-2.5 font-medium text-text-secondary">
                  User
                </th>
                <th className="px-3 py-2.5 font-medium text-text-secondary">
                  Resource
                </th>
                <th className="px-3 py-2.5 font-medium text-text-secondary">
                  Action
                </th>
                <th className="px-3 py-2.5 font-medium text-text-secondary">
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
                        ? "Downloaded free resource"
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
                        {event.date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </>
  );
}
