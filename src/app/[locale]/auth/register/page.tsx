"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/design-system";
import { Logo } from "@/components/brand/Logo";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { Check, AlertCircle } from "lucide-react";
import { routes } from "@/lib/routes";

const PERKS = [
  "Access free resources instantly",
  "30-day refund on all purchases",
  "Cancel subscription any time",
];

const GOOGLE_SIGN_IN_CALLBACK_URL = routes.library;

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const platform = usePlatformConfig();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`${routes.login}?checkEmail=1&email=${encodeURIComponent(email)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* ── Left decorative panel (desktop only) ─────────────────────────── */}
      <div className="hidden flex-1 flex-col justify-between bg-zinc-950 px-10 py-12 lg:flex">
        <Logo variant="full" size="lg" dark />

        {/* Headline */}
        <div>
          <p className="eyebrow-dark mb-4">Free to start</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Start learning<br />smarter today
          </h2>
          <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed">
            Join 18,000+ students who use {platform.platformShortName} to access curated
            educational resources.
          </p>
          <ul className="mt-8 space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[13px] text-zinc-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-400/30">
                  <Check className="h-2.5 w-2.5 text-blue-400" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom social proof */}
        <p className="text-[12px] text-zinc-600">
          © {new Date().getFullYear()} {platform.platformShortName}
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Logo variant="full" size="md" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            Free to start — no credit card required
          </p>

          <div className="mt-7 rounded-2xl border border-zinc-200 bg-white p-8 shadow-card">
            {/* Google OAuth */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: GOOGLE_SIGN_IN_CALLBACK_URL })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200
                         bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-700 shadow-card
                         transition-all hover:border-zinc-300 hover:shadow-card-md active:scale-[0.99]"
          >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-medium text-zinc-400">
                  or register with email
                </span>
              </div>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900
                             placeholder-zinc-400 shadow-sm outline-none transition
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900
                             placeholder-zinc-400 shadow-sm outline-none transition
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900
                             placeholder-zinc-400 shadow-sm outline-none transition
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                Create account
              </Button>
            </form>

            <p className="mt-4 text-center text-[11px] text-zinc-400">
              By creating an account you agree to our{" "}
              <Link href={routes.terms} className="underline underline-offset-2 hover:text-zinc-600 transition-colors">
                Terms
              </Link>{" "}
              and{" "}
              <Link href={routes.privacy} className="underline underline-offset-2 hover:text-zinc-600 transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </div>

          <p className="mt-5 text-center text-[13px] text-zinc-500">
            Already have an account?{" "}
            <Link href={routes.login}
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
