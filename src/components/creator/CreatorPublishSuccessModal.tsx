"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Check, ArrowRight, Plus, X } from "lucide-react";
import { CreatorResourcePreview } from "@/components/creator/CreatorResourcePreview";
import { routes } from "@/lib/routes";

// ── Types ──────────────────────────────────────────────────────────────────────

type CreatorPublishSuccessModalProps = {
  open: boolean;
  onClose: () => void;
  /** Slug returned by the API after publish — used for "View live page" and "Copy link". */
  resourceSlug?: string;
  /** Card preview data — taken from the form state at publish time. */
  title?: string;
  description?: string;
  /** Price in major units (e.g. 99 = ฿99). */
  price?: number;
  isFree?: boolean;
  thumbnailUrl?: string | null;
};

// ── Component ──────────────────────────────────────────────────────────────────

export function CreatorPublishSuccessModal({
  open,
  onClose,
  resourceSlug,
  title = "",
  description = "",
  price = 0,
  isFree = false,
  thumbnailUrl,
}: CreatorPublishSuccessModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const prevOverflow = useRef<string>("");

  // Body scroll lock — saves the previous value and restores it on cleanup
  useEffect(() => {
    if (!open) return;
    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow.current;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const liveHref = resourceSlug ? routes.resource(resourceSlug) : null;
  const liveUrl = resourceSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${routes.resource(resourceSlug)}`
    : null;

  function handleViewLive() {
    if (liveHref) router.push(liveHref);
    else onClose();
  }

  function handleCopyLink() {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCreateAnother() {
    router.push(routes.creatorNewResource);
  }

  return (
    /* Backdrop — click outside to close */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Resource published"
    >
      {/* Modal panel */}
      <div
        className="relative mx-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-8 pt-8 sm:px-8">
          {/* ── Success indicator ──────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
              Your resource is live 🎉
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              It&apos;s now visible in the marketplace.
            </p>
          </div>

          {/* ── Card preview ───────────────────────────────────────────── */}
          <div className="mt-6">
            <CreatorResourcePreview
              title={title}
              description={description}
              price={price}
              isFree={isFree}
              thumbnailUrl={thumbnailUrl}
            />
          </div>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div className="mt-6 space-y-3">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={handleViewLive}
              disabled={!liveHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              View live page
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Secondary CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!liveUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCreateAnother}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Create another
              </button>
            </div>
          </div>

          {/* ── Helper text ────────────────────────────────────────────── */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            You can edit anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
