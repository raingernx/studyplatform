import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Sparkles,
  Check,
  BookOpen,
  Download,
  ShieldCheck,
  Zap,
  ArrowRight,
  CreditCard,
  Star,
} from "lucide-react";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Membership – PaperDock",
};

export const dynamic = "force-dynamic";

const PRO_BENEFITS = [
  {
    icon: BookOpen,
    label: "Unlimited resource access",
    desc: "Access every resource in the library, no per-item purchases.",
  },
  {
    icon: Download,
    label: "Unlimited downloads",
    desc: "Download resources as many times as you need.",
  },
  {
    icon: Zap,
    label: "Early access to new content",
    desc: "Get new study materials before they go public.",
  },
  {
    icon: ShieldCheck,
    label: "Priority support",
    desc: "Skip the queue with dedicated member support.",
  },
];

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/subscription");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      currentPeriodEnd: true,
      purchases: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  const isActive = user?.subscriptionStatus === "ACTIVE";
  const isTrialing = user?.subscriptionStatus === "TRIALING";
  const hasPlan = isActive || isTrialing;
  const resourcesOwned = user?.purchases.length ?? 0;

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
            Membership
          </h1>
          <p className="mt-1 text-[14px] text-zinc-500">
            Manage your plan and unlock full access to PaperDock.
          </p>
        </div>

        {hasPlan ? (
          <div className="space-y-5">
            {/* Active plan card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-blue-500 p-6 text-white shadow-glow-violet">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-white/5" />
              <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    <span className="text-[12px] font-semibold uppercase tracking-widest text-blue-100">
                      {isTrialing ? "Free Trial" : "Pro Plan"}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {isTrialing ? "Trial Active" : "Pro — Active"}
                  </p>
                  <p className="mt-1 text-[13px] text-blue-100">
                    You have full access to all resources on PaperDock.
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                </span>
              </div>

              {user?.currentPeriodEnd && (
                <div className="relative mt-6 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="text-[12px] text-blue-100">
                    {isTrialing ? "Trial ends" : "Renews on"}
                  </span>
                  <span className="text-[13px] font-semibold">
                    {formatDate(user.currentPeriodEnd)}
                  </span>
                </div>
              )}
            </div>

            {/* Usage stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  Resources owned
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                  {resourcesOwned}
                </p>
                <Link
                  href="/dashboard/library"
                  className="mt-2 flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700"
                >
                  View library <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  Plan
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-zinc-900">
                  {user?.subscriptionPlan?.replace(/_/g, " ") ?? "Pro"}
                </p>
                <p className="mt-1 text-[12px] text-zinc-400">
                  Unlimited access
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card">
              <h2 className="text-[14px] font-semibold text-zinc-900">
                Your Pro benefits
              </h2>
              <ul className="mt-4 space-y-4">
                {PRO_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.label} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <Icon className="h-4 w-4 text-emerald-600" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-900">
                          {benefit.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-zinc-500">
                          {benefit.desc}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Billing portal */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-900">
                    Billing &amp; invoices
                  </p>
                  <p className="mt-0.5 text-[12px] text-zinc-500">
                    Manage payment, cancel, or change your plan.
                  </p>
                </div>
                <button
                  disabled
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-[12px] font-medium text-zinc-400 opacity-60 cursor-not-allowed"
                >
                  Billing portal (soon)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Current plan — free */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                    <CreditCard className="h-5 w-5 text-zinc-400" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-900">
                      Free Plan
                    </p>
                    <p className="mt-0.5 text-[12px] text-zinc-500">
                      Purchase resources individually.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                  Current plan
                </span>
              </div>
            </div>

            {/* Pro upgrade card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-100/40" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <span className="text-[13px] font-bold text-violet-700">
                    Pro Plan
                  </span>
                </div>
                <p className="mt-2 text-[22px] font-bold tracking-tight text-zinc-900">
                  Unlimited access
                </p>
                <p className="mt-1 text-[13px] text-zinc-600">
                  Get everything PaperDock has to offer — one flat price.
                </p>

                <ul className="mt-5 space-y-2.5">
                  {PRO_BENEFITS.map((benefit) => (
                    <li
                      key={benefit.label}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </span>
                      <span className="text-[13px] text-zinc-700">
                        {benefit.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/membership"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
