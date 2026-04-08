import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ResourceCardResource } from "@/components/resources/ResourceCard";

type PublicResourceCardProps = {
  resource: ResourceCardResource;
  imageLoading?: "lazy" | "eager";
  prefetch?: boolean;
};

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

function ResourceBadge({
  featured,
  isNew,
}: {
  featured?: boolean;
  isNew: boolean;
}) {
  const base =
    "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-caption font-medium backdrop-blur-sm";

  if (featured) {
    return <span className={`${base} border-amber-100 bg-amber-50/95 text-amber-700`}>Featured</span>;
  }
  if (isNew) {
    return <span className={`${base} border-info-100 bg-info-50/95 text-info-700`}>New</span>;
  }
  return null;
}

export function PublicResourceCard({
  resource,
  imageLoading,
  prefetch = false,
}: PublicResourceCardProps) {
  const thumbnail =
    resource.thumbnailUrl ??
    resource.previewImages?.[0] ??
    resource.previewUrl ??
    null;
  const categoryName = resource.category?.name ?? null;
  const authorName = resource.author?.name ?? resource.authorName ?? null;
  const metaLine = getMetaLine(authorName, categoryName);
  const isFree = resource.isFree ?? (resource.price === 0 || !resource.price);
  const priceLabel = isFree ? "Free" : formatPrice((resource.price ?? 0) / 100);
  const isNew = isNewResource(resource.createdAt);
  const soldLabel = formatSoldCount(
    resource.salesCount ?? resource._count?.purchases ?? null,
  );
  const bypassImageOptimizer = shouldBypassImageOptimizer(thumbnail);

  const card = (
    <article className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-card transition-[transform,box-shadow,border-color] duration-150 sm:hover:border-border">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl rounded-b-none bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={resource.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            unoptimized={bypassImageOptimizer}
            loading={imageLoading}
            fetchPriority={imageLoading === "eager" ? "high" : undefined}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--card)/0.8)]">
              <FileText className="h-6 w-6 text-muted-foreground/50" aria-hidden />
            </div>
          </div>
        )}

        <ResourceBadge featured={resource.featured} isNew={isNew} />

        {soldLabel ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {soldLabel}
          </span>
        ) : null}

        {resource.highlightBadge ? (
          <span className="absolute right-3 top-3 rounded-full border border-border-strong/80 bg-[hsl(var(--card)/0.92)] px-2.5 py-1 text-caption font-medium text-foreground backdrop-blur-sm">
            {resource.highlightBadge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="min-h-[2.75rem] line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {resource.title}
          </h3>
          <p className="line-clamp-1 min-h-[1.25rem] text-small text-muted-foreground">
            {metaLine}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-border-subtle pt-3">
          <div className="flex items-end justify-between gap-3">
            <p
              className={cn(
                "text-lg font-semibold leading-none",
                isFree ? "text-emerald-700" : "text-foreground",
              )}
            >
              {priceLabel}
            </p>
          </div>
        </div>
      </div>
    </article>
  );

  if (!resource.slug) {
    return <div className="group h-full w-full">{card}</div>;
  }

  return (
    <Link
      href={routes.resource(resource.slug)}
      prefetch={prefetch}
      className="group block h-full w-full cursor-pointer rounded-xl"
    >
      {card}
    </Link>
  );
}
