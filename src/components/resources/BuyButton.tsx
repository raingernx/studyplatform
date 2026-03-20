"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system";
import { CreditCard, QrCode, Download, Lock, BookmarkPlus, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BuyButtonProps {
  resourceId: string;
  price: number;
  isFree: boolean;
  owned: boolean;
  /** Whether the resource currently has a downloadable file attached. */
  hasFile?: boolean;
}

const buyButtonToneClassName = {
  dark:
    "bg-zinc-900 text-white hover:bg-zinc-700 active:bg-zinc-800 focus-visible:ring-zinc-700/50",
  accent:
    "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-400/50",
} as const;

export function BuyButton({
  resourceId,
  price,
  isFree,
  owned,
  hasFile = false,
}: BuyButtonProps) {
  // Local owned state allows the UI to update immediately after "Add to Library"
  // while router.refresh() re-hydrates the full page in the background.
  const [localOwned, setLocalOwned] = useState(owned);

  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingXendit, setLoadingXendit] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();

  // ── Owned state (either from server or after optimistic add-to-library) ──
  if (localOwned) {
    return (
      <div className="space-y-3">
        {hasFile ? (
          <a href={`/api/download/${resourceId}`}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className={cn("gap-2", buyButtonToneClassName.dark)}
            >
              <Download className="h-4 w-4" />
              Download
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
        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          In your library · Secure download
        </p>
      </div>
    );
  }

  // ── Free resource — not yet in library ───────────────────────────────────
  if (isFree) {
    const handleAddToLibrary = async () => {
      if (!session?.user) {
        router.push(`/auth/login?next=/resources/id/${resourceId}`);
        return;
      }
      setLoadingLibrary(true);
      setLibraryError(null);
      try {
        const res = await fetch("/api/library/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          // Optimistic update — show download button immediately
          setLocalOwned(true);
          // Then refresh server data so My Library page reflects the new record
          router.refresh();
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
          loading={loadingLibrary}
          variant="primary"
          size="lg"
          fullWidth
          className="gap-2"
        >
          <BookmarkPlus className="h-4 w-4" />
          Add to Library · Free
        </Button>

        {libraryError && (
          <p className="text-center text-[12px] text-red-600">{libraryError}</p>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="h-3 w-3" /> Free · Secure download after adding
        </p>
      </div>
    );
  }

  // ── Paid resource — show Stripe / Xendit checkout buttons ────────────────
  const handleStripe = async () => {
    if (!session?.user) {
      router.push(`/auth/login?next=/resources/id/${resourceId}`);
      return;
    }
    setLoadingStripe(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "payment", resourceId }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        alert(json.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleXendit = async () => {
    if (!session?.user) {
      router.push(`/auth/login?next=/resources/id/${resourceId}`);
      return;
    }
    setLoadingXendit(true);
    try {
      const res = await fetch("/api/checkout/xendit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        alert(json.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoadingXendit(false);
    }
  };

  const isAnyLoading = loadingStripe || loadingXendit;

  return (
    <div className="space-y-3">
      <Button
        onClick={handleStripe}
        loading={loadingStripe}
        disabled={isAnyLoading}
        variant="primary"
        size="lg"
        fullWidth
        className={cn("gap-2 shadow-md", buyButtonToneClassName.accent)}
      >
        <CreditCard className="h-4 w-4" />
        Pay with Card · {formatPrice(price)}
      </Button>
      <Button
        onClick={handleXendit}
        loading={loadingXendit}
        disabled={isAnyLoading}
        variant="outline"
        size="lg"
        fullWidth
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        Pay with Bank / QR · {formatPrice(price)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="h-3 w-3" /> Secure checkout · Card or Bank transfer
      </p>
    </div>
  );
}
