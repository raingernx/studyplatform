"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button, RowActions, RowActionButton } from "@/design-system";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type VersionUser = {
  id: string;
  name: string | null;
  email: string | null;
} | null;

type VersionRow = {
  id: string;
  version: number;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  changelog: string | null;
  createdAt: Date;
  createdBy: VersionUser;
};

interface ResourceVersionsClientProps {
  resourceId: string;
  initialVersions: VersionRow[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function ResourceVersionsClient({
  resourceId,
  initialVersions,
}: ResourceVersionsClientProps) {
  const [versions, setVersions] = useState<VersionRow[]>(initialVersions);
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null);

  const latestVersionNumber = useMemo(
    () => (versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : 0),
    [versions],
  );

  async function handleDownload(versionId: string) {
    const url = `/api/admin/resources/${resourceId}/versions/${versionId}/download`;
    window.location.href = url;
  }

  async function handleRollback(versionId: string) {
    try {
      setRollbackLoadingId(versionId);
      const res = await fetch(
        `/api/admin/resources/${resourceId}/versions/${versionId}/rollback`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        console.error("Failed to rollback version");
        return;
      }

      const json = await res.json();
      const newVersion = json.data as {
        id: string;
        version: number;
        fileName: string | null;
        fileSize: number | null;
        mimeType: string | null;
        changelog: string | null;
        createdAt: string;
      };

      setVersions((prev) => [
        {
          id: newVersion.id,
          version: newVersion.version,
          fileName: newVersion.fileName,
          fileSize: newVersion.fileSize,
          mimeType: newVersion.mimeType,
          changelog: newVersion.changelog,
          createdAt: new Date(newVersion.createdAt),
          createdBy: null,
        },
        ...prev,
      ]);
    } finally {
      setRollbackLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-5 py-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          <Link href={`/admin/resources/${resourceId}`} className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to resource</span>
            </span>
          </Link>
        </Button>
        {latestVersionNumber > 0 && (
          <div className="text-xs text-text-secondary">
            Latest version:{" "}
            <span className="font-medium text-text-primary">
              v{latestVersionNumber}
            </span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-border-subtle/80 text-sm">
          <thead className="bg-surface-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
              <th className="px-5 py-3">Version</th>
              <th className="px-3 py-3">Uploaded By</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Changelog</th>
              <th className="px-3 py-3">File</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60 bg-white">
            {versions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-text-secondary"
                >
                  No versions yet. Upload a file to create the first version.
                </td>
              </tr>
            ) : (
              versions.map((v) => {
                const isCurrent = v.version === latestVersionNumber;
                const uploader =
                  v.createdBy?.name ?? v.createdBy?.email ?? "Unknown";

                return (
                  <tr key={v.id} className="align-middle">
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-text-primary">
                      <div className="inline-flex items-center gap-2">
                        <span>v{v.version}</span>
                        {isCurrent && (
                          <Badge variant="success" className="text-[11px]">
                            Current
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-primary">
                      {uploader}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {format(v.createdAt, "PPpp")}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {v.changelog ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[220px]">
                          {v.fileName ?? "—"}
                        </span>
                        {v.fileSize != null && (
                          <span className="text-[11px] text-text-muted">
                            {formatFileSize(v.fileSize)}{" "}
                            {v.mimeType &&
                              `· ${v.mimeType.split("/")[1]?.toUpperCase()}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowActions>
                        <RowActionButton
                          type="button"
                          variant="secondary"
                          onClick={() => handleDownload(v.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </RowActionButton>
                        {!isCurrent && (
                          <RowActionButton
                            type="button"
                            variant="ghost"
                            tone="muted"
                            className={cn("text-text-secondary hover:text-text-primary")}
                            loading={rollbackLoadingId === v.id}
                            onClick={() => handleRollback(v.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Rollback
                          </RowActionButton>
                        )}
                      </RowActions>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
