"use client";

/**
 * PendingPurchasePoller
 *
 * Rendered in the PurchaseCard slot when:
 *   - The user has just returned from a payment provider (?payment=success)
 *   - Their purchase is not yet COMPLETED in the database (webhook still in flight)
 *
 * Every POLL_INTERVAL_MS it calls router.refresh(), which re-fetches the Server
 * Component tree including hasPurchased(). Once the webhook processes and the
 * Purchase row flips to COMPLETED:
 *   - isOwned becomes true on the server
 *   - isPendingPurchase becomes false
 *   - the parent Server Component renders <PurchaseCard isOwned={true}> instead
 *   - this component unmounts, its interval clears automatically via cleanup
 *
 * After MAX_ATTEMPTS with no confirmation, polling stops and the exhausted UI
 * points the user to their library and support.
 *
 * No backend changes. No API changes. Purely a client-side polling loop.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Library } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

// ── Constants ─────────────────────────────────────────────────────────────────

// Fire the first check after 1 s — most webhooks complete well within that
// window, so the user sees the download button almost immediately.
// Subsequent checks use a 3 s interval for slower cases (high load, retries).
const FIRST_TICK_MS = 1_000;
const POLL_INTERVAL_MS = 3_000;
const DEFAULT_MAX_ATTEMPTS = 10; // 1 s + 9 × 3 s ≈ 28 s total

// ── Component ─────────────────────────────────────────────────────────────────

interface PendingPurchasePollerProps {
  /** Resource title — shown in the confirmation message. */
  resourceTitle: string;
  /** Optional refresh callback for client-owned state polling. */
  onRefresh?: () => void | Promise<void>;
  /**
   * Maximum number of refresh attempts before giving up.
   * Defaults to DEFAULT_MAX_ATTEMPTS (10).
   */
  maxAttempts?: number;
}

export function PendingPurchasePoller({
  resourceTitle,
  onRefresh,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: PendingPurchasePollerProps) {
  const router = useRouter();

  // attemptsRef drives the interval logic (avoids stale closure over state).
  const attemptsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Separate state for rendering only — updated from attemptsRef each tick.
  const [displayAttempt, setDisplayAttempt] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    // tick() is called for every check — first at 1 s, then every 3 s.
    // After the first tick it arms the 3 s interval so subsequent checks
    // use the same function without duplicating logic.
    function tick() {
      attemptsRef.current += 1;
      const current = attemptsRef.current;
      setDisplayAttempt(current);

      if (current >= maxAttempts) {
        // Stop polling — show exhausted UI.
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setExhausted(true);
        return;
      }

      // Trigger a Server Component re-fetch. If hasPurchased() now returns
      // true, the parent will swap this component out for <PurchaseCard>.
      if (onRefresh) {
        void onRefresh();
      } else {
        router.refresh();
      }

      // Arm the recurring interval only once, immediately after the first tick.
      if (current === 1) {
        intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
      }
    }

    // First check fires quickly — most webhooks land well within 1 s.
    const initialTimeout = setTimeout(tick, FIRST_TICK_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Run once on mount. router is stable; maxAttempts is a static prop.
  }, []);

  // ── Exhausted state ────────────────────────────────────────────────────────

  if (exhausted) {
    return (
      <div className="flex h-full min-h-0 flex-col justify-between rounded-2xl border border-amber-200/70 bg-card p-6 shadow-card-lg">
        <div className="space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <span className="text-2xl" aria-hidden>
              ⏱
            </span>
          </div>

          {/* Copy */}
          <div className="space-y-2 text-center">
            <p className="text-[15px] font-semibold text-foreground">
              Taking longer than expected
            </p>
            <p className="text-[13px] leading-6 text-muted-foreground">
              Your payment was received but confirmation is delayed. Your
              resource will appear in your library once it processes — usually
              within a minute.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link
              href={routes.library}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-[14px] font-semibold text-background transition hover:opacity-90"
            >
              <Library className="h-4 w-4" />
              Check My Library
            </Link>
            <p className="text-center text-[12px] text-muted-foreground">
              Still not there?{" "}
              <Link
                href={routes.support}
                className="underline underline-offset-2 transition hover:text-foreground"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Polling state ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border border-emerald-200/70 bg-card p-6 shadow-card-lg">
      <div className="space-y-6 text-center">
        {/* Spinner */}
        <div className="flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </span>
        </div>

        {/* Copy */}
        <div className="space-y-1.5">
          <p className="text-[15px] font-semibold text-foreground">
            Confirming your payment…
          </p>
          <p className="text-[13px] leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">{resourceTitle}</span>{" "}
            will be ready to download in just a moment.
          </p>
        </div>

        {/* Progress dots */}
        <div
          role="progressbar"
          aria-label={`Checking attempt ${displayAttempt + 1} of ${maxAttempts}`}
          aria-valuenow={displayAttempt}
          aria-valuemin={0}
          aria-valuemax={maxAttempts}
          className="flex items-center justify-center gap-1.5"
        >
          {Array.from({ length: maxAttempts }).map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                i < displayAttempt ? "bg-emerald-400" : "bg-border",
              ].join(" ")}
            />
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Checking — {displayAttempt + 1} of {maxAttempts}
        </p>
      </div>
    </div>
  );
}
