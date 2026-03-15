"use client";

import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export interface TrashResourceRow {
  id: string;
  title: string;
  slug: string;
  deletedAt: Date;
  author: {
    name: string | null;
    email: string | null;
  } | null;
}

interface AdminResourcesTrashTableProps {
  resources: TrashResourceRow[];
}

export function AdminResourcesTrashTable({
  resources: initialResources,
}: AdminResourcesTrashTableProps) {
  const [resources, setResources] = useState<TrashResourceRow[]>(initialResources);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRestore(resource: TrashResourceRow) {
    setLoadingId(resource.id);
    const res = await fetch(`/api/admin/resources/${resource.id}/trash`, {
      method: "PATCH",
    });
    setLoadingId(null);

    if (!res.ok) {
      // For now, simple alert; could be replaced with toast/notification.
      // eslint-disable-next-line no-alert
      alert("Failed to restore resource.");
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== resource.id));
  }

  async function handlePermanentDelete(resource: TrashResourceRow) {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Permanently delete "${resource.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setLoadingId(resource.id);
    const res = await fetch(`/api/admin/resources/${resource.id}/trash`, {
      method: "DELETE",
    });
    setLoadingId(null);

    if (!res.ok) {
      // eslint-disable-next-line no-alert
      alert("Failed to permanently delete resource.");
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== resource.id));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border-subtle bg-surface-50/80">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Resource
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Creator
              </th>
              <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Deleted At
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {resources.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-text-secondary"
                >
                  No resources in trash.
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="bg-white transition-colors hover:bg-surface-50"
                >
                  {/* Resource */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger-50">
                        <Trash2 className="h-4 w-4 text-danger-600" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {resource.title}
                          </p>
                          <Badge variant="destructive" className="text-[11px]">
                            In trash
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-text-muted">
                          /resources/{resource.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Creator */}
                  <td className="px-3 py-3 align-middle">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-secondary">
                        {resource.author?.name ?? "Unknown"}
                      </p>
                      {resource.author?.email && (
                        <p className="truncate text-xs text-text-muted">
                          {resource.author.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Deleted at */}
                  <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                    {formatDate(resource.deletedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loadingId === resource.id}
                        onClick={() => handleRestore(resource)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loadingId === resource.id}
                        onClick={() => handlePermanentDelete(resource)}
                        className="inline-flex items-center gap-1.5 border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

