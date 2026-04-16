"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/design-system";
import { Logo } from "@/components/brand/Logo";
import { routes } from "@/lib/routes";

function ResetPasswordConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const formDisabled = !isHydrated || loading;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("This reset link is invalid or incomplete.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`${routes.login}?reset=success`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo variant="full" size="lg" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            Choose a new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use at least 8 characters, 1 uppercase letter, and 1 number.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-busy={formDisabled}
            data-auth-reset-password-confirm-form-ready={isHydrated ? "true" : "false"}
          >
            {error ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-foreground">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                disabled={formDisabled}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button type="submit" disabled={!isHydrated || loading} fullWidth size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Need a fresh link?{" "}
          <Link
            href={routes.resetPassword}
            className="font-semibold text-primary transition-colors hover:text-foreground"
          >
            Request another
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense>
      <ResetPasswordConfirmForm />
    </Suspense>
  );
}
