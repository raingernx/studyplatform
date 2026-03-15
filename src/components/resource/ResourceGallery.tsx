"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, ImageIcon } from "lucide-react";

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

export function ResourceGallery({
  previews,
  resourceTitle,
  fallbackImageUrl = null,
}: ResourceGalleryProps) {
  const [active, setActive] = useState(0);
  const [startIndex, setStartIndex] = useState(0);

  const resolvedPreviews =
    previews.length > 0
      ? previews
      : fallbackImageUrl
        ? [{ id: "fallback-preview", imageUrl: fallbackImageUrl, order: 0 }]
        : [];

  if (resolvedPreviews.length === 0) {
    return (
      <>
        <div className="order-2 w-20 shrink-0 lg:order-1" aria-hidden />
        <div className="relative order-1 flex w-full min-h-0 items-center justify-center overflow-hidden rounded-xl bg-muted aspect-[4/3] max-h-[640px] lg:order-2 lg:aspect-auto lg:max-h-none lg:h-full">
          <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm font-medium">Preview coming soon</span>
          </div>
        </div>
      </>
    );
  }

  const activeIndex = Math.min(active, resolvedPreviews.length - 1);
  const current = resolvedPreviews[activeIndex];
  const hasThumbnails = resolvedPreviews.length > 1;
  const maxStart = Math.max(0, resolvedPreviews.length - VISIBLE_THUMBNAILS);
  const visible = hasThumbnails
    ? resolvedPreviews.slice(startIndex, startIndex + VISIBLE_THUMBNAILS)
    : [];
  const canGoUp = hasThumbnails && activeIndex > 0;
  const canGoDown = hasThumbnails && activeIndex < resolvedPreviews.length - 1;

  return (
    <>
      {/* Thumbnails column: order-2 on mobile, lg:order-1; full height with arrow nav */}
      <div className="order-2 flex h-full min-h-0 w-20 shrink-0 flex-col items-center justify-between lg:order-1">
        {hasThumbnails ? (
          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={() => {
                const newActive = Math.max(0, activeIndex - 1);
                setActive(newActive);
                setStartIndex((prev) => Math.min(prev, newActive));
              }}
              disabled={!canGoUp}
              aria-label="Previous image"
              className="mb-3 shrink-0 text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center justify-center gap-3">
              {visible.map((p, idx) => {
                const globalIndex = startIndex + idx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActive(globalIndex)}
                    aria-label={`View preview ${globalIndex + 1}`}
                    className={[
                      "relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition",
                      globalIndex === activeIndex
                        ? "border-zinc-900 shadow-sm"
                        : "border-zinc-200 opacity-70 hover:opacity-100",
                    ].join(" ")}
                  >
                    <Image
                      src={p.imageUrl}
                      alt={`Thumbnail ${globalIndex + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const newActive = Math.min(resolvedPreviews.length - 1, activeIndex + 1);
                setActive(newActive);
                setStartIndex((prev) =>
                  Math.min(maxStart, Math.max(prev, newActive - VISIBLE_THUMBNAILS + 1))
                );
              }}
              disabled={!canGoDown}
              aria-label="Next image"
              className="mt-3 shrink-0 text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="w-20 shrink-0" aria-hidden />
        )}
      </div>

      {/* Main preview: order-1 on mobile (top), lg:order-2; fill column height on lg, object-contain so image never crops */}
      <div className="relative order-1 w-full min-h-0 overflow-hidden rounded-xl bg-muted aspect-[4/3] max-h-[640px] lg:order-2 lg:aspect-auto lg:max-h-none lg:h-full">
        <Image
          src={current.imageUrl}
          alt={`${resourceTitle} – preview ${activeIndex + 1} of ${resolvedPreviews.length}`}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="h-full w-full object-contain"
        />
        {resolvedPreviews.length > 1 && (
          <span className="absolute bottom-2 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">
            {activeIndex + 1} / {resolvedPreviews.length}
          </span>
        )}
      </div>
    </>
  );
}
