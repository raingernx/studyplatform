import Link from "next/link";
import Image from "next/image";
import { Download, FileText, BookOpen } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatFileSize } from "@/lib/format";
import { getUserDownloadHistory } from "@/services/purchase.service";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = {
  title: "Downloads",
};

export const dynamic = "force-dynamic";

function safeFormatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  return formatFileSize(bytes);
}

export default async function DownloadsPage() {
  const { userId } = await requireSession("/dashboard/downloads");

  const downloads = await getUserDownloadHistory(userId);

  return (
    <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
              Download history
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              Files you&apos;ve actually downloaded. Re-download any owned resource from your library any time.
            </p>
          </div>
          {downloads.length > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[12px] font-semibold text-zinc-700">
                {downloads.length} download{downloads.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {downloads.length === 0 ? (
          <EmptyState
            className="bg-white py-20"
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <Download className="h-7 w-7 text-blue-400" />
              </div>
            }
            title="No downloads yet"
            description="Downloaded files will appear here after you open them from your library."
            action={
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700"
              >
                <BookOpen className="h-4 w-4" />
                Browse marketplace
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] gap-4 border-b border-zinc-100 bg-zinc-50/60 px-6 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Resource
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Creator
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Downloaded
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                File size
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Action
              </span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-zinc-50">
              {downloads.map((dl) => (
                <li key={dl.id}>
                  <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] items-center gap-4 px-6 py-4">
                    {/* Resource */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-50">
                        {dl.resource.previewUrl ? (
                          <Image
                            src={dl.resource.previewUrl}
                            alt={dl.resource.title}
                            width={36}
                            height={36}
                            sizes="36px"
                            className="h-9 w-9 rounded-xl object-cover"
                          />
                        ) : (
                          <FileText className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/resources/${dl.resource.slug}`}
                          className="block truncate text-[13px] font-medium text-zinc-900 hover:text-blue-600"
                        >
                          {dl.resource.title}
                        </Link>
                        <span className="mt-0.5 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                          {dl.resource.type}
                        </span>
                      </div>
                    </div>

                    {/* Creator */}
                    <span className="truncate text-[13px] text-zinc-500">
                      {dl.resource.author?.name ?? "—"}
                    </span>

                    {/* Date */}
                    <span className="text-[12px] text-zinc-500">
                      {formatDate(dl.createdAt)}
                    </span>

                    {/* File size */}
                    <span className="text-[12px] text-zinc-400">
                      {safeFormatFileSize(dl.resource.fileSize)}
                    </span>

                    {/* Action */}
                    <Link
                      href={`/api/download/${dl.resource.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
