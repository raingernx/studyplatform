"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, FileText, X, ZoomIn } from "lucide-react";
import { RevealImage } from "@/design-system";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";

const VISIBLE_THUMBNAILS = 5;

interface Preview {
  id: string;
  imageUrl: string;
  order: number;
}

interface ResourceGalleryProps {
  previews: Preview[];
  resourceTitle: string;
  fallbackImageUrl?: string | null;
}

function dedupePreviews(previews: Preview[]) {
  const seen = new Set<string>();

  return previews.filter((preview) => {
    const key = preview.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function ResourceGallery({
  previews,
  resourceTitle,
  fallbackImageUrl = null,
}: ResourceGalleryProps) {
  const [active, setActive] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const resolvedPreviews =
    previews.length > 0
      ? dedupePreviews(previews)
      : fallbackImageUrl
        ? [{ id: "fallback-preview", imageUrl: fallbackImageUrl, order: 0 }]
        : [];

  // Close lightbox on Escape
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  if (resolvedPreviews.length === 0) {
    return (
      <>
        <div className="hidden lg:order-1 lg:block lg:w-20 lg:shrink-0" aria-hidden />
        <div className="relative order-1 flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted aspect-[4/3] min-h-[420px] lg:order-2">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <FileText className="h-10 w-10" />
            <span className="text-sm font-medium">No preview images</span>
            <span className="text-xs">Check the description below to see what&apos;s included.</span>
          </div>
        </div>
      </>
    );
  }

  const activeIndex = Math.min(active, resolvedPreviews.length - 1);
  const current = resolvedPreviews[activeIndex];
  const currentIsRemotePreview = shouldBypassImageOptimizer(current.imageUrl);
  const hasThumbnailNavigation = resolvedPreviews.length > 1;
  const maxStart = Math.max(0, resolvedPreviews.length - VISIBLE_THUMBNAILS);
  const clampedStartIndex = Math.min(startIndex, maxStart);
  const visible = resolvedPreviews.slice(
    clampedStartIndex,
    clampedStartIndex + VISIBLE_THUMBNAILS,
  );
  const canGoUp = hasThumbnailNavigation && activeIndex > 0;
  const canGoDown =
    hasThumbnailNavigation && activeIndex < resolvedPreviews.length - 1;
  const total = resolvedPreviews.length;

  return (
    <>
      {/* ── Lightbox overlay ──────────────────────────────────────────────── */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${resourceTitle} – enlarged preview`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoomed(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close preview"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image — stop propagation so clicking image doesn't close */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <RevealImage
              src={current.imageUrl}
              alt={`${resourceTitle} – preview ${activeIndex + 1} of ${total}`}
              width={1400}
              height={1050}
              unoptimized={currentIsRemotePreview}
              overlayClassName="rounded-xl bg-black/20"
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            />
          </div>

          {/* Counter in lightbox */}
          {total > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-caption font-medium text-white">
              {activeIndex + 1} / {total}
            </span>
          )}
        </div>
      )}

      {/* ── Thumbnail rail ────────────────────────────────────────────────── */}
      {/* Mobile/tablet: horizontal strip (flex-row, full-width, scrollable)  */}
      {/* Desktop lg+:  vertical rail on the left (flex-col, 80px wide)       */}
      <div className="order-2 flex w-full shrink-0 flex-row items-center lg:order-1 lg:h-full lg:min-h-0 lg:w-20 lg:flex-col lg:justify-start">
        <div className="flex w-full flex-row items-center gap-2 overflow-x-auto pb-1 lg:h-full lg:min-h-0 lg:w-auto lg:flex-col lg:gap-3 lg:overflow-hidden lg:overflow-x-visible lg:pb-0">
          <button
            type="button"
            onClick={() => {
              const newActive = Math.max(0, activeIndex - 1);
              setActive(newActive);
              setStartIndex((prev) => Math.min(prev, newActive));
            }}
            disabled={!canGoUp}
            aria-label="Previous image"
            aria-disabled={!canGoUp}
            className="mb-3 hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 lg:block"
          >
            <ChevronUp className="h-5 w-5" />
          </button>

          <div className="flex flex-row gap-2 lg:min-h-0 lg:flex-col lg:items-center lg:justify-start lg:gap-3 lg:overflow-y-auto">
            {visible.map((p, idx) => {
              const globalIndex = clampedStartIndex + idx;
              const isActive = globalIndex === activeIndex;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(globalIndex)}
                  aria-label={`View preview ${globalIndex + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 lg:w-20",
                    isActive
                      ? "border-primary-500 ring-1 ring-primary-500/20"
                      : "border-border opacity-70 hover:border-muted-foreground/40 hover:opacity-100",
                  ].join(" ")}
                >
                  <RevealImage
                    src={p.imageUrl}
                    alt={`Thumbnail ${globalIndex + 1}`}
                    fill
                    sizes="(max-width: 1023px) 64px, 80px"
                    unoptimized={shouldBypassImageOptimizer(p.imageUrl)}
                    loading={globalIndex === activeIndex ? "eager" : undefined}
                    fetchPriority={globalIndex === activeIndex ? "high" : undefined}
                    overlayClassName="bg-muted"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const newActive = Math.min(
                resolvedPreviews.length - 1,
                activeIndex + 1,
              );
              setActive(newActive);
              setStartIndex((prev) =>
                Math.min(
                  maxStart,
                  Math.max(prev, newActive - VISIBLE_THUMBNAILS + 1),
                ),
              );
            }}
            disabled={!canGoDown}
            aria-label="Next image"
            aria-disabled={!canGoDown}
            className="mt-3 hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 lg:block"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Main preview ──────────────────────────────────────────────────── */}
      {/* Entire container is the click target — opens lightbox */}
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Enlarge preview"
        className="group relative order-1 w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-muted aspect-[4/3] min-h-[420px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 lg:order-2"
      >
        <RevealImage
          src={current.imageUrl}
          alt={`${resourceTitle} – preview ${activeIndex + 1} of ${total}`}
          fill
          sizes="(max-width: 1023px) calc(100vw - 2rem), 910px"
          className="h-full w-full object-contain object-top"
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized={currentIsRemotePreview}
          overlayClassName="bg-muted"
        />

        {/* Enlarge badge — visual hint only, top-right, visible on hover */}
        <span className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-[hsl(var(--card)/0.9)] p-2 text-muted-foreground opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" />
        </span>

        {/* Counter + depth label */}
        {total > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[hsl(var(--card)/0.9)] px-2.5 py-1 text-caption font-medium text-muted-foreground shadow-sm">
            {activeIndex + 1} / {total}
          </span>
        )}
      </button>
    </>
  );
}
