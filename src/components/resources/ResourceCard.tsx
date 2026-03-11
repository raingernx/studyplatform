"use client";

import Link from "next/link";
import { FileText, ArrowRight, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Shared shape for resource card across marketplace, library, and admin preview. */
export interface ResourceCardData {
  id: string;
  title: string;
  slug: string;
  description: string;
  isFree: boolean;
  price: number;
  previewUrl?: string | null;
  downloadCount: number;
  author: { name?: string | null };
  category?: { name: string; slug: string } | null;
  tags?: { tag: { id?: string; name: string; slug: string } }[];
  _count?: { purchases: number; reviews: number };
}

export type ResourceCardVariant = "marketplace" | "library" | "preview";

/** Minimal resource shape for marketplace, library, and preview. */
export interface ResourceCardResource extends Partial<ResourceCardData> {
  id?: string;
  slug?: string;
  title: string;
  previewUrl?: string | null;
  author?: { name?: string | null };
  authorName?: string | null;
  description?: string;
  tags?: { tag: { id?: string; name: string; slug: string } }[];
  price?: number;
  isFree?: boolean;
}

interface ResourceCardProps {
  resource: ResourceCardResource;
  variant: ResourceCardVariant;
  owned?: boolean;
}

function normalizeResource(resource: ResourceCardResource) {
  const authorName =
    resource.author?.name ?? resource.authorName ?? "Unknown";
  const description = resource.description ?? "";
  const tags = resource.tags ?? [];
  const isFree = resource.isFree ?? (resource.price === 0 || !resource.price);
  return { authorName, description, tags, isFree };
}

export function ResourceCard({
  resource,
  variant,
  owned = false,
}: ResourceCardProps) {
  const { authorName, description, tags, isFree } =
    normalizeResource(resource);
  const visibleTags = tags.slice(0, 2);
  const extra = tags.length - 2;

  const priceDisplay =
    variant === "library"
      ? "Owned"
      : isFree
        ? "Free"
        : owned
          ? "Owned"
          : `฿${Number(resource.price ?? 0).toLocaleString("th-TH")}`;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-[2px]">
      {/* Preview Image — aspect-[4/3], bg-neutral-100, fallback FileText */}
      <div className="aspect-[4/3] flex w-full items-center justify-center overflow-hidden rounded-t-2xl bg-neutral-100">
        {resource.previewUrl ? (
          <img
            src={resource.previewUrl}
            alt={resource.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <FileText className="h-8 w-8 text-neutral-400" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex flex-1 flex-col p-4 space-y-3">
        {/* Tags — max 2, then +N; neutral, lowercase */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleTags.map(({ tag }) => (
              <span
                key={tag.id ?? tag.slug}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
              >
                {tag.name.toLowerCase()}
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                +{extra}
              </span>
            )}
          </div>
        )}

        <h3 className="min-w-0 text-sm font-medium text-zinc-900 line-clamp-2">
          {resource.title}
        </h3>

        <p className="min-w-0 text-sm text-neutral-500 line-clamp-2">
          {description || "—"}
        </p>

        <div className="flex min-w-0 items-center justify-between gap-3 text-xs text-neutral-400">
          <span className="min-w-0 truncate font-medium">{authorName}</span>
          <span className="shrink-0 font-medium text-emerald-600">
            {priceDisplay}
          </span>
        </div>

        {/* Actions — by variant */}
        {variant === "marketplace" && resource.slug && (
          <Button
            asChild
            className="w-full"
            variant="dark"
            size="sm"
          >
            <Link href={`/resources/${resource.slug}`}>
              View resource
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
        {variant === "library" && resource.id && resource.slug && (
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 h-9 gap-2" variant="dark">
              <a href={`/api/download/${resource.id}`}>
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 h-9 gap-2">
              <Link href={`/resources/${resource.slug}`}>
                <ExternalLink className="h-4 w-4" />
                Open
              </Link>
            </Button>
          </div>
        )}
        {variant === "preview" && null}
      </div>
    </Card>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function ResourceCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <div className="aspect-[4/3] overflow-hidden rounded-t-2xl bg-neutral-100 animate-pulse" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
        <div className="h-3 w-full rounded bg-neutral-200 animate-pulse" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-24 rounded bg-neutral-200 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}