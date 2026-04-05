"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Download, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/design-system";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";
import { routes } from "@/lib/routes";
import type { ResourceCardResource } from "./ResourceCard";

function getDownloadedLabel(downloadedAt?: Date) {
  if (!downloadedAt) return null;
  return `Downloaded ${formatDistanceToNow(downloadedAt, { addSuffix: true })}`;
}

export function ResourceCardLibraryFooter({
  resource,
}: {
  resource: ResourceCardResource;
}) {
  const [downloadClicked, setDownloadClicked] = useState(false);
  const downloadedLabel = getDownloadedLabel(resource.downloadedAt);
  const resourceHref = resource.slug ? routes.resource(resource.slug) : routes.marketplace;

  return (
    <>
      {resource.downloadedAt && downloadedLabel ? (
        <p className="text-caption text-muted-foreground">
          {downloadedLabel}
        </p>
      ) : null}

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
          {isPreviewSupported(resource.mimeType) ? (
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
          ) : null}
          <Button asChild variant="outline" size="sm" className="h-9 flex-1 gap-1.5">
            <IntentPrefetchLink
              href={resourceHref}
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
        {downloadClicked ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-caption text-emerald-700">
            <span className="font-medium">Downloaded ✓</span>
            <span className="text-muted-foreground/40" aria-hidden>•</span>
            <Link
              href={
                resource.category?.slug
                  ? routes.category(resource.category.slug)
                  : routes.marketplace
              }
              className="text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              Want more like this?
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
