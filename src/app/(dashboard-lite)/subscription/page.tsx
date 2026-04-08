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
import { requireSession } from "@/lib/auth/require-session";
import { formatDate } from "@/lib/format";
import { PageContentNarrow } from "@/design-system";
import { getDashboardSubscriptionPageData } from "@/services/admin";
import { getBuildSafePlatformConfig } from "@/services/platform";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Membership",
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
  const { userId } = await requireSession(routes.subscription);

  const platform = getBuildSafePlatformConfig();
  const user = await getDashboardSubscriptionPageData(userId);

  const isActive = user?.subscriptionStatus === "ACTIVE";
  const isTrialing = user?.subscriptionStatus === "TRIALING";
  const hasPlan = isActive || isTrialing;
  const resourcesOwned = user?.purchases.length ?? 0;

  return (
    <PageContentNarrow data-route-shell-ready="dashboard-subscription" className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
          Membership
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Manage your plan and unlock full access to {platform.platformShortName}.
        </p>
      </div>

      {hasPlan ? (
        <div className="space-y-5">
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
                  You have full access to all resources on {platform.platformShortName}.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Resources owned
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {resourcesOwned}
              </p>
              <Link
                href={routes.library}
                className="mt-2 flex items-center gap-1 text-[12px] font-medium text-primary transition hover:opacity-80"
              >
                View library <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Plan
              </p>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {user?.subscriptionPlan?.replace(/_/g, " ") ?? "Pro"}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Unlimited access
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-[14px] font-semibold text-foreground">
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
                      <p className="text-[13px] font-semibold text-foreground">
                        {benefit.label}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {benefit.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  Billing &amp; invoices
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Manage payment, cancel, or change your plan.
                </p>
              </div>
              <button
                disabled
                className="cursor-not-allowed rounded-xl border border-border bg-muted px-4 py-2 text-[12px] font-medium text-muted-foreground opacity-60"
              >
                Billing portal (soon)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    Free Plan
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Purchase resources individually.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                Current plan
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-6">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-100/40" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <span className="text-[13px] font-bold text-violet-700">
                  Pro Plan
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                Unlock everything
              </h2>
              <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
                Get unlimited access to every resource, plus priority support and early content drops.
              </p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {PRO_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li
                      key={benefit.label}
                      className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-3 ring-1 ring-white/80"
                    >
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">
                          {benefit.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {benefit.desc}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  disabled
                  className="cursor-not-allowed rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background opacity-60"
                >
                  Upgrade to Pro (soon)
                </button>
                <span className="text-[12px] text-muted-foreground">
                  Payments and billing portal are being finalized.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContentNarrow>
  );
}
