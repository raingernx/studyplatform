"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Button, useToast } from "@/design-system";
import { primeAuthViewer, useAuthViewer } from "@/lib/auth/use-auth-viewer";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface PricingTier {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  cta: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  stripePlan?: { monthly: string; annual: string };
  href?: string;
  external?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  billing: "monthly" | "annual";
  columnPosition?: "start" | "middle" | "end";
}

interface MembershipTierActionProps {
  tier: PricingTier;
  billing: "monthly" | "annual";
  className?: string;
  fullWidth?: boolean;
  disableMotion?: boolean;
}

export function MembershipTierAction({
  tier,
  billing,
  className,
  fullWidth = true,
  disableMotion = false,
}: MembershipTierActionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const router = useRouter();

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
      router.push(routes.loginWithNext(routes.membership));
      return;
    }

    setLoading(true);
    try {
      const plan =
        billing === "annual" ? tier.stripePlan.annual : tier.stripePlan.monthly;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", plan }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof json?.error === "string"
            ? json.error
            : "Could not start checkout.",
        );
      }

      if (typeof json?.data?.url !== "string") {
        throw new Error("Could not start checkout.");
      }

      window.location.href = json.data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
    } finally {
      setLoading(false);
    }
  }

  const actionLabel = isCheckingAccount ? "Checking account…" : tier.cta;
  const actionVariant = tier.highlighted ? "primary" : "outline";

  if (tier.stripePlan) {
    return (
      <Button
        onClick={handleSubscribe}
        onPointerEnter={() => void primeAuthViewer()}
        onFocus={() => void primeAuthViewer()}
        loading={loading || isCheckingAccount}
        variant={actionVariant}
        className={cn(fullWidth && "w-full", disableMotion && "transition-none", className)}
        disabled={loading || isCheckingAccount}
      >
        {actionLabel}
      </Button>
    );
  }

  if (tier.href) {
    if (tier.external) {
      const isMailto = tier.href.startsWith("mailto:");
      return (
        <Button
          asChild
          variant={actionVariant}
          className={cn(fullWidth && "w-full", disableMotion && "transition-none", className)}
        >
          <a
            href={tier.href}
            {...(!isMailto ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {tier.cta}
          </a>
        </Button>
      );
    }

    return (
      <Button
        asChild
        variant={actionVariant}
        className={cn(fullWidth && "w-full", disableMotion && "transition-none", className)}
      >
        <Link href={tier.href}>{tier.cta}</Link>
      </Button>
    );
  }

  return null;
}

export function PricingCard({
  tier,
  billing,
  columnPosition = "middle",
}: PricingCardProps) {
  const price = billing === "annual" ? tier.price.annual : tier.price.monthly;
  const annualSavings =
    billing === "annual" && tier.price.monthly > 0
      ? Math.round(
          ((tier.price.monthly * 12 - tier.price.annual * 12) /
            (tier.price.monthly * 12)) *
            100,
        )
      : 0;
  const billingNote =
    tier.id === "free"
      ? null
      : billing === "annual"
        ? "Billed annually"
        : "Billed monthly";
  const supportLine =
    tier.id === "free"
      ? "For individual purchases"
      : tier.id === "team"
        ? "Shared billing and onboarding"
        : "For regular use";

  const action = (
    <MembershipTierAction tier={tier} billing={billing} className="w-full" />
  );

  return (
    <div
      data-membership-tier={tier.id}
      className={cn(
        "flex h-full flex-col px-0 py-7 sm:py-8",
        columnPosition === "start"
          ? "xl:pr-8"
          : columnPosition === "end"
            ? "xl:pl-8"
            : "xl:px-8",
      )}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-base font-semibold tracking-[0.01em] text-foreground">{tier.name}</h2>
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {price === 0 ? "Free" : `THB ${price}`}
          </div>
          <p className="text-base text-muted-foreground">
            {price === 0 ? "Forever" : supportLine}
          </p>
        </div>

        <div className="space-y-1.5 border-y border-border-subtle py-5">
          <p className="text-base text-muted-foreground">
            {tier.id === "free" ? tier.description : `${tier.description} · ${billingNote}`}
          </p>
          {annualSavings > 0 ? (
            <p className="text-xs tracking-[0.14em] text-primary uppercase">
              Save {annualSavings}% yearly
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex-1">
        <div className="space-y-3">
          {tier.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-accent text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-base leading-7 text-foreground/88">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">{action}</div>
    </div>
  );
}
