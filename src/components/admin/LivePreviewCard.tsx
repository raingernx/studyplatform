"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { formatPrice } from "@/lib/format";

/**
 * Admin preview card. Reuses same structure as marketplace ResourceCard
 * (preview image, tags, title, description, meta row) but without CTA.
 * Purpose: show how the resource appears in marketplace.
 */
interface LivePreviewCardProps {
  data: ResourceCardData;
}

export function LivePreviewCard({ data }: LivePreviewCardProps) {
  const tags = data.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const extra = tags.length - 2;
  const isFree = data.isFree || data.price === 0;
  const priceLabel = isFree ? "Free" : formatPrice(data.price);
  const authorName = data.author?.name ?? "You";

  return (
    <div className="w-full">
      {/* Header: LIVE PREVIEW */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-tight text-zinc-500">
        LIVE PREVIEW
      </p>

      <Card className="overflow-hidden">
        {/* Preview Image — use square-ish container for consistency */}
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-zinc-100">
          {data.previewUrl ? (
            <Image
              src={data.previewUrl}
              alt={data.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="h-full w-full object-cover"
            />
          ) : (
            /* Image fallback: FileText icon centered when no preview */
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <FileText className="h-8 w-8" aria-hidden />
            </div>
          )}
        </div>

        {/* Content: Tags, Title, Description, Meta — no CTA, min-w-0 for overflow */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          {/* Tags — 2 visible + overflow indicator */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map(({ tag }) => (
                <span
                  key={tag.id ?? tag.slug}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
                >
                  {tag.name.toLowerCase()}
                </span>
              ))}
              {extra > 0 && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  +{extra}
                </span>
              )}
            </div>
          )}

          {/* Title — line-clamp-2, min-w-0 */}
          <h3 className="mt-3 min-w-0 line-clamp-2 text-sm font-semibold text-zinc-900">
            {data.title || "Resource title"}
          </h3>

          {/* Description — line-clamp-2, min-w-0 */}
          <p className="mt-1 min-w-0 line-clamp-2 text-xs text-zinc-500">
            {data.description || "Resource description."}
          </p>

          {/* Meta Row: author left, price right */}
          <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs font-medium text-zinc-500">
              {authorName}
            </span>
            <span className="shrink-0 text-xs font-medium text-emerald-600">
              {priceLabel}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
