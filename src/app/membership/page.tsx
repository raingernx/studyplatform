"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingCard, type PricingTier } from "@/components/ui/PricingCard";
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
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-blue-200">
            Start free, upgrade when you&apos;re ready. Cancel any time.
          </p>

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
        </div>
      </section>

      {/* ── Pricing cards ────────────────────────────────────────────────────── */}
      <section className="relative -mt-8 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} billing={billing} />
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ─────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Compare plans
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-4 text-left font-semibold text-gray-700">Feature</th>
                  {TIERS.map((t) => (
                    <th
                      key={t.id}
                      className={`p-4 text-center font-semibold ${
                        t.highlighted ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-700">{row.feature}</td>
                    {[row.free, row.pro, row.team].map((val, i) => (
                      <td key={i} className="p-4 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="mx-auto h-4 w-4 text-blue-600" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="font-medium text-gray-900">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-gray-500">
              Can&apos;t find the answer you need?{" "}
              <a href="mailto:support@studyplatform.dev" className="text-blue-600 hover:underline">
                Email us
              </a>
              .
            </p>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.q}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to start learning?
          </h2>
          <p className="mt-3 text-blue-100">
            Join thousands of students who accelerate their learning with
            PaperDock.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => document.getElementById("pricing-cards")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
