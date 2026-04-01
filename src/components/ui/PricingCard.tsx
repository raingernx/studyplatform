"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthViewer } from "@/lib/auth/use-auth-viewer";
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
  const authViewer = useAuthViewer();
  const router = useRouter();

  const price = billing === "annual" ? tier.price.annual : tier.price.monthly;
  const savings =
    billing === "annual" && tier.price.monthly > 0
      ? Math.round(
          ((tier.price.monthly * 12 - tier.price.annual * 12) /
            (tier.price.monthly * 12)) * 100
        )
      : 0;

  async function handleSubscribe() {
    if (!tier.stripePlan) return;
    if (!authViewer.isReady) return;
    if (!authViewer.authenticated) {
      router.push(`${routes.login}?next=${encodeURIComponent(routes.membership)}`);
      return;
    }
    setLoading(true);
    try {
      const plan = billing === "annual" ? tier.stripePlan.annual : tier.stripePlan.monthly;
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", plan }),
      });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
    } finally { setLoading(false); }
  }

  if (tier.highlighted) {
    return (
      <div className="relative flex flex-col rounded-3xl p-px overflow-hidden
                      shadow-pricing-featured">
        {/* Gradient border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 via-violet-500 to-blue-700" />

        <div className="relative flex flex-col rounded-[calc(1.25rem-1px)] bg-zinc-950 p-8 flex-1">
          {/* Dot grid overlay */}
          <div className="absolute inset-0 rounded-[calc(1.25rem-1px)] bg-dot-dark opacity-40" />

          {tier.badge && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full
                               bg-gradient-to-r from-orange-500 to-orange-400
                               px-3.5 py-1 text-xs font-bold text-white shadow-glow-orange">
                <Sparkles className="h-3 w-3" />
                {tier.badge}
              </span>
            </div>
          )}

          <div className="relative">
            {/* Plan name */}
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              {tier.name}
            </p>
            <p className="mt-1.5 text-sm text-zinc-400">{tier.description}</p>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-white">
                {price === 0 ? "Free" : `$${price}`}
              </span>
              {price > 0 && (
                <span className="text-sm text-zinc-500">/mo</span>
              )}
              {savings > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5
                                 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Save {savings}%
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="mt-6 border-t border-white/10" />

            {/* Features */}
            <ul className="mt-5 space-y-3 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center
                                   rounded-full bg-blue-600/20 ring-1 ring-blue-500/30">
                    <Check className="h-3 w-3 text-blue-400" />
                  </span>
                  <span className="text-sm text-zinc-300 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-8">
              <Button
                onClick={tier.stripePlan ? handleSubscribe : undefined}
                loading={loading || (Boolean(tier.stripePlan) && !authViewer.isReady)}
                variant="accent"
                fullWidth
                size="lg"
                className="shadow-glow-orange"
                disabled={Boolean(tier.stripePlan) && !authViewer.isReady}
              >
                {tier.stripePlan && !authViewer.isReady ? "Checking account…" : tier.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-highlighted tier
  return (
    <div className="relative flex flex-col rounded-3xl bg-white p-8
                    ring-1 ring-zinc-200 shadow-card
                    transition-all duration-200 hover:shadow-card-md hover:-translate-y-0.5">
      {tier.badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2
                         rounded-full bg-zinc-900 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
          {tier.badge}
        </span>
      )}

      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {tier.name}
      </p>
      <p className="mt-1.5 text-sm text-zinc-500">{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight text-zinc-900">
          {price === 0 ? "Free" : `$${price}`}
        </span>
        {price > 0 && <span className="text-sm text-zinc-400">/mo</span>}
        {savings > 0 && (
          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5
                           text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Save {savings}%
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-zinc-100" />

      <ul className="mt-5 flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center
                             rounded-full bg-blue-50 ring-1 ring-blue-100">
              <Check className="h-3 w-3 text-blue-600" />
            </span>
            <span className="text-sm text-zinc-600 leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          onClick={tier.stripePlan ? handleSubscribe : undefined}
          loading={loading || (Boolean(tier.stripePlan) && !authViewer.isReady)}
          variant="outline"
          fullWidth
          size="lg"
          disabled={Boolean(tier.stripePlan) && !authViewer.isReady}
        >
          {tier.stripePlan && !authViewer.isReady ? "Checking account…" : tier.cta}
        </Button>
      </div>
    </div>
  );
}
