import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import {
  Users,
  BookOpen,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  TrendingUp,
  FileText,
  BarChart3,
  CalendarDays,
  Download,
  UserPlus,
  Tag,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard – StudyPlatform",
  description: "Overview of users, resources, purchases, and revenue.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "usd",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const PURCHASE_STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PENDING:   "bg-amber-50 text-amber-700",
  FAILED:    "bg-red-50 text-red-600",
  REFUNDED:  "bg-zinc-100 text-zinc-500",
};

const USER_ROLE_STYLES: Record<string, string> = {
  ADMIN:      "bg-violet-50 text-violet-700",
  INSTRUCTOR: "bg-blue-50 text-blue-700",
  STUDENT:    "bg-zinc-100 text-zinc-500",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getDashboardData() {
  // ── Date boundaries ────────────────────────────────────────────────────────
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // ── All queries run in parallel ────────────────────────────────────────────
  const [
    totalUsers,
    totalResources,
    totalPurchases,
    revenueResult,
    recentPurchases,
    recentUsers,
    revenueTodayResult,
    newUsersThisWeek,
    topResources,
  ] = await Promise.all([
    // ── Existing queries (unchanged) ──────────────────────────────────────
    prisma.user.count(),
    prisma.resource.count(),
    prisma.purchase.count(),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.purchase.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, resource: true },
      where: { status: "COMPLETED" },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    // ── New queries ───────────────────────────────────────────────────────
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.resource.findMany({
      take: 5,
      orderBy: { downloadCount: "desc" },
      select: { id: true, title: true, downloadCount: true },
    }),
  ]);

  return {
    totalUsers,
    totalResources,
    totalPurchases,
    totalRevenue:    revenueResult._sum.amount      ?? 0,
    recentPurchases,
    recentUsers,
    revenueToday:    revenueTodayResult._sum.amount ?? 0,
    newUsersThisWeek,
    topResources,
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
    totalRevenue,
    recentPurchases,
    recentUsers,
    revenueToday,
    newUsersThisWeek,
    topResources,
  } = await getDashboardData();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* ── Page header ── */}
          <div className="mb-8">
            <p className="eyebrow mb-1">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Platform overview and recent activity.
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Users"
              value={totalUsers.toLocaleString()}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Total Resources"
              value={totalResources.toLocaleString()}
              icon={<BookOpen className="h-5 w-5 text-violet-500" />}
              iconBg="bg-violet-50"
            />
            <StatCard
              label="Total Purchases"
              value={totalPurchases.toLocaleString()}
              icon={<ShoppingBag className="h-5 w-5 text-orange-500" />}
              iconBg="bg-orange-50"
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              iconBg="bg-emerald-50"
              highlight
            />
            <StatCard
              label="Revenue Today"
              value={formatCurrency(revenueToday)}
              icon={<CalendarDays className="h-5 w-5 text-sky-500" />}
              iconBg="bg-sky-50"
            />
            <StatCard
              label="New Users (7d)"
              value={newUsersThisWeek.toLocaleString()}
              icon={<UserPlus className="h-5 w-5 text-indigo-500" />}
              iconBg="bg-indigo-50"
            />
          </div>

          {/* ── Quick links ── */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickLink
              href="/admin/resources"
              icon={<FileText className="h-4 w-4" />}
              label="Resources"
            />
            <QuickLink
              href="/admin/users"
              icon={<Users className="h-4 w-4" />}
              label="Users"
            />
            <QuickLink
              href="/admin/purchases"
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Purchases"
            />
            <QuickLink
              href="/admin/analytics"
              icon={<BarChart3 className="h-4 w-4" />}
              label="Analytics"
            />
            <QuickLink
              href="/admin/tags"
              icon={<Tag className="h-4 w-4" />}
              label="Tags"
            />
          </div>

          {/* ── Tables row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent purchases */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-900">
                    Recent Purchases
                  </h2>
                </div>
                <Link
                  href="/admin/purchases"
                  className="flex items-center gap-1 text-[12px] font-medium text-blue-600
                             transition hover:text-blue-700"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentPurchases.length === 0 ? (
                <EmptyTable message="No purchases yet." />
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-2.5 font-semibold text-zinc-500">User</th>
                      <th className="px-3 py-2.5 font-semibold text-zinc-500">Resource</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-zinc-500">Amount</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-zinc-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recentPurchases.map((p) => (
                      <tr key={p.id} className="transition hover:bg-zinc-50/60">
                        <td className="px-5 py-3">
                          <p className="font-medium text-zinc-900 truncate max-w-[120px]">
                            {p.user.name ?? "—"}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                            {p.user.email}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-zinc-700 line-clamp-2 max-w-[130px]">
                            {p.resource.title}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-zinc-900 tabular-nums">
                          {p.amount === 0 ? (
                            <span className="font-normal text-zinc-400">Free</span>
                          ) : (
                            formatCurrency(p.amount)
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize
                                        ${PURCHASE_STATUS_STYLES[p.status] ?? "bg-zinc-100 text-zinc-500"}`}
                          >
                            {p.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent users */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-900">
                    Recent Users
                  </h2>
                </div>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-1 text-[12px] font-medium text-blue-600
                             transition hover:text-blue-700"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentUsers.length === 0 ? (
                <EmptyTable message="No users yet." />
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-5 py-2.5 font-semibold text-zinc-500">User</th>
                      <th className="px-3 py-2.5 font-semibold text-zinc-500">Role</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-zinc-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recentUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-zinc-50/60">
                        <td className="px-5 py-3">
                          <p className="font-medium text-zinc-900 truncate max-w-[160px]">
                            {u.name ?? "Anonymous"}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[160px]">
                            {u.email}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize
                                        ${USER_ROLE_STYLES[u.role] ?? "bg-zinc-100 text-zinc-500"}`}
                          >
                            {u.role.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-[12px] text-zinc-500">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Top Resources ── */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4">
              <Download className="h-4 w-4 text-zinc-400" />
              <h2 className="text-[14px] font-semibold text-zinc-900">
                Top Resources
              </h2>
              <span className="ml-1 text-[12px] text-zinc-400">by downloads</span>
            </div>

            {topResources.length === 0 ? (
              <EmptyTable message="No resources yet." />
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-2.5 font-semibold text-zinc-500">#</th>
                    <th className="px-3 py-2.5 font-semibold text-zinc-500">Resource</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-zinc-500">
                      Downloads
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topResources.map((r, i) => (
                    <tr key={r.id} className="transition hover:bg-zinc-50/60">
                      <td className="px-5 py-3 tabular-nums text-zinc-400">
                        {i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-zinc-900 line-clamp-1">
                          {r.title}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full
                                         bg-zinc-100 px-2.5 py-0.5 text-[12px] font-semibold
                                         tabular-nums text-zinc-700">
                          <Download className="h-3 w-3 text-zinc-400" />
                          {r.downloadCount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  iconBg,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card
                  ${highlight
                    ? "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                    : "border-zinc-200 bg-white"
                  }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          <p
            className={`mt-2 text-[26px] font-bold tabular-nums leading-none tracking-tight
                        ${highlight ? "text-emerald-700" : "text-zinc-900"}`}
          >
            {value}
          </p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-zinc-200
                 bg-white px-4 py-3 shadow-card transition hover:border-zinc-300
                 hover:shadow-card-md"
    >
      <span className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-700
                        group-hover:text-zinc-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100
                         text-zinc-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          {icon}
        </span>
        {label}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-zinc-300 transition group-hover:translate-x-0.5
                              group-hover:text-zinc-400" />
    </Link>
  );
}

function EmptyTable({ message }: { message: string }) {
  return (
    <p className="px-5 py-8 text-center text-[13px] text-zinc-400">{message}</p>
  );
}
