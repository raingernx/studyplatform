import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface LibraryResource {
  id: string;
  slug: string;
  title: string;
  authorName?: string | null;
  previewUrl?: string | null;
  downloadedAt: Date;
}

interface LibraryResourceCardProps {
  resource: LibraryResource;
  compact?: boolean;
}

export function LibraryResourceCard({ resource, compact = false }: LibraryResourceCardProps) {
  const downloadedLabel = `Downloaded ${formatDistanceToNow(resource.downloadedAt, {
    addSuffix: true,
  })}`;

  return (
    <Card
      className={cn(
        "flex rounded-xl border bg-white shadow-sm transition hover:shadow-md",
        compact ? "h-[100px] w-[292px] flex-row overflow-hidden" : "h-full flex-col",
      )}
    >
      {/* Thumbnail */}
      <Link
        href={`/resources/${resource.slug}`}
        className={compact ? "block h-[100px] w-[100px]" : "block"}
      >
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden bg-muted",
            compact ? "h-full w-[100px]" : "aspect-video rounded-t-xl",
          )}
        >
          {resource.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.previewUrl}
              alt={resource.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileText className="h-8 w-8 text-zinc-400" />
          )}
        </div>
      </Link>

      {/* Body */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "px-3 py-2" : "px-4 py-3",
        )}
      >
        <div>
          <h3 className={`line-clamp-2 font-semibold text-text-primary ${compact ? "text-xs" : "text-sm"}`}>
            {resource.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-text-secondary">
              {resource.authorName ?? "Unknown creator"}
            </p>
          )}
        </div>

        <p className={`text-[11px] text-text-secondary ${compact ? "mt-1.5" : "mt-3"}`}>
          {downloadedLabel}
        </p>

        {/* Actions */}
        <div className={`flex gap-2 ${compact ? "mt-2" : "mt-3"}`}>
          {!compact && (
            <Button asChild size="sm" className="flex-1 h-9 gap-2">
              <a href={`/api/download/${resource.id}`} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </a>
            </Button>
          )}
          <Button
            asChild
            variant={compact ? "ghost" : "outline"}
            size="sm"
            className={
              compact
                ? "h-8 gap-1 px-3 text-[11px] bg-zinc-100 hover:bg-zinc-200"
                : "flex-1 h-9 gap-2"
            }
          >
            <Link href={`/resources/${resource.slug}`} className="flex items-center gap-1">
              <ExternalLink className={compact ? "w-3 h-3" : "w-4 h-4"} />
              Open
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

