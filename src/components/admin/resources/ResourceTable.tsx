"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
  RowActions,
  RowActionButton,
  RowActionMenuTrigger,
  Select,
  useToast,
} from "@/design-system";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice, formatDate } from "@/lib/format";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { useNotifications } from "@/features/notifications/useNotifications";
import { useUndo } from "@/features/undo/useUndo";

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
    <div className="min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card">
      {hasSelection && (
        <div className="flex flex-col gap-2 border-b border-border bg-muted/80 px-4 py-2.5 text-small text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="font-medium text-muted-foreground">
            {selectedCount} resource{selectedCount === 1 ? "" : "s"} selected
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
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
      <div className="overflow-x-auto bg-card">
        <div className="min-w-[780px] bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/80">
            <tr>
              <th className="px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selectedIds.length > 0 && selectedIds.length === resources.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2.5 font-ui text-caption text-muted-foreground">
                Resource
              </th>
              <th className="px-4 py-2.5 font-ui text-caption text-muted-foreground">
                Creator
              </th>
              <th className="px-4 py-2.5 font-ui text-caption text-muted-foreground">
                Listing
              </th>
              <th className="px-4 py-2.5 font-ui text-caption text-muted-foreground">
                Performance
              </th>
              <th className="px-4 py-2.5 text-right font-ui text-caption text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                  className="bg-card transition-colors hover:bg-muted/55"
                >
                  {/* Select checkbox */}
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Select ${resource.title || "resource"}`}
                      checked={selectedIds.includes(resource.id)}
                      onChange={() => toggleRowSelection(resource.id)}
                    />
                  </td>

                  {/* Resource */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {resource.previewUrl ? (
                          <Image
                            src={resource.previewUrl}
                            alt={displayTitle}
                            fill
                            sizes="48px"
                            unoptimized={shouldBypassImageOptimizer(resource.previewUrl)}
                            className="object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {displayTitle}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                          <span className="truncate">/resources/{resource.slug}</span>
                          <span>•</span>
                          <span>{formatDate(resource.createdAt)}</span>
                          {resource.category?.name ? (
                            <>
                              <span>•</span>
                              <span>{resource.category.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Creator */}
                  <td className="px-4 py-3 align-middle">
                    <div className="min-w-0">
                      <p className="truncate text-small text-muted-foreground">
                        {resource.author?.name ?? "Unknown"}
                      </p>
                      {resource.author?.email && (
                        <p className="truncate text-caption text-muted-foreground">
                          {resource.author.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Listing */}
                  <td className="px-4 py-3 align-middle">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 font-ui text-caption text-muted-foreground">
                        {resource.isFree || resource.price === 0
                          ? "Free"
                          : formatPrice(resource.price / 100)}
                      </span>
                      <div className="flex items-center">
                        <StatusBadge status={resource.status} />
                      </div>
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-4 py-3 align-middle">
                    <div className="space-y-1 text-caption text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Downloads</span>
                        <span className="font-medium text-foreground">{resource.downloads}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Purchases</span>
                        <span className="font-medium text-foreground">{resource.purchases}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-foreground">
                          {resource.revenue > 0 ? formatPrice(resource.revenue / 100) : "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-middle text-right">
                    {confirmDeleteId === resource.id ? (
                      <div className="flex flex-col items-end gap-1.5 text-right text-caption text-danger-600">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-danger-50">
                            <Trash2 className="h-3.5 w-3.5 text-danger-600" />
                          </span>
                          <span className="font-semibold">
                            Delete this resource?
                          </span>
                        </div>
                        <RowActions>
                          <RowActionButton
                            type="button"
                            tone="muted"
                            disabled={isRowLoading}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </RowActionButton>
                          <RowActionButton
                            type="button"
                            variant="danger"
                            disabled={isRowLoading}
                            onClick={() => handleDelete(resource)}
                          >
                            Delete permanently
                          </RowActionButton>
                        </RowActions>
                      </div>
                    ) : (
                      <RowActions>
                        {isDraft && (
                          <RowActionButton
                            type="button"
                            disabled={isRowLoading}
                            onClick={() => handlePublish(resource)}
                          >
                            Publish
                          </RowActionButton>
                        )}
                        {isPublished && (
                          <RowActionButton
                            type="button"
                            tone="success"
                            className="cursor-default"
                            disabled
                          >
                            Published ✓
                          </RowActionButton>
                        )}
                        {isArchived && (
                          <RowActionButton
                            type="button"
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
                          </RowActionButton>
                        )}
                        <RowActionButton asChild>
                          <Link
                            href={routes.adminResource(resource.id)}
                            className="flex items-center gap-1"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </span>
                          </Link>
                        </RowActionButton>
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <RowActionMenuTrigger>
                              <MoreHorizontal className="h-4 w-4" />
                            </RowActionMenuTrigger>
                          </DropdownTrigger>
                          <DropdownMenu align="end">
                            <DropdownItem asChild>
                              <Link
                                href={
                                  isDraft
                                    ? routes.resourcePreview(resource.slug)
                                    : routes.resource(resource.slug)
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                Preview
                              </Link>
                            </DropdownItem>
                            <DropdownItem
                              disabled={isRowLoading}
                              onSelect={async () => {
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
                                router.push(routes.adminResource(newId));
                              }}
                            >
                              Duplicate
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem
                              destructive
                              disabled={isRowLoading}
                              onSelect={() => setConfirmDeleteId(resource.id)}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </RowActions>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      {showBulkDeleteConfirm && hasSelection && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card-lg">
            <h2 className="text-base font-semibold text-foreground">
              Delete {selectedCount} resource{selectedCount === 1 ? "" : "s"}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These resources will be permanently removed. Published resources may have downloads
              or purchases. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-muted"
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
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card-lg">
            <h2 className="text-base font-semibold text-foreground">
              Move {selectedCount} resource{selectedCount === 1 ? "" : "s"} to category
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a destination category. This will update the category for all selected
              resources.
            </p>
            <div className="mt-4">
              <Select
                value={moveCategoryId}
                onChange={(e) => setMoveCategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
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
                className="border-border text-muted-foreground hover:bg-muted"
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
                className="border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800"
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
