import Link from "next/link";
import { Download, Star } from "lucide-react";
import { formatNumber } from "@/lib/format";

export interface ResourceHeaderBreadcrumb {
  label: string;
  href: string;
}

interface ResourceHeaderProps {
  /** Breadcrumb segments (e.g. [{ label: "Home", href: "/" }, { label: "Category", href: "/categories/..." }]). Last segment (current page) is appended from title. */
  breadcrumb: ResourceHeaderBreadcrumb[];
  title: string;
  /** Creator display name */
  creatorName: string | null;
  /** Optional creator profile URL */
  creatorHref?: string | null;
  featured?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  salesCount?: number;
  downloadCount?: number;
}

export function ResourceHeader({
  breadcrumb,
  title,
  creatorName,
  creatorHref,
  featured = false,
  averageRating = null,
  reviewCount = 0,
  salesCount = 0,
  downloadCount = 0,
}: ResourceHeaderProps) {
  const hasReviews = reviewCount > 0 && typeof averageRating === "number";
  const hasSales = salesCount > 0;
  const hasDownloads = downloadCount > 0;

  return (
    <header className="space-y-4">
      <nav className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
        {breadcrumb.map((item) => (
          <span key={item.href} className="flex items-center gap-2">
            <Link href={item.href} className="transition hover:text-zinc-600">
              {item.label}
            </Link>
            <span>/</span>
          </span>
        ))}
        <span className="truncate text-zinc-600">{title}</span>
      </nav>

      <div className="space-y-2">
        {featured && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Featured
          </span>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {title}
        </h1>
      </div>

      {creatorName && (
        <p className="text-[14px] text-zinc-500">
          Created by{" "}
          {creatorHref ? (
            <Link href={creatorHref} className="font-medium hover:text-zinc-700 underline-offset-2 hover:underline">
              {creatorName}
            </Link>
          ) : (
            <span className="font-medium text-zinc-700">{creatorName}</span>
          )}
        </p>
      )}

      {(hasReviews || hasSales || hasDownloads) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-zinc-500">
          {hasReviews && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-semibold">{averageRating?.toFixed(1)}</span>
              <span>
                from {formatNumber(reviewCount)} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </span>
          )}

          {hasSales && (
            <span className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1 text-zinc-600">
              {formatNumber(salesCount)} {salesCount === 1 ? "sale" : "sales"}
            </span>
          )}

          {hasDownloads && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1 text-zinc-600">
              <Download className="h-3.5 w-3.5" aria-hidden />
              <span>{formatNumber(downloadCount)} downloads</span>
            </span>
          )}
        </div>
      )}
    </header>
  );
}
