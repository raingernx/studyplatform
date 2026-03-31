"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";

export type CreatorResourcePreviewProps = {
  title: string;
  description: string;
  /** Price in major units (e.g. 99 = ฿99). Null treated as 0. */
  price: number | null;
  isFree: boolean;
  /** URL to display as the card thumbnail. Preview-only — not persisted by itself.
   *  Falls back gracefully to a placeholder if absent or broken. */
  thumbnailUrl?: string | null;
};

export function CreatorResourcePreview({
  title,
  description,
  price,
  isFree,
  thumbnailUrl,
}: CreatorResourcePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = !!thumbnailUrl && !imageError;
  const hasTitle = title.trim().length >= 3;
  const hasDescription = description.trim().length >= 10;

  return (
    <div className="space-y-3">
      {/* ── Card preview ───────────────────────────────────────────────────── */}
      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100">
          {showImage ? (
            <Image
              src={thumbnailUrl!}
              alt={title || "Resource preview"}
              fill
              sizes="320px"
              unoptimized={shouldBypassImageOptimizer(thumbnailUrl)}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <FileText className="h-5 w-5 text-neutral-300" aria-hidden />
              </div>
              {!thumbnailUrl && (
                <p className="max-w-[160px] text-[11px] leading-4 text-neutral-400">
                  Add a preview image to see how your card will look
                </p>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-h-[2.5rem] flex-1 text-[15px] font-semibold leading-snug tracking-[0.01em] text-neutral-900">
              {hasTitle ? (
                title
              ) : (
                <span className="text-neutral-300">Resource title...</span>
              )}
            </h3>
            <PriceBadge
              priceMinorUnits={isFree ? 0 : Math.round((price ?? 0) * 100)}
              isFree={isFree}
            />
          </div>
          {description.trim() ? (
            <p className="line-clamp-2 text-[13px] leading-5 text-zinc-500">{description}</p>
          ) : (
            <p className="text-[13px] text-neutral-300">Description will appear here...</p>
          )}
        </div>
      </article>

      {/* ── Quality hints ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {!thumbnailUrl && (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-amber-400" aria-hidden />
            A thumbnail helps your resource stand out
          </p>
        )}
        {!hasTitle && (
          <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-neutral-300" aria-hidden />
            Add a clear title to see the card preview
          </p>
        )}
        {!hasDescription && (
          <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-neutral-300" aria-hidden />
            A short description helps buyers decide
          </p>
        )}
      </div>
    </div>
  );
}
