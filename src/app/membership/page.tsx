"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import {
  PageContainer,
  PageContent,
  PageContentNarrow,
} from "@/design-system";
import { PricingCard, type PricingTier } from "@/components/membership/PricingCard";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { Check, HelpCircle } from "lucide-react";

const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    description: "Everything you need to get started.",
    cta: "Get started free",
    features: [
      "Access to all free resources",
      "Download up to 3 resources/month",
      "Community forum access",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 12, annual: 9 },
    description: "Unlimited access for serious learners.",
    cta: "Start free trial",
    highlighted: true,
    badge: "Most popular",
    stripePlan: { monthly: "pro_monthly", annual: "pro_annual" },
    features: [
      "Unlimited resource downloads",
      "Access to all premium content",
      "New resources every week",
      "Priority email support",
      "Ad-free experience",
      "Early access to new features",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: { monthly: 39, annual: 29 },
    description: "For classrooms, tutors, and study groups.",
    cta: "Contact sales",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Team resource collections",
      "Admin dashboard",
      "Bulk download tools",
      "Dedicated account manager",
    ],
  },
];

const FAQ = [
  {
    q: "Can I cancel any time?",
    a: "Yes — cancel any time from your dashboard. You keep access until the end of your billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "Pro plans include a 7-day free trial. No credit card required to start.",
  },
  {
    q: "What file formats are available?",
    a: "All resources are available as PDF downloads, optimized for both screen and print.",
  },
  {
    q: "Do prices include tax?",
    a: "Prices shown are exclusive of applicable taxes, which are added at checkout based on your location.",
  },
  {
    q: "Can I buy resources individually?",
    a: "Absolutely — every resource can be purchased individually with a one-time payment. No subscription needed.",
  },
  {
    q: "What's your refund policy?",
    a: "We offer a 30-day money-back guarantee on all purchases, no questions asked.",
  },
];

const COMPARISON_ROWS = [
  { feature: "Free resources", free: true, pro: true, team: true },
  { feature: "Premium resources", free: false, pro: true, team: true },
  { feature: "Downloads / month", free: "3", pro: "Unlimited", team: "Unlimited" },
  { feature: "New releases", free: false, pro: true, team: true },
  { feature: "Team collections", free: false, pro: false, team: true },
  { feature: "Admin dashboard", free: false, pro: false, team: true },
  { feature: "Priority support", free: false, pro: true, team: true },
];

export default function MembershipPage() {
  const platform = usePlatformConfig();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 py-20 text-center sm:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-12 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <PageContainer>
          <PageContentNarrow className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
              Membership
            </p>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-blue-200">
              Start free, upgrade when you&apos;re ready, and choose the plan that matches how deeply you want to learn.
            </p>
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm">
              Cancel any time. No hidden fees.
            </span>
          </div>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white/10 p-1 backdrop-blur-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                billing === "monthly"
                  ? "bg-white text-gray-900 shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                billing === "annual"
                  ? "bg-white text-gray-900 shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Annual
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                Save 25%
              </span>
            </button>
          </div>
          </PageContentNarrow>
        </PageContainer>
      </section>

      {/* ── Pricing cards ────────────────────────────────────────────────────── */}
      <section className="relative -mt-8 pb-20">
        <PageContainer>
          <PageContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} billing={billing} />
          ))}
          </PageContent>
        </PageContainer>
      </section>

      {/* ── Feature comparison table ─────────────────────────────────────────── */}
      <section className="bg-background py-16">
        <PageContainer>
          <PageContent className="space-y-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Plan details
            </p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">
              Compare plans
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A clearer look at what changes as you move from free access to premium and team workflows.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 text-left font-semibold text-foreground">Feature</th>
                  {TIERS.map((t) => (
                    <th
                      key={t.id}
                      className={`p-4 text-center font-semibold ${
                        t.highlighted ? "text-blue-700" : "text-foreground"
                      }`}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-muted/50">
                    <td className="p-4 text-foreground">{row.feature}</td>
                    {[row.free, row.pro, row.team].map((val, i) => (
                      <td key={i} className="p-4 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="mx-auto h-4 w-4 text-blue-600" />
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )
                        ) : (
                          <span className="font-medium text-foreground">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </PageContent>
        </PageContainer>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-muted/40 py-16">
        <PageContainer>
          <PageContentNarrow className="space-y-10">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              FAQ
            </p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Can&apos;t find the answer you need?{" "}
              <a
                href={`mailto:${platform.supportEmail}`}
                className="text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                Email us
              </a>
              .
            </p>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-semibold text-foreground">{item.q}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </PageContentNarrow>
        </PageContainer>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-14">
        <PageContainer>
          <PageContentNarrow className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/75">
            Start today
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Ready to start learning?
          </h2>
          <p className="mt-3 text-blue-100">
            Join thousands of students who accelerate their learning with
            {` ${platform.platformShortName}.`}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => document.getElementById("pricing-cards")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
            >
              Get started free
            </button>
          </div>
          </PageContentNarrow>
        </PageContainer>
      </section>
    </div>
  );
}
