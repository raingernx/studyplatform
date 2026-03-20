"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Download, Eye, ExternalLink, Star, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/design-system";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { formatNumber } from "@/lib/format";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";

/* ── Types ────────────────────────────────────────────────────────────────── */

/** Full resource shape returned by the API / Prisma. */
export interface ResourceCardData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  isFree: boolean;
  price: number;
  featured?: boolean;
  createdAt?: Date | string;
  /** Thumbnail image (e.g. /uploads/…). Takes priority over previewUrl. */
  thumbnailUrl?: string | null;
  /** Preview image URLs; first used when thumbnailUrl and previewUrl are missing. */
  previewImages?: string[] | null;
  previewUrl?: string | null;
  downloadCount: number;
  author: { name?: string | null; image?: string | null };
  category?: { name: string; slug: string } | null;
  tags?: { tag: { id?: string; name: string; slug: string } }[];
  _count?: { purchases: number; reviews: number };
  rating?: number | null;
  reviewCount?: number;
  salesCount?: number;
  highlightBadge?: string | null;
  socialProofLabel?: string | null;
}

/** Card variant: marketplace (default), library, hero, or compact. Pass "preview" to render as compact (admin). */
export type ResourceCardVariant = "marketplace" | "library" | "hero" | "compact";

/** Card size: sm (compact lists), md (default), lg (hero). Reserved for future use; thumbnail uses 16:10 aspect ratio. */
export type ResourceCardSize = "sm" | "md" | "lg";

/** Minimal resource shape accepted by ResourceCard. */
export interface ResourceCardResource extends Partial<ResourceCardData> {
  id?: string;
  slug?: string;
  title: string;
  thumbnailUrl?: string | null;
  previewImages?: string[] | null;
  previewUrl?: string | null;
  author?: { name?: string | null; image?: string | null };
  authorName?: string | null;
  description?: string;
  tags?: { tag: { id?: string; name: string; slug: string } }[];
  price?: number;
  isFree?: boolean;
  featured?: boolean;
  createdAt?: Date | string;
  /** Library variant: shows "Downloaded X ago" when present. */
  downloadedAt?: Date;
  /** MIME type of the primary file — determines whether to show a Preview CTA. */
  mimeType?: string | null;
  rating?: number | null;
  reviewCount?: number;
  salesCount?: number;
  highlightBadge?: string | null;
  socialProofLabel?: string | null;
}

