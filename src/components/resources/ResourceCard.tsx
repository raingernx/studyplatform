"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Download, Eye, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/design-system";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { formatPrice } from "@/lib/format";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";
import { cn } from "@/lib/utils";

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
    authorName: r.author?.name ?? r.authorName ?? null,
    description: r.description ?? "",
    tags: r.tags ?? [],
    isFree: r.isFree ?? (r.price === 0 || !r.price),
  };
}

function formatSoldCount(count?: number | null) {
  if (!count || count < 10) return null;
  if (count >= 1000) return `${Math.floor(count / 1000)}k+ sold`;
  if (count >= 100) return "100+ sold";
  return `${count} sold`;
}

function getMetaLine(authorName?: string | null, categoryName?: string | null) {
  const parts = [authorName?.trim(), categoryName?.trim()].filter(Boolean);
  if (parts.length === 0) {
    return "Study resource";
  }

  return parts.join(" • ");
}

function isNewResource(createdAt?: Date | string): boolean {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  return (Date.now() - d.getTime()) / 86_400_000 < 14;
}

/** True when a library purchase happened within the last 7 days. */
function isRecentlyPurchased(downloadedAt?: Date): boolean {
  if (!downloadedAt) return false;
  return (Date.now() - new Date(downloadedAt).getTime()) / 86_400_000 < 7;
}

function getDownloadedLabel(downloadedAt?: Date) {
  if (!downloadedAt) return null;
  return `Downloaded ${formatDistanceToNow(downloadedAt, { addSuffix: true })}`;
}

/* ── Badge ───────────────────────────────────────────────────────────────── */

function ResourceBadge({
  featured,
  isNew,
  isOwned,
}: {
  featured?: boolean;
  isNew: boolean;
  isOwned: boolean;
}) {
  const base =
    "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-caption font-medium backdrop-blur-sm";

  if (isOwned) {
    return <span className={`${base} border-primary-100 bg-primary-50/95 text-primary-700`}>Owned</span>;
  }
  if (featured) {
    return <span className={`${base} border-amber-100 bg-amber-50/95 text-amber-700`}>Featured</span>;
  }
  if (isNew) {
    return <span className={`${base} border-info-100 bg-info-50/95 text-info-700`}>New</span>;
  }
  return null;
}

/* ── Card Body ───────────────────────────────────────────────────────────── */

