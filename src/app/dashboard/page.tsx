import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { getBaseUrl } from "@/lib/api";
import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  Download,
  Star,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

interface Purchase {
  id: string;
  amount: number;
  createdAt: string;
  resource: {
    id: string;
    title: string;
    slug: string;
    previewUrl?: string | null;
    category?: { name: string } | null;
  };
}

interface Subscription {
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  currentPeriodEnd: string | null;
}

async function getPurchases(userId: string): Promise<Purchase[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/purchases`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getSubscription(): Promise<Subscription | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/subscriptions`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/dashboard");
  }

  const [purchases, subscription] = await Promise.all([
    getPurchases(session.user.id),
    getSubscription(),
  ]);

  const isSubscribed = subscription?.subscriptionStatus === "ACTIVE";
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
  const recentPurchases = purchases.slice(0, 5);

  const STATS = [
    {
      icon: BookOpen,
      label: "Resources owned",
      value: purchases.length,
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: CreditCard,
      label: "Total spent",
      value: formatPrice(totalSpent),
      color: "text-purple-600 bg-purple-50",
    },
    {
      icon: TrendingUp,
      label: "Membership",
      value: isSubscribed ? "Pro" : "Free",
      color: isSubscribed
        ? "text-orange-600 bg-orange-50"
        : "text-gray-600 bg-gray-100",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="flex flex-1">
        <DashboardSidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            subscriptionStatus: subscription?.subscriptionStatus ?? undefined,
          }}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Here&apos;s an overview of your learning activity
              </p>
            </div>

            {/* Subscription banner if not subscribed */}
            {!isSubscribed && (
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 p-5 text-white shadow-md">
                <div>
                  <p className="font-semibold">Unlock unlimited resources</p>
                  <p className="mt-0.5 text-sm text-blue-100">
                    Pro plan gives you access to everything — one flat price.
                  </p>
                </div>
                <Link
                  href="/membership"
                  className="flex-shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Upgrade now
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                  >
                    <span
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${s.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent purchases */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Recent resources</h2>
                <Link
                  href="/dashboard/purchases"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentPurchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-500">No resources yet</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Browse the library to find your first resource
                  </p>
                  <Link
                    href="/resources"
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Browse library
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentPurchases.map((purchase) => (
                    <li key={purchase.id}>
                      <Link
                        href={`/resources/${purchase.resource.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {purchase.resource.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {purchase.resource.category && (
                              <Badge variant="blue" className="text-xs">
                                {purchase.resource.category.name}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Amount + download */}
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-gray-700">
                            {formatPrice(purchase.amount)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <Download className="h-3 w-3" /> Download
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Subscription details */}
            {isSubscribed && subscription && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-gray-900">Subscription</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                      <Star className="h-5 w-5 fill-white text-white" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Pro — {subscription.subscriptionPlan?.replace("_", " ")}
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-gray-500">
                          Renews{" "}
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/dashboard/subscription"
                      className="ml-auto text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
