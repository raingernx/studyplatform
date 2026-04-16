"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { KeyRound, Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/design-system";
import { routes } from "@/lib/routes";

type SecuritySettingsProps = {
  email?: string | null;
  signInMethodLabel?: string | null;
  canResetPassword?: boolean;
};

export function SecuritySettings({
  email = "Unavailable",
  signInMethodLabel = "Unavailable",
  canResetPassword = false,
}: SecuritySettingsProps) {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    tone: "idle" | "saved" | "error";
    message: string | null;
  }>({
    tone: "idle",
    message: null,
  });

  async function handleSendResetLink() {
    if (!canResetPassword || !email || email === "Unavailable") return;

    setIsSendingReset(true);
    setResetStatus({ tone: "idle", message: null });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || "Could not send a reset link.");
      }

      setResetStatus({
        tone: "saved",
        message: json.message || "Password reset link sent.",
      });
    } catch (error) {
      setResetStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not send a reset link.",
      });
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Security
      </p>
      <div className="space-y-2.5">
        <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Signed-in email
          </p>
          <p className="mt-2 text-small text-muted-foreground">{email}</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Sign-in method
          </p>
          <p className="mt-2 text-small text-muted-foreground">{signInMethodLabel}</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Password
              </p>
              <p className="mt-2 text-small text-muted-foreground">
                {canResetPassword
                  ? "Send a reset link to update your password."
                  : "Password changes are managed through your provider sign-in."}
              </p>
            </div>
            {canResetPassword ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={
                  isSendingReset ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )
                }
                loading={isSendingReset}
                onClick={() => {
                  void handleSendResetLink();
                }}
              >
                Send reset link
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-h-[16px]">
          {resetStatus.message ? (
            <p
              className={[
                "text-caption font-medium",
                resetStatus.tone === "error" ? "text-danger-600" : "text-muted-foreground",
              ].join(" ")}
              aria-live="polite"
            >
              {resetStatus.message}
            </p>
          ) : null}
        </div>
        <div className="ml-auto">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<LogOut className="size-4" />}
            onClick={() => {
              void signOut({ callbackUrl: routes.home });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </section>
  );
}