function CardBody({
  resource,
  variant,
  size,
  authorName,
  isOwned,
  isNavigating = false,
}: {
  resource: ResourceCardResource;
  variant: ResourceCardVariant;
  size: ResourceCardSize;
  authorName: string | null;
  isOwned: boolean;
  isNavigating?: boolean;
}) {
  const isFree = resource.isFree ?? (resource.price === 0 || !resource.price);
  const isHero = variant === "hero";
  const isMarketplace = variant === "marketplace";
  const [imageError, setImageError] = useState(false);
  const [downloadClicked, setDownloadClicked] = useState(false);
  const isNew =
    isNewResource(resource.createdAt) ||
    (variant === "library" && isRecentlyPurchased(resource.downloadedAt));
  const downloadedLabel =
    variant === "library" ? getDownloadedLabel(resource.downloadedAt) : null;
  const thumbnail =
    resource.thumbnailUrl ??
    resource.previewImages?.[0] ??
    resource.previewUrl ??
    null;
  const soldLabel = formatSoldCount(
    resource.salesCount ?? resource._count?.purchases ?? null,
  );
  const categoryName = resource.category?.name ?? null;
  const metaLine = getMetaLine(authorName, categoryName);

  const thumbImgClass =
    isMarketplace || isHero
      ? "h-full w-full object-cover"
      : "h-full w-full object-cover";

  const thumbWrapperClass =
    "relative aspect-[4/3] w-full overflow-hidden rounded-t-xl rounded-b-none bg-surface-100";

  const articleClass = cn(
    isMarketplace
      ? "relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-white transition-[transform,box-shadow,border-color,opacity] duration-150 sm:hover:border-surface-300"
      : isHero
        ? "relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-white transition-[transform,box-shadow,border-color,opacity] duration-150"
        : "relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-white transition-[transform,box-shadow,border-color,opacity] duration-150",
    isNavigating &&
      "scale-[0.985] border-primary-300 shadow-card-lg ring-2 ring-primary-200/80 ring-offset-2 ring-offset-surface-50",
  );

  const showPrice = variant !== "library";
  const priceLabel = isFree ? "Free" : formatPrice((resource.price ?? 0) / 100);

  return (
    <article className={articleClass}>
      {isNavigating ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px]" />
          <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/95 px-3 py-1.5 text-caption font-medium text-primary-700 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" aria-hidden />
              <span>Opening resource…</span>
            </div>
          </div>
        </>
      ) : null}

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
              <FileText className="h-6 w-6 text-neutral-300" aria-hidden />
            </div>
          </div>
        )}

        {variant === "library" ? (
          <ResourceBadge
            featured={resource.featured}
            isNew={isNew}
            isOwned={isOwned}
          />
        ) : null}

        {soldLabel ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {soldLabel}
          </span>
        ) : null}

        {resource.highlightBadge ? (
          <span className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/92 px-2.5 py-1 text-caption font-medium text-text-primary backdrop-blur-sm">
            {resource.highlightBadge}
          </span>
        ) : null}
      </div>

      {/* ── Body: Title + Price → Author + Category → Meta / CTAs ── */}
      <div className={cn("flex flex-1 flex-col justify-between gap-3 p-4", isHero && "p-4")}>
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="min-h-[2.75rem] line-clamp-2 text-base font-semibold leading-snug text-text-primary">
            {resource.title}
          </h3>
          <p className="line-clamp-1 min-h-[1.25rem] text-small text-text-secondary">
            {metaLine}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-surface-100 pt-3">
          {variant === "library" && resource.downloadedAt && downloadedLabel && (
            <p className="text-caption text-text-muted">
              {downloadedLabel}
            </p>
          )}

          {showPrice ? (
            <div className="flex items-end justify-between gap-3">
              <p
                className={cn(
                  "text-lg font-semibold leading-none",
                  isFree ? "text-emerald-700" : "text-text-primary",
                )}
              >
                {priceLabel}
              </p>
            </div>
          ) : null}
        </div>

        {/* Library CTAs — pinned to bottom via mt-auto; pt-4 gives consistent gap above buttons */}
        {variant === "library" && resource.id && resource.slug && (
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="h-9 flex-1 gap-1.5">
              <a
                href={`/api/download/${resource.id}`}
                onClick={() => setDownloadClicked(true)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </span>
              </a>
            </Button>
            {isPreviewSupported(resource.mimeType) && (
              <Button asChild variant="outline" size="sm" className="h-9 flex-1 gap-1.5">
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
            <Button asChild variant="outline" size="sm" className="h-9 flex-1 gap-1.5">
              <IntentPrefetchLink
                href={`/resources/${resource.slug}`}
                prefetchScope="resource-card-library"
                prefetchLimit={4}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open</span>
                </span>
              </IntentPrefetchLink>
            </Button>
            </div>
            {downloadClicked && (
              <p className="mt-2.5 flex items-center gap-1.5 text-caption text-emerald-700">
                <span className="font-medium">Downloaded ✓</span>
                <span className="text-zinc-300" aria-hidden>•</span>
                <Link
                  href={resource.category?.slug ? `/categories/${resource.category.slug}` : "/resources"}
                  className="text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
                >
                  Want more like this?
                </Link>
              </p>
            )}
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
function ResourceCardInner({
  resource,
  variant = "marketplace",
  size = "md",
  owned = false,
  previewMode = false,
}: ResourceCardProps) {
  const { authorName } = normalizeResource(resource);
  const effectiveVariant = variant === "preview" ? "compact" : variant ?? "marketplace";
  const isOwned = effectiveVariant === "library" || owned;
  const [isNavigating, setIsNavigating] = useState(false);

  function handleNavigationStart(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (resource.slug) {
      beginResourcesNavigation("detail", `/resources/${resource.slug}`);
    }
    setIsNavigating(true);
  }

  const bodyProps = {
    resource,
    variant: effectiveVariant,
    size,
    authorName,
    isOwned,
    isNavigating,
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
      <IntentPrefetchLink
        href={`/resources/${resource.slug}`}
        className={cn(
          "group block h-full w-full cursor-pointer rounded-xl",
          isNavigating && "cursor-progress",
        )}
        aria-busy={isNavigating}
        onClick={handleNavigationStart}
        prefetchMode="viewport"
        prefetchScope="resource-card-grid"
        prefetchLimit={6}
      >
        <CardBody {...bodyProps} />
      </IntentPrefetchLink>
    );
  }

  return (
    <div className="group h-full w-full">
      <CardBody {...bodyProps} />
    </div>
  );
}

export const ResourceCard = memo(ResourceCardInner);
ResourceCard.displayName = "ResourceCard";

export { ResourceCardSkeleton } from "./ResourceCardSkeleton";
