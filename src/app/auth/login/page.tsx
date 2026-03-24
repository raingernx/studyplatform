"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/design-system";
import { Logo } from "@/components/brand/Logo";
import { AlertCircle, Loader2 } from "lucide-react";

// Google icon — inline so we don't need an extra dep
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

function sanitizeNext(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Honour ?next= so protected pages can redirect back after sign-in
  const next = sanitizeNext(searchParams.get("next"));

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push(next);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (loading || googleLoading) {
      return;
    }

    setError("");
    setGoogleLoading(true);

    try {
      await signIn("google", { callbackUrl: next });
    } catch {
      setGoogleLoading(false);
      setError("Could not start Google sign-in. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo variant="full" size="lg" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">Sign in to your account to continue</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-card">
          {/* Google OAuth */}
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => void handleGoogleSignIn()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200
                       bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-700 shadow-card
                       transition-all hover:border-zinc-300 hover:shadow-card-md active:scale-[0.99]
                       disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <GoogleIcon />}
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-medium text-zinc-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                {error}
              </div>
            )}

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
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-medium text-zinc-700">
                  Password
                </label>
                <Link href="/auth/reset-password"
                  className="text-[12px] text-blue-600 hover:text-blue-800 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900
                           placeholder-zinc-400 shadow-sm outline-none transition
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" loading={loading} disabled={googleLoading} fullWidth size="lg">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
