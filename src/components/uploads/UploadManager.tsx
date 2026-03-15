"use client";

import { useUploadManager } from "@/features/uploads/useUploadManager";

export function UploadManager() {
  const { uploads } = useUploadManager();

  if (uploads.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 right-6 z-[9998] flex w-full max-w-xs flex-col gap-2 rounded-xl border border-border-subtle bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-tightest text-text-secondary">
          Uploads
        </span>
        <span className="text-[11px] text-text-muted">
          {uploads.length} file{uploads.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-medium text-text-primary">
                {upload.fileName}
              </p>
              <span className="shrink-0 text-[10px] text-text-muted">
                {upload.status === "completed"
                  ? "✓ Complete"
                  : upload.status === "failed"
                    ? "Failed"
                    : upload.status === "uploading"
                      ? "Uploading…"
                      : "Pending"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
              <div
                className={[
                  "h-full rounded-full transition-[width]",
                  upload.status === "failed"
                    ? "bg-red-500"
                    : upload.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-blue-500",
                ].join(" ")}
                style={{ width: `${Math.min(100, Math.max(0, upload.progress))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

