import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  Download,
  CreditCard,
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";

export const metadata = {
  title: "Overview – PaperDock",
};

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
          previewUrl: true,
          fileSize: true,
          price: true,
          isFree: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const recommended = await prisma.resource.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: purchases.map((p) => p.resource.id) },
    },
    include: {
      category: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: { downloadCount: "desc" },
    take: 6,
  });

  return { purchases, recommended };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/dashboard");

  const { purchases, recommended } = await getDashboardData(session.user.id);

  const isSubscribed = session.user.subscriptionStatus === "ACTIVE";
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
  const lastOpened = purchases[0] ?? null;
  const recentPurchases = purchases.slice(0, 4);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const STATS = [
    {
      label: "Resources Owned",
      value: purchases.length,
      icon: BookOpen,
      color: "bg-blue-50 text-blue-600",
      trend: "+2 this month",
    },
    {
      label: "Total Downloads",
      value: purchases.length,
      icon: Download,
      color: "bg-emerald-50 text-emerald-600",
      trend: "All time",
    },
    {
      label: "Total Spent",
      value: formatPrice(totalSpent / 100),
      icon: CreditCard,
      color: "bg-violet-50 text-violet-600",
      trend: "Lifetime",
    },
    {
      label: "Membership",
      value: isSubscribed ? "Pro" : "Free",
      icon: Sparkles,
      color: isSubscribed
        ? "bg-amber-50 text-amber-600"
        : "bg-neutral-50 text-neutral-400",
      trend: isSubscribed ? "Active" : "Upgrade available",
    },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── Welcome ───────────────────────────────────────────── */}
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-neutral-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Here&apos;s an overview of your learning activity.
          </p>
        </div>

        {/* ── Upgrade Banner (free users only) ──────────────────── */}
        {!isSubscribed && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-blue-500 p-px shadow-glow-violet">
            <div className="flex items-center justify-between rounded-[calc(1rem-1px)] bg-gradient-to-r from-violet-600 via-blue-600 to-blue-500 px-6 py-4">
              <div>
                <p className="font-semibold text-white">
                  Unlock unlimited resources
                </p>
                <p className="mt-0.5 text-sm text-blue-100">
                  Pro gives you access to everything — one flat price per month.
                </p>
              </div>
              <Link
                href="/subscription"
                className="flex-shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-neutral-50"
              >
                View plans →
              </Link>
            </div>
          </div>
        )}

        {/* ── Stats Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => {
          const Icon = stat.icon;

            let valueColorClass = "text-neutral-900";
            let trendColorClass = "text-neutral-400";

            if (stat.label === "Resources Owned") {
              valueColorClass = "text-accent-blue";
            } else if (stat.label === "Total Downloads") {
            valueColorClass = "text-emerald-600";
            trendColorClass = "text-neutral-400";
            } else if (stat.label === "Featured Resources") {
              valueColorClass = "text-accent-yellow";
              trendColorClass = "text-accent-yellow";
            }

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        stat.label === "Total Downloads"
                          ? "text-emerald-600"
                          : ""
                      }`}
                    />
                  </span>
                </div>
                <p
                  className={`mt-3 text-2xl font-bold tracking-tight ${valueColorClass}`}
                >
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-neutral-500">
                  {stat.label}
                </p>
                <p className={`mt-1 text-[11px] ${trendColorClass}`}>
                  {stat.trend}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Continue + Recent (2 columns on large screens) ────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Recent downloads */}
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Recent downloads
                </h2>
              </div>
              <Link
                href="/dashboard/library"
                className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentPurchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-50">
                  <BookOpen className="h-6 w-6 text-neutral-300" />
                </div>
                <p className="mt-3 text-[13px] font-medium text-neutral-500">
                  No resources yet
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Browse the marketplace to find your first resource
                </p>
                <Link
                  href="/resources"
                  className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-[12px] font-semibold text-white hover:bg-neutral-800"
                >
                  Browse marketplace
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {recentPurchases.map((purchase) => (
                  <li key={purchase.id}>
                    <Link
                      href={`/resources/${purchase.resource.slug}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-neutral-50/60"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-50">
                        {purchase.resource.previewUrl ? (
                          <Image
                            src={purchase.resource.previewUrl}
                            alt={purchase.resource.title}
                            width={40}
                            height={40}
                            sizes="40px"
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-neutral-900">
                          {purchase.resource.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {purchase.resource.author?.name ?? "Unknown"} ·{" "}
                          {formatDate(purchase.createdAt)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-[12px] font-semibold">
                        {purchase.resource.isFree ? (
                          <span className="font-medium text-green-600">Free</span>
                        ) : (
                          <span className="text-neutral-500">
                            {formatPrice(purchase.resource.price / 100)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Continue + Quick actions */}
          <div className="flex flex-col gap-4">
            {/* Continue where you left off */}
            {lastOpened && (
              <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Continue where you left off
                </p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-violet-100">
                    {lastOpened.resource.previewUrl ? (
                      <Image
                        src={lastOpened.resource.previewUrl}
                        alt={lastOpened.resource.title}
                        width={40}
                        height={40}
                        sizes="40px"
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-900">
                      {lastOpened.resource.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {lastOpened.resource.author?.name ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/resources/${lastOpened.resource.slug}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[13px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  <BookOpen className="h-4 w-4" />
                  Open resource
                </Link>
              </div>
            )}

            {/* Quick stats */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Quick links
              </p>
              <div className="mt-3 space-y-1">
                {[
                  {
                    href: "/dashboard/library",
                    label: "My Library",
                    icon: BookOpen,
                    count: purchases.length,
                  },
                  {
                    href: "/dashboard/downloads",
                    label: "Downloads",
                    icon: Download,
                    count: purchases.length,
                  },
                  {
                    href: "/resources",
                    label: "Marketplace",
                    icon: TrendingUp,
                    count: null,
                  },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-neutral-400" />
                        {link.label}
                      </div>
                      {link.count !== null && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                          {link.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recommended Resources ─────────────────────────────── */}
        {recommended.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-neutral-900">
                  Recommended for you
                </h2>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  Popular resources you haven&apos;t explored yet
                </p>
              </div>
              <Link
                href="/resources"
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                See all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommended.map((resource) => (
                <Link
                  key={resource.id}
                  href={`/resources/${resource.slug}`}
                  className="group flex w-[200px] flex-shrink-0 flex-col rounded-2xl border border-neutral-100 bg-white p-4 shadow-card transition hover:border-neutral-200 hover:shadow-card-md"
                >
                  <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100">
                    {resource.previewUrl ? (
                      <Image
                        src={resource.previewUrl}
                        alt={resource.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-zinc-300" />
                    )}
                  </div>
                  <div className="mt-3 flex-1">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-neutral-900">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {resource.author?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-neutral-900">
                      {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                    </span>
                    <span className="rounded-lg bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      View
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