interface ResourceCardProps {
  resource: ResourceCardResource;
  /** marketplace (default) | library | hero | compact. "preview" is aliased to "compact". */
  variant?: ResourceCardVariant | "preview";
  /** sm | md (default) | lg. Thumbnail uses 16:10 aspect ratio; size reserved for future use. */
  size?: ResourceCardSize;
  owned?: boolean;
  /** When true, renders as a static, non-clickable preview (no marketplace link wrapping). */
  previewMode?: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function normalizeResource(r: ResourceCardResource) {
  return {
    authorName: r.author?.name ?? r.authorName ?? "Unknown",
    description: r.description ?? "",
    tags: r.tags ?? [],
    isFree: r.isFree ?? (r.price === 0 || !r.price),
  };
}

function isNewResource(createdAt?: Date | string): boolean {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  return (Date.now() - d.getTime()) / 86_400_000 < 14;
}

function getDownloadedLabel(downloadedAt?: Date) {
  if (!downloadedAt) return null;
  return `Downloaded ${formatDistanceToNow(downloadedAt, { addSuffix: true })}`;
}

/* ── Badge ───────────────────────────────────────────────────────────────── */

function ResourceBadge({
  isFree,
  featured,
  isNew,
  isOwned,
}: {
  isFree: boolean;
  featured?: boolean;
  isNew: boolean;
  isOwned: boolean;
}) {
  const base =
    "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm";

  if (isOwned) {
    return <span className={`${base} bg-violet-50 text-violet-600`}>Owned</span>;
  }
  if (featured) {
    return <span className={`${base} bg-amber-50 text-amber-600`}>Featured</span>;
  }
  if (isFree) {
    return <span className={`${base} bg-green-50 text-green-600`}>Free</span>;
  }
  if (isNew) {
    return <span className={`${base} bg-blue-50 text-blue-600`}>New</span>;
  }
  return null;
}

/* ── Card Body ───────────────────────────────────────────────────────────── */

function CardBody({
  resource,
  variant,
  size,
  authorName,
  description,
  tags: _tags,
  isOwned,
}: {
  resource: ResourceCardResource;
  variant: ResourceCardVariant;
  size: ResourceCardSize;
  authorName: string;
  description: string;
  tags: NonNullable<ResourceCardResource["tags"]>;
  isOwned: boolean;
}) {
  const isFree = resource.isFree ?? (resource.price === 0 || !resource.price);
  const isHero = variant === "hero";
  const isMarketplace = variant === "marketplace";
  const showRating = typeof resource.rating === "number" && resource.rating > 0;
  const showSalesCount = typeof resource.salesCount === "number" && resource.salesCount > 0;
  const [imageError, setImageError] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [downloadedLabel, setDownloadedLabel] = useState<string | null>(null);
  const thumbnail =
    resource.thumbnailUrl ??
    resource.previewImages?.[0] ??
    resource.previewUrl ??
    null;

  const thumbImgClass = isMarketplace
    ? "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    : "h-full w-full object-cover transition-transform duration-300";

  const thumbWrapperClass = `relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl rounded-b-none bg-gradient-to-br from-surface-100 via-surface-50 to-surface-100${
    isMarketplace ? " h-[224px] sm:h-[248px]" : ""
  }`;

  const articleClass =
    isMarketplace
      ? "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card transition-all duration-200 sm:hover:-translate-y-1 sm:hover:border-surface-300 sm:hover:shadow-card-lg"
      : isHero
        ? "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card"
        : "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card";

  const categoryName = resource.category?.name;
  const showPrice = variant !== "library";
  const socialProofLabel =
    resource.socialProofLabel ??
    (typeof resource.downloadCount === "number" && resource.downloadCount >= 100
      ? `${formatNumber(resource.downloadCount)} learners used this`
      : null);

  useEffect(() => {
    setIsNew(isNewResource(resource.createdAt));
    setDownloadedLabel(getDownloadedLabel(resource.downloadedAt));
  }, [resource.createdAt, resource.downloadedAt]);

  return (
    <article className={articleClass}>
      {/* ── Thumbnail: 4:3 ratio, overflow-hidden, rounded; thumbnailUrl → previewImages[0] → previewUrl → placeholder ── */}
      <div className={thumbWrapperClass}>
        {thumbnail && !imageError ? (
          <Image
            src={thumbnail}
            alt={resource.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className={thumbImgClass}
            onError={() => {
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
              <FileText className="h-6 w-6 text-neutral-300" aria-hidden />
            </div>
          </div>
        )}

        {/* Hover overlay: "View details →" — marketplace only; library has no overlay */}
        {isMarketplace && (
          <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-zinc-900/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur-sm">
              View details
              <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
          </div>
        )}

        {/* Badge */}
        <ResourceBadge
          isFree={isFree}
          featured={resource.featured}
          isNew={isNew}
          isOwned={isOwned}
        />

        {resource.highlightBadge ? (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
            {resource.highlightBadge}
          </span>
        ) : null}
      </div>

      {/* ── Body: Title + Price → Author + Category → Meta / CTAs ── */}
      <div className="flex flex-1 flex-col space-y-3 p-5">
        {/* Title + price badge */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[0.01em] text-neutral-900"
            >
              {resource.title}
            </h3>
            {showPrice && (
              <PriceBadge
                priceMinorUnits={Number(resource.price ?? 0)}
                isFree={isFree}
              />
            )}
          </div>
          {isMarketplace && description ? (
            <p className="line-clamp-2 text-[13px] leading-6 text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>

        {/* Author + category */}
        <p className="text-xs text-muted-foreground">
          {categoryName ? (
            <>
              by {authorName} in {categoryName}
            </>
          ) : (
            <>by {authorName}</>
          )}
        </p>

        {/* Meta (library info, rating) */}
        <div className="space-y-1.5 pt-1">
          {variant === "library" && resource.downloadedAt && downloadedLabel && (
            <p className="text-[11px] text-neutral-400">
              {downloadedLabel}
            </p>
          )}

          {(showRating || showSalesCount) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
              {showRating && (
                <span className="flex items-center gap-0.5">
                  <Star
                    className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  <span>{resource.rating?.toFixed(1)}</span>
                </span>
              )}

              {showRating && showSalesCount && <span aria-hidden>•</span>}

              {showSalesCount && (
                <span>
                  {formatNumber(resource.salesCount ?? 0)}{" "}
                  {(resource.salesCount ?? 0) === 1 ? "sale" : "sales"}
                </span>
              )}
            </div>
          )}

          {socialProofLabel ? (
            <p className="text-[11px] font-medium text-blue-600">{socialProofLabel}</p>
          ) : null}
        </div>

        {/* Library CTAs stay at the bottom */}
        {variant === "library" && resource.id && resource.slug && (
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" className="flex-1 gap-1.5">
              <a href={`/api/download/${resource.id}`}>
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </span>
              </a>
            </Button>
            {isPreviewSupported(resource.mimeType) && (
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                <a
                  href={`/api/preview/${resource.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </span>
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
              <Link href={`/resources/${resource.slug}`}>
                <span className="inline-flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open</span>
                </span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ── ResourceCard ────────────────────────────────────────────────────────── */

/**
 * Resource card. Backwards compatible: only `resource` is required.
 *
 * @example
 * // Minimal usage (variant defaults to "marketplace")
 * <ResourceCard resource={resource} />
 *
 * @example
 * // With optional props
 * <ResourceCard resource={resource} variant="library" />
 * <ResourceCard resource={resource} variant="hero" size="lg" owned={true} />
 */
export function ResourceCard({
  resource,
  variant = "marketplace",
  size = "md",
  owned = false,
  previewMode = false,
}: ResourceCardProps) {
  const { authorName, description, tags, isFree } = normalizeResource(resource);
  const effectiveVariant = variant === "preview" ? "compact" : variant ?? "marketplace";
  const isOwned = effectiveVariant === "library" || owned;

  const bodyProps = {
    resource,
    variant: effectiveVariant,
    size,
    authorName,
    description,
    tags,
    isOwned,
  };

  // Library and previewMode cards are not wrapped in a Link (they have their own CTA buttons or are static previews)
  if (effectiveVariant === "library" || previewMode) {
    return (
      <div className="group h-full w-full">
        <CardBody {...bodyProps} />
      </div>
    );
  }

  // marketplace, hero, compact: link to the resource page when slug exists
  if (resource.slug) {
    return (
      <Link
        href={`/resources/${resource.slug}`}
        className="group block h-full w-full cursor-pointer rounded-2xl"
      >
        <CardBody {...bodyProps} />
      </Link>
    );
  }

  return (
    <div className="group h-full w-full">
      <CardBody {...bodyProps} />
    </div>
  );
}

export { ResourceCardSkeleton } from "./ResourceCardSkeleton";
