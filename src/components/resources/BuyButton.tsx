"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system";
import { AlertCircle, CreditCard, QrCode, Download, Lock, CheckCircle } from "lucide-react";
import { primeAuthViewer, useAuthViewer } from "@/lib/auth/use-auth-viewer";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface BuyButtonProps {
  resourceId: string;
  resourceHref: string;
  price: number;
  isFree: boolean;
  owned: boolean;
  /** Whether the resource currently has a downloadable file attached. */
  hasFile?: boolean;
}

const buyButtonToneClassName = {
  dark:
    "bg-foreground text-background hover:opacity-90 active:opacity-95 focus-visible:ring-ring/50",
  accent:
    "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-400/50",
} as const;

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
      <p className="text-[12px] leading-5 text-red-700">{message}</p>
    </div>
  );
}

export function BuyButton({
  resourceId,
  resourceHref,
  price,
  isFree,
  owned,
  hasFile = false,
}: BuyButtonProps) {
  // Local owned state — flips optimistically after a successful free claim so
  // the download button appears immediately before router.refresh() completes.
  const [localOwned, setLocalOwned] = useState(owned);

  const [justClaimed, setJustClaimed] = useState(false);
  const justClaimedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up the micro-reward timer if the component unmounts mid-animation.
  useEffect(() => {
    return () => {
      if (justClaimedTimerRef.current) clearTimeout(justClaimedTimerRef.current);
      if (downloadResetTimerRef.current) clearTimeout(downloadResetTimerRef.current);
    };
  }, []);

  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingXendit, setLoadingXendit] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [authRedirectProvider, setAuthRedirectProvider] = useState<"free" | "stripe" | "xendit" | null>(
    null,
  );
  // Flips to true just before browser navigation so button copy updates.
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Tracks whether a provider redirect has been triggered. Prevents the
  // finally block from clearing the loading spinner while the browser is
  // still mid-navigation to the checkout page.
  const redirectingRef = useRef(false);
  const downloadResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const router = useRouter();

  async function resolveAuthViewer() {
    if (authViewer.isReady) {
      return authViewer;
    }

    setIsCheckingAccount(true);
    try {
      return await primeAuthViewer();
    } finally {
      setIsCheckingAccount(false);
    }
  }

  const warmAuthViewer = () => {
    void primeAuthViewer();
  };

  function redirectToLogin(provider: "free" | "stripe" | "xendit") {
    setAuthRedirectProvider(provider);
    router.push(routes.loginWithNext(resourceHref));
  }

  function handleDownloadStart() {
    setIsPreparingDownload(true);
    if (downloadResetTimerRef.current) clearTimeout(downloadResetTimerRef.current);
    downloadResetTimerRef.current = setTimeout(() => {
      setIsPreparingDownload(false);
    }, 3000);
  }

  // ── Owned state (either from server or after optimistic free claim) ───────
  if (localOwned) {
    return (
      <div className="space-y-3">
        {hasFile ? (
          <a
            href={`/api/download/${resourceId}`}
            aria-busy={isPreparingDownload}
            onClick={handleDownloadStart}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isPreparingDownload}
              disabled={isPreparingDownload}
              className={cn("gap-2", buyButtonToneClassName.dark)}
            >
              <Download className="h-4 w-4" />
              {isPreparingDownload ? "Preparing download…" : "Download now"}
            </Button>
          </a>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled
            className={cn("gap-2", buyButtonToneClassName.dark)}
          >
            <Download className="h-4 w-4" />
            File not available yet
          </Button>
        )}
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          In your library · Secure download
        </p>
      </div>
    );
  }

  // ── Free claim micro-reward ───────────────────────────────────────────────
  if (justClaimed) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-[14px] font-semibold text-emerald-700">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        Saved to your library
      </div>
    );
  }

  // ── Free resource — not yet in library ───────────────────────────────────
  if (isFree) {
    const isRedirectingToLogin = authRedirectProvider === "free";

    const handleAddToLibrary = async () => {
      const viewer = await resolveAuthViewer();

      if (!viewer.authenticated) {
        redirectToLogin("free");
        return;
      }
      setLoadingLibrary(true);
      setAuthRedirectProvider(null);
      setLibraryError(null);
      try {
        const res = await fetch("/api/checkout/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          // Brief reward moment before settling into the owned/download state.
          setJustClaimed(true);
          justClaimedTimerRef.current = setTimeout(() => {
            setJustClaimed(false);
            setLocalOwned(true);
            router.refresh();
          }, 600);
        } else {
          setLibraryError(json.error ?? "Something went wrong. Please try again.");
        }
      } catch {
        setLibraryError("Network error. Please check your connection and try again.");
      } finally {
        setLoadingLibrary(false);
      }
    };

    return (
      <div className="space-y-3">
        <Button
          onClick={handleAddToLibrary}
          onPointerEnter={warmAuthViewer}
          onFocus={warmAuthViewer}
          loading={loadingLibrary || isRedirectingToLogin || isCheckingAccount}
          variant="primary"
          size="lg"
          fullWidth
          disabled={loadingLibrary || isRedirectingToLogin || isCheckingAccount}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isCheckingAccount
            ? "Checking account…"
            : isRedirectingToLogin
              ? "Redirecting to login…"
              : "Get for free"}
        </Button>

        {libraryError && <InlineError message={libraryError} />}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> No card needed · Yours to keep forever
        </p>
      </div>
    );
  }

  // ── Paid resource — show Stripe / Xendit checkout buttons ────────────────
  const handleStripe = async () => {
    const viewer = await resolveAuthViewer();

    if (!viewer.authenticated) {
      redirectToLogin("stripe");
      return;
    }
    setLoadingStripe(true);
    setAuthRedirectProvider(null);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "stripe", resourceId }),
      });
      const json = await res.json();
      if (json.data?.url) {
        // Fire-and-forget before navigating. keepalive ensures the request
        // survives the page navigation to the Stripe checkout page.
        void fetch("/api/analytics/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CHECKOUT_REDIRECTED",
            metadata: { resourceId, provider: "stripe", price, isFree: false },
          }),
          keepalive: true,
        });
        // Mark as redirecting so finally does not clear the spinner while
        // the browser is still navigating to the Stripe checkout page.
        setIsRedirecting(true);
        redirectingRef.current = true;
        window.location.href = json.data.url;
        return;
      }
      setCheckoutError(json.error ?? "Payment couldn't start. Try again.");
    } catch {
      setCheckoutError("Network issue. Check your connection and try again.");
    } finally {
      if (!redirectingRef.current) setLoadingStripe(false);
    }
  };

  const handleXendit = async () => {
    const viewer = await resolveAuthViewer();

    if (!viewer.authenticated) {
      redirectToLogin("xendit");
      return;
    }
    setLoadingXendit(true);
    setAuthRedirectProvider(null);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "xendit", resourceId }),
      });
      const json = await res.json();
      if (json.data?.url) {
        // Fire-and-forget before navigating. keepalive ensures the request
        // survives the page navigation to the Xendit checkout page.
        void fetch("/api/analytics/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CHECKOUT_REDIRECTED",
            metadata: { resourceId, provider: "xendit", price, isFree: false },
          }),
          keepalive: true,
        });
        // Same as Stripe — keep spinner active during navigation.
        setIsRedirecting(true);
        redirectingRef.current = true;
        window.location.href = json.data.url;
        return;
      }
      setCheckoutError(json.error ?? "Payment couldn't start. Try again.");
    } catch {
      setCheckoutError("Network issue. Check your connection and try again.");
    } finally {
      if (!redirectingRef.current) setLoadingXendit(false);
    }
  };

  const isStripeRedirectingToLogin = authRedirectProvider === "stripe";
  const isXenditRedirectingToLogin = authRedirectProvider === "xendit";
  const isStripeBusy = loadingStripe || isStripeRedirectingToLogin;
  const isXenditBusy = loadingXendit || isXenditRedirectingToLogin;
  const isAnyLoading = isStripeBusy || isXenditBusy;

  return (
    <div className="space-y-3">
      <Button
        onClick={handleStripe}
        onPointerEnter={warmAuthViewer}
        onFocus={warmAuthViewer}
        loading={isStripeBusy || isCheckingAccount}
        disabled={isAnyLoading || isCheckingAccount}
        variant="primary"
        size="lg"
        fullWidth
        className={cn("gap-2 shadow-md", buyButtonToneClassName.accent)}
      >
        <CreditCard className="h-4 w-4" />
        {isCheckingAccount
          ? "Checking account…"
          : isStripeRedirectingToLogin
            ? "Redirecting to login…"
            : isRedirecting
              ? "Taking you to checkout…"
              : `Get instant access — ${formatPrice(price)}`}
      </Button>
      <Button
        onClick={handleXendit}
        onPointerEnter={warmAuthViewer}
        onFocus={warmAuthViewer}
        loading={isXenditBusy || isCheckingAccount}
        disabled={isAnyLoading || isCheckingAccount}
        variant="outline"
        size="lg"
        fullWidth
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        {isCheckingAccount
          ? "Checking account…"
          : isXenditRedirectingToLogin
            ? "Redirecting to login…"
            : isRedirecting
              ? "Redirecting…"
              : `Pay via QR / Bank · ${formatPrice(price)}`}
      </Button>

      {checkoutError && <InlineError message={checkoutError} />}

      {isRedirecting ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Secured by Stripe · You&apos;ll return here after payment
        </p>
      ) : (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Secure checkout · Pay once, keep forever
        </p>
      )}
    </div>
  );
}
