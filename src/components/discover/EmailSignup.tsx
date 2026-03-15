"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

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
    <section className="py-12">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Get tips and new resources
          </h2>
          <p className="mt-2 text-sm text-white/85">
            Join our newsletter for study tips, creator spotlights, and new resource alerts.
          </p>
          {submitted ? (
            <p className="mt-6 text-sm font-medium text-white/90" role="status">
              Thanks for signing up.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                className="h-10 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
              />
              <Button
                type="submit"
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
