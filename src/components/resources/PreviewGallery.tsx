"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Preview {
  id: string;
  imageUrl: string;
  order: number;
}

interface Props {
  previews: Preview[];
  resourceTitle: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PreviewGallery({ previews, resourceTitle }: Props) {
  const [active, setActive] = useState(0);

  if (previews.length === 0) return null;

  const current = previews[active];
  const hasPrev = active > 0;
  const hasNext = active < previews.length - 1;

  return (
    <div className="mt-6">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
        Preview
      </p>

      {/* ── Main image ── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imageUrl}
          alt={`${resourceTitle} – preview ${active + 1} of ${previews.length}`}
          className="h-auto w-full object-contain"
          style={{ maxHeight: "480px" }}
        />

        {/* Prev / Next arrows — only shown when there are multiple images */}
        {previews.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((n) => Math.max(0, n - 1))}
              disabled={!hasPrev}
              aria-label="Previous preview"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90
                         p-1.5 shadow-md transition hover:bg-white disabled:opacity-30
                         disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-zinc-700" />
            </button>

            <button
              type="button"
              onClick={() => setActive((n) => Math.min(previews.length - 1, n + 1))}
              disabled={!hasNext}
              aria-label="Next preview"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90
                         p-1.5 shadow-md transition hover:bg-white disabled:opacity-30
                         disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-zinc-700" />
            </button>

            {/* Slide counter */}
            <span className="absolute bottom-2 right-3 rounded-full bg-black/50 px-2 py-0.5
                             text-[11px] font-medium text-white">
              {active + 1} / {previews.length}
            </span>
          </>
        )}
      </div>

      {/* ── Thumbnails (only when 2+ images) ── */}
      {previews.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {previews.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View preview ${i + 1}`}
              className={[
                "shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === active
                  ? "border-blue-500 shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-90",
              ].join(" ")}
              style={{ width: 72, height: 72 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
