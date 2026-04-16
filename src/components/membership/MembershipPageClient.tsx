"use client";

import { useMemo, useState } from "react";

import {
  MembershipTierAction,
  PricingCard,
  type PricingTier,
} from "@/components/membership/PricingCard";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";

type BillingInterval = "monthly" | "annual";

const membershipFaq = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. You can stay free, upgrade to Pro later, or contact support if your team needs a larger setup.",
  },
  {
    question: "What happens to resources I already bought?",
    answer:
      "You keep access to resources you already purchased, even if you stay on the free plan.",
  },
  {
    question: "How does annual billing work?",
    answer:
      "Annual pricing lowers the monthly equivalent and bills the full year at checkout.",
  },
  {
    question: "How do team plans work?",
    answer:
      "Team plans use the same checkout flow, with shared billing and onboarding designed for small groups.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel before the next renewal date and keep access through the end of your current billing period.",
  },
  {
    question: "Do I get receipts or invoices?",
    answer:
      "Yes. Receipts stay available after checkout, and paid plans can request billing support when invoice details are needed.",
  },
  {
    question: "Can I pay monthly instead of yearly?",
    answer:
      "Yes. Monthly and annual billing are both available for eligible plans, and you can choose the cadence before checkout.",
  },
  {
    question: "Do I need an account before subscribing?",
    answer:
      "Yes. You will be asked to sign in before checkout so your membership and purchases stay attached to your account.",
  },
] as const;

function BillingToggle({
  billing,
  onChange,
}: {
  billing: BillingInterval;
  onChange: (billing: BillingInterval) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border-subtle bg-card p-0.5 shadow-card">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          billing === "monthly"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          billing === "annual"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Annual
      </button>
    </div>
  );
}

export function MembershipPageClient() {
  const [billing, setBilling] = useState<BillingInterval>("annual");
  const platform = usePlatformConfig();
  const faqColumns = useMemo(() => {
    const midpoint = Math.ceil(membershipFaq.length / 2);
    return [membershipFaq.slice(0, midpoint), membershipFaq.slice(midpoint)];
  }, []);

  const tiers = useMemo<PricingTier[]>(
    () => [
      {
        id: "free",
        name: "Free",
        price: { monthly: 0, annual: 0 },
        description: "Pay per resource",
        cta: "Browse resources",
        href: routes.marketplace,
        features: [
          "Browse the marketplace",
          "Buy resources individually",
          "Keep owned downloads",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        price: { monthly: 249, annual: 189 },
        description: "Unlimited access",
        cta: "Choose Pro",
        highlighted: true,
        stripePlan: { monthly: "pro_monthly", annual: "pro_annual" },
        features: [
          "Unlimited premium access",
          "New releases included",
          "Priority support",
        ],
      },
      {
        id: "team",
        name: "Team",
        price: { monthly: 790, annual: 590 },
        description: "For teams",
        cta: "Choose Team",
        stripePlan: { monthly: "team_monthly", annual: "team_annual" },
        features: [
          "Shared seats",
          "Centralized billing",
          "Guided onboarding",
        ],
      },
    ],
    [],
  );
  return (
    <PageContent className="space-y-14 lg:space-y-16">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pricing</h1>
          <p className="text-base text-muted-foreground">Start free. Upgrade anytime.</p>
        </div>

        <div className="shrink-0">
          <BillingToggle billing={billing} onChange={setBilling} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl" id="pricing-cards">
        <div className="grid grid-cols-1 divide-y divide-border-subtle xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          {tiers.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              billing={billing}
              columnPosition={
                index === 0 ? "start" : index === tiers.length - 1 ? "end" : "middle"
              }
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl pt-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">FAQ</h2>
            <p className="text-sm text-muted-foreground">A few quick answers before you choose a plan.</p>
          </div>

          <div className="grid gap-x-10 gap-y-0 lg:grid-cols-2">
            {faqColumns.map((column, columnIndex) => (
              <div
                key={`faq-column-${columnIndex}`}
                className="divide-y divide-border-subtle border-y border-border-subtle"
              >
                {column.map((item) => (
                  <details key={item.question} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground marker:hidden">
                      <span>{item.question}</span>
                      <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="pt-3 pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl pt-10 pb-14 sm:pt-12 sm:pb-16">
        <div className="rounded-[24px] border border-border-subtle bg-card/40 px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Need help with billing or seats?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                We can help you choose the right plan and get started.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:shrink-0">
              <MembershipTierAction
                tier={{
                  id: "contact-sales",
                  name: "Contact sales",
                  price: { monthly: 0, annual: 0 },
                  description: "Talk through billing, seats, and onboarding.",
                  cta: "Contact sales",
                  features: [],
                  href: `mailto:${platform.supportEmail}`,
                  external: true,
                }}
                billing={billing}
                fullWidth={false}
                disableMotion
                className="w-full lg:w-[12rem]"
              />
            </div>
          </div>
        </div>
      </section>
    </PageContent>
  );
}
