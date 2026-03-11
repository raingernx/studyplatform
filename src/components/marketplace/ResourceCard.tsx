import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ResourceCardData } from "@/components/resources/ResourceCard";

/**
 * Marketplace resource card. StudyDock card system — ResourceCard type.
 * Layout: Preview Image → Tags → Title → Description → Meta Row → CTA.
 * Padding: standard (p-5) for content.
 */
interface ResourceCardProps {
  resource: ResourceCardData;
  owned?: boolean;
}

export function ResourceCard({ resource, owned = false }: ResourceCardProps) {
  const isFree = resource.isFree || resource.price === 0;
  const priceLabel = isFree
    ? "Free"
    : owned
      ? "Owned"
      : `฿${resource.price.toLocaleString("th-TH")}`;
  const tags = resource.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const extra = tags.length - 2;
  const authorName = resource.author?.name ?? "Unknown";

  return (
    <Card className="group flex h-full flex-col overflow-hidden">
      <Link
        href={`/resources/${resource.slug}`}
        className="flex flex-1 flex-col"
        aria-label={`View ${resource.title}`}
      >
        {/* Preview Image — aspect-[4/3], rounded-t-2xl, group-hover:scale-105 */}
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-zinc-100">
          {resource.previewUrl ? (
            <img
              src={resource.previewUrl}
              alt={resource.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            /* Image fallback: FileText icon centered when no preview */
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <FileText className="h-8 w-8" aria-hidden />
            </div>
          )}
        </div>

        {/* Content: Tags, Title, Description, Meta, CTA — min-w-0 for overflow */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          {/* Tags — only 2 visible, then +N overflow indicator */}
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

          {/* Title — line-clamp-2, min-w-0 for flex */}
          <h3 className="mt-3 min-w-0 line-clamp-2 text-sm font-semibold text-zinc-900">
            {resource.title}
          </h3>

          {/* Description — line-clamp-2, min-w-0 */}
          <p className="mt-1 min-w-0 line-clamp-2 text-xs text-zinc-500">
            {resource.description}
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

          {/* CTA — full width, rounded-lg, bg-black, text-white */}
          <span className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-black py-2 text-sm font-medium text-white">
            View resource
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
