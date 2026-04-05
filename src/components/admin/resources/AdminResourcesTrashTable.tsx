"use client";

import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";

import { RowActions, RowActionButton } from "@/design-system";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
} from "@/components/admin/table";

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
      alert("Failed to restore resource.");
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== resource.id));
  }

  async function handlePermanentDelete(resource: TrashResourceRow) {
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
      alert("Failed to permanently delete resource.");
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== resource.id));
  }

  return (
    <DataTable minWidth="min-w-[720px]">
      <DataTableHeader>
        <tr>
          <DataTableHeadCell>
                Resource
          </DataTableHeadCell>
          <DataTableHeadCell className="px-3">
                Creator
          </DataTableHeadCell>
          <DataTableHeadCell className="px-3">
                Deleted At
          </DataTableHeadCell>
          <DataTableHeadCell align="right">
                Actions
          </DataTableHeadCell>
        </tr>
      </DataTableHeader>
      <DataTableBody>
        {resources.length === 0 ? (
          <TableEmptyState message="No resources in trash" />
        ) : (
          resources.map((resource) => (
            <DataTableRow key={resource.id}>
                  {/* Resource */}
                  <DataTableCell>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger-50">
                        <Trash2 className="h-4 w-4 text-danger-600" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {resource.title}
                          </p>
                          <StatusBadge status="trash" label="In trash" tone="danger" />
                        </div>
                        <p className="truncate text-caption text-muted-foreground">
                          /resources/{resource.slug}
                        </p>
                      </div>
                    </div>
                  </DataTableCell>

                  {/* Creator */}
                  <DataTableCell className="px-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-muted-foreground">
                        {resource.author?.name ?? "Unknown"}
                      </p>
                      {resource.author?.email && (
                        <p className="truncate text-caption text-muted-foreground">
                          {resource.author.email}
                        </p>
                      )}
                    </div>
                  </DataTableCell>

                  {/* Deleted at */}
                  <DataTableCell className="px-3 text-muted-foreground">
                    {formatDate(resource.deletedAt)}
                  </DataTableCell>

                  {/* Actions */}
                  <DataTableCell align="right">
                    <RowActions>
                      <RowActionButton
                        type="button"
                        disabled={loadingId === resource.id}
                        onClick={() => handleRestore(resource)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </RowActionButton>
                      <RowActionButton
                        type="button"
                        tone="danger"
                        disabled={loadingId === resource.id}
                        onClick={() => handlePermanentDelete(resource)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </RowActionButton>
                    </RowActions>
                  </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}
