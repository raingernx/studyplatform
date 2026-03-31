import Image from "next/image";
import { Download } from "lucide-react";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";

interface Preview {
  id: string;
  imageUrl: string;
  order: number;
}

interface FilePreviewProps {
  previews: Preview[];
  resourceTitle?: string;
  /** When set, show a "Download sample" button (e.g. link to first preview image). */
  sampleDownloadUrl?: string | null;
}

export function FilePreview({
  previews,
  resourceTitle = "Resource",
  sampleDownloadUrl,
}: FilePreviewProps) {
  if (previews.length === 0) return null;

  const showDownloadButton = sampleDownloadUrl ?? previews[0]?.imageUrl;

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-zinc-900">File preview</h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        {previews.map((p, i) => (
          <div
            key={p.id}
            className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
          >
            <Image
              src={p.imageUrl}
              alt={`${resourceTitle} – preview ${i + 1} of ${previews.length}`}
              fill
              sizes="(max-width: 768px) 33vw, 200px"
              unoptimized={shouldBypassImageOptimizer(p.imageUrl)}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {showDownloadButton && (
        <div className="mt-4">
          <a
            href={showDownloadButton}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Download className="h-4 w-4" />
            Download sample
          </a>
        </div>
      )}
    </section>
  );
}
