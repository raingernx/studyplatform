"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FileText, Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice, formatDate } from "@/lib/format";
import { useNotifications } from "@/features/notifications/useNotifications";
import { useUndo } from "@/features/undo/useUndo";
import { useToast } from "@/hooks/use-toast";

export interface AdminResourceRow {
  id: string;
  title: string;
  slug: string;
  previewUrl: string | null;
  isFree: boolean;
  price: number;
  status: string;
  createdAt: Date;
  author: {
    name: string | null;
    email: string | null;
  } | null;
  category: {
    name: string;
  } | null;
  downloads: number;
  purchases: number;
  revenue: number;
}

interface ResourceTableProps {
  resources: AdminResourceRow[];
  categories?: { id: string; name: string }[];
}

export function ResourceTable({ resources: initialResources, categories }: ResourceTableProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const { toast } = useToast();
  const { scheduleUndo } = useUndo();
  const [resources, setResources] = useState<AdminResourceRow[]>(initialResources);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<false | "publish" | "archive" | "delete" | "draft" | "moveToCategory">(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showMoveCategoryModal, setShowMoveCategoryModal] = useState(false);
  const [moveCategoryId, setMoveCategoryId] = useState<string>("");

  // When the server-provided resources change (e.g. filters cleared),
  // sync local state to match the new data set.
  useEffect(() => {
    setResources(initialResources);
    setSelectedIds([]);
  }, [initialResources]);


  const hasSelection = selectedIds.length > 0;
  const selectedCount = selectedIds.length;
  const selectedResources = resources.filter((r) => selectedIds.includes(r.id));
  const bulkDraftCount = selectedResources.filter(
    (r) => r.status === "DRAFT" || r.status === "draft",
  ).length;
  const bulkNonDraftCount = selectedResources.filter(
    (r) => r.status !== "DRAFT" && r.status !== "draft",
  ).length;

  function toggleRowSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === resources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resources.map((r) => r.id));
    }
  }

  function handleDelete(resource: AdminResourceRow) {
    // Optimistically remove from table, but defer actual delete with undo window.
    setResources((prev) => prev.filter((r) => r.id !== resource.id));
    setSelectedIds((prev) => prev.filter((id) => id !== resource.id));
    setConfirmDeleteId((prev) => (prev === resource.id ? null : prev));

    scheduleUndo({
      label: "Resource deleted",
      timeoutMs: 5000,
      perform: async () => {
        const res = await fetch(`/api/admin/resources/${resource.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          notify(
            "error",
            "Failed to delete resource",
            "The resource has been restored in the table.",
          );
          // Restore row if delete failed.
          setResources((prev) => [resource, ...prev]);
        }
      },
      onUndo: () => {
        // Re-insert the resource into the table when undoing.
        setResources((prev) => [resource, ...prev]);
      },
    });
  }

  async function handlePublish(resource: AdminResourceRow) {
    const isAlreadyPublished =
      resource.status === "PUBLISHED" || resource.status === "published";
    if (isAlreadyPublished) {
      notify("info", "Resource already published");
      return;
    }

    setRowLoadingId(resource.id);
    const res = await fetch(`/api/admin/resources/${resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    setRowLoadingId(null);

    if (!res.ok) {
      window.alert("Failed to publish resource");
      return;
    }

    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id ? { ...r, status: "PUBLISHED" } : r,
      ),
    );
    notify("success", "Resource published");
    router.refresh();
  }

  async function runBulkAction(action: "publish" | "archive" | "delete" | "draft") {
    if (!selectedIds.length) return;

    const selectedResources = resources.filter((r) =>
      selectedIds.includes(r.id),
    );
    const draftResources = selectedResources.filter(
      (r) => r.status === "DRAFT" || r.status === "draft",
    );
    const publishedResources = selectedResources.filter(
      (r) => r.status === "PUBLISHED" || r.status === "published",
    );

    let message = "";
    if (action === "delete") {
      // Confirmation is handled via the custom bulk delete dialog.
      // Skip message/confirm here.
    } else if (action === "publish") {
      if (draftResources.length === 0) {
        toast.info("All selected resources are already published");
        return;
      }
      message = `Publish ${draftResources.length} resource${
        draftResources.length === 1 ? "" : "s"
      }?`;
    } else if (action === "archive") {
      message = `Archive ${selectedIds.length} resources?`;
    } else if (action === "draft") {
      if (bulkNonDraftCount === 0) {
        toast.info("All selected resources are already drafts");
        return;
      }
      message = `Move ${bulkNonDraftCount} resource${
        bulkNonDraftCount === 1 ? "" : "s"
      } to draft?`;
    }

    setBulkLoading(action);
    const res = await fetch("/api/admin/resources/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids:
          action === "publish"
            ? draftResources.map((r) => r.id)
            : action === "draft"
              ? selectedResources
                  .filter((r) => r.status !== "DRAFT" && r.status !== "draft")
                  .map((r) => r.id)
              : selectedIds,
        action,
      }),
    });
    setBulkLoading(false);

    if (!res.ok) {
      window.alert("Bulk action failed");
      return;
    }

    if (action === "delete") {
      setResources((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      return;
    }

    const nextStatus =
      action === "publish"
        ? "PUBLISHED"
        : action === "archive"
          ? "ARCHIVED"
          : "DRAFT";
    setResources((prev) =>
      prev.map((r) =>
        action === "publish"
          ? draftResources.some((d) => d.id === r.id)
            ? { ...r, status: nextStatus }
            : r
          : action === "draft"
            ? selectedResources.some((s) => s.id === r.id && s.status !== "DRAFT" && s.status !== "draft")
              ? { ...r, status: nextStatus }
              : r
            : selectedIds.includes(r.id)
              ? { ...r, status: nextStatus }
              : r,
      ),
    );

    if (action === "publish") {
      const publishedCount = draftResources.length;
      const alreadyPublishedCount = publishedResources.length;
      if (alreadyPublishedCount > 0) {
        notify(
          "success",
          `${publishedCount} resource${
            publishedCount === 1 ? "" : "s"
          } published • ${alreadyPublishedCount} already published`,
        );
      } else {
        notify(
          "success",
          `${publishedCount} resource${
            publishedCount === 1 ? "" : "s"
          } published`,
        );
      }
    }

    if (action === "draft") {
      notify("success", "Resource moved to draft");
    }

    setSelectedIds([]);
  }

  async function handleBulkMoveToCategory() {
    if (!selectedIds.length || !moveCategoryId) return;

    setBulkLoading("moveToCategory");
    const res = await fetch("/api/admin/resources/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedIds,
        action: "moveToCategory",
        categoryId: moveCategoryId,
      }),
    });
    setBulkLoading(false);

    if (!res.ok) {
      toast.error("Failed to move resources to the selected category");
      return;
    }

    const categoryName =
      categories?.find((c) => c.id === moveCategoryId)?.name ?? "Updated category";

    setResources((prev) =>
      prev.map((r) =>
        selectedIds.includes(r.id)
          ? {
              ...r,
              category: { name: categoryName },
            }
          : r,
      ),
    );

    toast.success(
      `Moved ${selectedIds.length} resource${selectedIds.length === 1 ? "" : "s"} to ${categoryName}`,
    );

    setSelectedIds([]);
    setShowMoveCategoryModal(false);
    setMoveCategoryId("");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
      {hasSelection && (
        <div className="flex flex-col gap-1 border-b border-border-subtle bg-surface-50 px-4 py-2 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <div className="font-medium text-text-secondary">
            {selectedCount} resource{selectedCount === 1 ? "" : "s"} selected
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={!!bulkLoading || bulkDraftCount === 0}
              className={
                bulkDraftCount === 0
                  ? "cursor-not-allowed opacity-50"
                  : undefined
              }
              title={
                bulkDraftCount === 0
                  ? "All selected resources are already published"
                  : undefined
              }
              onClick={() => runBulkAction("publish")}
            >
              Publish{bulkDraftCount > 0 ? ` (${bulkDraftCount})` : " (0)"}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={!!bulkLoading || bulkNonDraftCount === 0}
              className={
                bulkNonDraftCount === 0
                  ? "cursor-not-allowed opacity-50"
                  : undefined
              }
              title={
                bulkNonDraftCount === 0
                  ? "All selected resources are already drafts"
                  : undefined
              }
              onClick={() => runBulkAction("draft")}
            >
              Move to Draft
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={!!bulkLoading}
              onClick={() => runBulkAction("archive")}
            >
              Archive
            </Button>
            {categories && categories.length > 0 && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={!!bulkLoading}
                onClick={() => setShowMoveCategoryModal(true)}
              >
                Move to Category
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
              disabled={!!bulkLoading}
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              Delete ({selectedCount})
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-border-subtle bg-surface-50/80">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selectedIds.length > 0 && selectedIds.length === resources.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Resource
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Creator
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Category
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Price
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Status
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Downloads
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Purchases
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Revenue
              </th>
              <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Created
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {resources.map((resource) => {
              const isDraft =
                resource.status === "DRAFT" || resource.status === "draft";
              const isPublished =
                resource.status === "PUBLISHED" || resource.status === "published";
              const isArchived =
                resource.status === "ARCHIVED" || resource.status === "archived";

              const displayTitle =
                isDraft && !resource.title.trim()
                  ? "Untitled draft"
                  : resource.title;

              const isRowLoading = rowLoadingId === resource.id;

              return (
                <tr
                  key={resource.id}
                  className="bg-white transition-colors hover:bg-surface-50"
                >
                  {/* Select checkbox */}
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Select ${resource.title || "resource"}`}
                      checked={selectedIds.includes(resource.id)}
                      onChange={() => toggleRowSelection(resource.id)}
                    />
                  </td>

                  {/* Resource */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-surface-100">
                        {resource.previewUrl ? (
                          <Image
                            src={resource.previewUrl}
                            alt={displayTitle}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {displayTitle}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          /resources/{resource.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Creator */}
                  <td className="px-2 py-3 align-middle">
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

                  {/* Category */}
                  <td className="px-2 py-3 align-middle text-sm text-text-secondary">
                    {resource.category?.name ?? "—"}
                  </td>

                  {/* Price */}
                  <td className="px-2 py-3 align-middle">
                  <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {resource.isFree || resource.price === 0
                      ? "Free"
                      : formatPrice(resource.price / 100)}
                  </span>
                  </td>

                  {/* Status */}
                  <td className="px-2 py-3 align-middle">
                    <StatusBadge status={resource.status} />
                  </td>

                  {/* Downloads */}
                  <td className="px-2 py-3 align-middle text-sm text-text-secondary">
                    {resource.downloads}
                  </td>

                  {/* Purchases */}
                  <td className="px-2 py-3 align-middle text-sm text-text-secondary">
                    {resource.purchases}
                  </td>

                  {/* Revenue */}
                  <td className="px-2 py-3 align-middle text-sm text-text-secondary">
                    {resource.revenue > 0 ? formatPrice(resource.revenue / 100) : "—"}
                  </td>

                  {/* Created */}
                  <td className="px-2 py-3 align-middle text-sm text-text-secondary">
                    {formatDate(resource.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 align-middle text-right">
                    {confirmDeleteId === resource.id ? (
                      <div className="flex flex-col items-end gap-2 text-right text-xs text-danger-600">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-danger-50">
                            <Trash2 className="h-3.5 w-3.5 text-danger-600" />
                          </span>
                          <span className="font-semibold">
                            Delete this resource?
                          </span>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-border-subtle text-text-secondary hover:bg-surface-50"
                            disabled={isRowLoading}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-danger-200 bg-danger-600 text-white hover:bg-danger-700 hover:text-white"
                            disabled={isRowLoading}
                            onClick={() => handleDelete(resource)}
                          >
                            Delete permanently
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {isDraft && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isRowLoading}
                            onClick={() => handlePublish(resource)}
                          >
                            Publish
                          </Button>
                        )}
                        {isPublished && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-default"
                            disabled
                          >
                            Published ✓
                          </Button>
                        )}
                        {isArchived && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isRowLoading}
                            onClick={async () => {
                              setRowLoadingId(resource.id);
                              const res = await fetch(
                                `/api/admin/resources/${resource.id}`,
                                {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "PUBLISHED" }),
                                },
                              );
                              setRowLoadingId(null);
                              if (!res.ok) {
                                window.alert("Failed to restore resource");
                                return;
                              }
                              setResources((prev) =>
                                prev.map((r) =>
                                  r.id === resource.id
                                    ? { ...r, status: "PUBLISHED" }
                                    : r,
                                ),
                              );
                              notify("success", "Resource restored");
                            }}
                          >
                            Restore
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={
                              isDraft
                                ? `/resources/${resource.slug}?preview=true`
                                : `/resources/${resource.slug}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isRowLoading}
                          onClick={async () => {
                            setRowLoadingId(resource.id);
                            const res = await fetch(
                              `/api/admin/resources/${resource.id}/duplicate`,
                              { method: "POST" },
                            );
                            setRowLoadingId(null);
                            if (!res.ok) {
                              window.alert("Failed to duplicate resource");
                              return;
                            }
                            const json = (await res.json()) as {
                              data?: { id?: string };
                            };
                            const newId = json.data?.id;
                            if (!newId) {
                              window.alert("Failed to duplicate resource");
                              return;
                            }
                            notify("success", "Resource duplicated");
                            router.push(`/admin/resources/${newId}`);
                          }}
                        >
                          Duplicate
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/resources/${resource.id}`}
                            className="flex items-center gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={[
                            "text-danger-600 hover:bg-danger-50 hover:text-danger-700",
                            isPublished ? "border-danger-200" : "border-border-subtle",
                          ].join(" ")}
                          disabled={isRowLoading}
                          onClick={() => setConfirmDeleteId(resource.id)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showBulkDeleteConfirm && hasSelection && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border-subtle bg-white p-6 shadow-card-lg">
            <h2 className="text-base font-semibold text-text-primary">
              Delete {selectedCount} resource{selectedCount === 1 ? "" : "s"}?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              These resources will be permanently removed. Published resources may have downloads
              or purchases. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border-subtle text-text-secondary hover:bg-surface-50"
                disabled={!!bulkLoading}
                onClick={() => setShowBulkDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                disabled={!!bulkLoading}
                onClick={async () => {
                  setShowBulkDeleteConfirm(false);
                  await runBulkAction("delete");
                }}
              >
                Delete {selectedCount} resource{selectedCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showMoveCategoryModal && hasSelection && categories && categories.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border-subtle bg-white p-6 shadow-card-lg">
            <h2 className="text-base font-semibold text-text-primary">
              Move {selectedCount} resource{selectedCount === 1 ? "" : "s"} to category
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Choose a destination category. This will update the category for all selected
              resources.
            </p>
            <div className="mt-4">
              <Select
                value={moveCategoryId}
                onChange={(e) => setMoveCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Select a category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border-subtle text-text-secondary hover:bg-surface-50"
                disabled={bulkLoading === "moveToCategory"}
                onClick={() => {
                  setShowMoveCategoryModal(false);
                  setMoveCategoryId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-brand-200 text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                disabled={bulkLoading === "moveToCategory" || !moveCategoryId}
                onClick={handleBulkMoveToCategory}
              >
                {bulkLoading === "moveToCategory" ? "Moving…" : "Move"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

