import Link from "next/link";
import { Star } from "lucide-react";
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
      <nav className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        {breadcrumb.map((item) => (
          <span key={item.href} className="flex items-center gap-2">
            <Link href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
            <span>/</span>
          </span>
        ))}
        <span className="truncate text-foreground">{title}</span>
      </nav>

      <div className="space-y-2.5">
        {featured && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-caption font-semibold text-amber-700">
            Featured
          </span>
        )}
        <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-muted-foreground">
        {creatorName && (
          <span className="inline-flex items-center gap-1.5">
            <span>Created by</span>
            {creatorHref ? (
              <Link
                href={creatorHref}
                className="font-medium text-foreground transition hover:text-primary-700"
              >
                {creatorName}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{creatorName}</span>
            )}
          </span>
        )}

        {(creatorName && (hasReviews || hasSales || hasDownloads)) && (
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
        )}

        {(hasReviews || hasSales || hasDownloads) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {hasReviews && (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                <span className="font-medium text-foreground">{averageRating?.toFixed(1)}</span>
                <span>
                  {formatNumber(reviewCount)} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </span>
            )}
            {hasDownloads && (
              <span>
                {formatNumber(downloadCount)} downloads
              </span>
            )}
            {hasSales && (
              <span>
                {formatNumber(salesCount)} {salesCount === 1 ? "teacher" : "teachers"} bought this
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
