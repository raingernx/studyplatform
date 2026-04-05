"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/design-system";
import { primeAuthViewer, useAuthViewer } from "@/lib/auth/use-auth-viewer";
import { routes } from "@/lib/routes";

export interface PricingTier {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  stripePlan?: { monthly: string; annual: string };
}

interface PricingCardProps {
  tier: PricingTier;
  billing: "monthly" | "annual";
}

export function PricingCard({ tier, billing }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const router = useRouter();

  const price = billing === "annual" ? tier.price.annual : tier.price.monthly;
  const savings =
    billing === "annual" && tier.price.monthly > 0
      ? Math.round(
          ((tier.price.monthly * 12 - tier.price.annual * 12) /
            (tier.price.monthly * 12)) *
            100,
        )
      : 0;

  async function handleSubscribe() {
    if (!tier.stripePlan) return;

    const viewer = authViewer.isReady
      ? authViewer
      : await (async () => {
          setIsCheckingAccount(true);
          try {
            return await primeAuthViewer();
          } finally {
            setIsCheckingAccount(false);
          }
        })();

    if (!viewer.authenticated) {
      router.push(`${routes.login}?next=${encodeURIComponent(routes.membership)}`);
      return;
    }

    setLoading(true);
    try {
      const plan = billing === "annual" ? tier.stripePlan.annual : tier.stripePlan.monthly;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", plan }),
      });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setLoading(false);
    }
  }

  if (tier.highlighted) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-3xl p-px shadow-pricing-featured">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 via-violet-500 to-blue-700" />

        <div className="relative flex flex-1 flex-col rounded-[calc(1.25rem-1px)] bg-zinc-950 p-8">
          <div className="absolute inset-0 rounded-[calc(1.25rem-1px)] bg-dot-dark opacity-40" />

          {tier.badge ? (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-3.5 py-1 text-xs font-bold text-white shadow-glow-orange">
                <Sparkles className="h-3 w-3" />
                {tier.badge}
              </span>
            </div>
          ) : null}

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              {tier.name}
            </p>
            <p className="mt-1.5 text-sm text-white/72">{tier.description}</p>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-white">
                {price === 0 ? "Free" : `$${price}`}
              </span>
              {price > 0 ? <span className="text-sm text-white/45">/mo</span> : null}
              {savings > 0 ? (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Save {savings}%
                </span>
              ) : null}
            </div>

            <div className="mt-6 border-t border-white/10" />

            <ul className="mt-5 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20 ring-1 ring-blue-500/30">
                    <Check className="h-3 w-3 text-blue-400" />
                  </span>
                  <span className="text-sm leading-relaxed text-white/82">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button
                onClick={tier.stripePlan ? handleSubscribe : undefined}
                onPointerEnter={tier.stripePlan ? () => void primeAuthViewer() : undefined}
                onFocus={tier.stripePlan ? () => void primeAuthViewer() : undefined}
                loading={loading || isCheckingAccount}
                variant="accent"
                fullWidth
                size="lg"
                className="shadow-glow-orange"
                disabled={loading || isCheckingAccount}
              >
                {isCheckingAccount ? "Checking account…" : tier.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col rounded-3xl bg-card p-8 ring-1 ring-border shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-md">
      {tier.badge ? (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3.5 py-1 text-xs font-bold text-background shadow-sm">
          {tier.badge}
        </span>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {tier.name}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight text-foreground">
          {price === 0 ? "Free" : `$${price}`}
        </span>
        {price > 0 ? <span className="text-sm text-muted-foreground">/mo</span> : null}
        {savings > 0 ? (
          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Save {savings}%
          </span>
        ) : null}
      </div>

      <div className="mt-6 border-t border-border" />

      <ul className="mt-5 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
              <Check className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          onClick={tier.stripePlan ? handleSubscribe : undefined}
          onPointerEnter={tier.stripePlan ? () => void primeAuthViewer() : undefined}
          onFocus={tier.stripePlan ? () => void primeAuthViewer() : undefined}
          loading={loading || isCheckingAccount}
          variant="outline"
          fullWidth
          size="lg"
          disabled={loading || isCheckingAccount}
        >
          {isCheckingAccount ? "Checking account…" : tier.cta}
        </Button>
      </div>
    </div>
  );
}
