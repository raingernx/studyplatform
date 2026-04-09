import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, FileText, BookOpen } from "lucide-react";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatFileSize } from "@/lib/format";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { getUserDownloadHistory } from "@/services/purchases";
import { EmptyState } from "@/design-system";
import { DashboardDownloadsResultsSkeleton } from "@/components/skeletons/DashboardUserRouteSkeletons";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export const metadata = {
  title: "Downloads",
};

export const dynamic = "force-dynamic";

function safeFormatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  return formatFileSize(bytes);
}

async function DownloadsResultsSection({
  downloadsPromise,
}: {
  downloadsPromise: ReturnType<typeof getUserDownloadHistory>;
}) {
  const downloads = await downloadsPromise;

  if (downloads.length === 0) {
    return (
      <EmptyState
        className="bg-card py-20"
        icon={
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Download className="h-7 w-7 text-muted-foreground" />
          </div>
        }
        title="No downloads yet"
        description="Downloaded files will appear here after you open them from your library."
        action={
          <Link
            href={routes.marketplace}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition hover:bg-foreground/90"
          >
            <BookOpen className="h-4 w-4" />
            Browse marketplace
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <Download className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[12px] font-semibold text-foreground">
          {downloads.length} download{downloads.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] gap-4 border-b border-border bg-muted/70 px-6 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resource
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Creator
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Downloaded
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            File size
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Action
          </span>
        </div>

        <ul className="divide-y divide-border">
          {downloads.map((dl) => (
            <li key={dl.id}>
              <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] items-center gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                    {dl.resource.previewUrl ? (
                      <Image
                        src={dl.resource.previewUrl}
                        alt={dl.resource.title}
                        fill
                        sizes="36px"
                        unoptimized={shouldBypassImageOptimizer(
                          dl.resource.previewUrl,
                        )}
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <ResourceIntentLink
                      href={routes.resource(dl.resource.slug)}
                      className="block truncate text-[13px] font-medium text-foreground hover:text-primary-700"
                    >
                      {dl.resource.title}
                    </ResourceIntentLink>
                    <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {dl.resource.type}
                    </span>
                  </div>
                </div>

                <span className="truncate text-[13px] text-muted-foreground">
                  {dl.resource.author?.name ?? "—"}
                </span>

                <span className="text-[12px] text-muted-foreground">
                  {formatDate(dl.createdAt)}
                </span>

                <span className="text-[12px] text-muted-foreground">
                  {safeFormatFileSize(dl.resource.fileSize)}
                </span>

                <Link
                  href={`/api/download/${dl.resource.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default async function DownloadsPage() {
  const { userId } = await requireSession(routes.downloads);
  const downloadsPromise = getUserDownloadHistory(userId);

  return (
    <div data-route-shell-ready="dashboard-downloads" className="min-w-0 space-y-8">
      <DashboardPageHeader
        title="Download history"
        description="Files you've actually downloaded. Re-download any owned resource from your library any time."
      />

      <Suspense fallback={<DashboardDownloadsResultsSkeleton />}>
        <DownloadsResultsSection downloadsPromise={downloadsPromise} />
      </Suspense>
    </div>
  );
}
