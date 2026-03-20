"use client";

import { useState } from "react";
import { Button } from "@/design-system";

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="py-6">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 px-6 py-10 text-white shadow-card-lg sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Stay in the loop
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Get tips and new resources
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Join our newsletter for study tips, creator spotlights, and carefully curated new resource alerts.
            </p>
          </div>
          {submitted ? (
            <p className="text-sm font-medium text-white/90" role="status">
              Thanks for signing up.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor="discover-email" className="sr-only">
                Email address
              </label>
              <input
                id="discover-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                aria-label="Email address"
                className="h-11 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
              />
              <Button
                type="submit"
                size="lg"
                className="shrink-0 bg-white text-brand-700 hover:bg-white/90"
              >
                Sign up
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
