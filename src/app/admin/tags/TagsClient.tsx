"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Hash,
  Tag,
} from "lucide-react";
import { Button, Input, RowActions, RowActionButton } from "@/design-system";
import { toSlug } from "@/lib/slug";
import { formatNumber } from "@/lib/format";

// ── API functions ─────────────────────────────────────────────────────────────

async function createTag(name: string) {
  try {
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to create tag" };
    return { error: null };
  } catch (err) {
    return { error: "An error occurred" };
  }
}

async function updateTag(id: string, name: string) {
  try {
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to update tag" };
    return { error: null };
  } catch (err) {
    return { error: "An error occurred" };
  }
}

async function deleteTag(id: string) {
  try {
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return { error: "Failed to delete tag" };
    return { error: null };
  } catch (err) {
    return { error: "An error occurred" };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TagRow {
  id: string;
  name: string;
  slug: string;
  _count: { resources: number };
}

interface Props {
  tags: TagRow[];
}

// ── Main component ────────────────────────────────────────────────────────────

export function TagsClient({ tags }: Props) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Create form state ───────────────────────────────────────────────────────
  const [createName, setCreateName]     = useState("");
  const [createError, setCreateError]   = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  // ── Inline edit state ───────────────────────────────────────────────────────
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Delete confirmation state ───────────────────────────────────────────────
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auto-focus the edit input whenever a row enters edit mode
  useEffect(() => {
    if (editId) editInputRef.current?.focus();
  }, [editId]);

  // ── Create handler ──────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreatePending(true);
    setCreateError(null);

    const result = await createTag(createName);
    setCreatePending(false);

    if (result.error) {
      setCreateError(result.error);
    } else {
      setCreateName("");
      router.refresh();
    }
  }

  // ── Edit handlers ───────────────────────────────────────────────────────────
  function startEdit(tag: TagRow) {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditError(null);
    setDeleteId(null); // close any open delete confirmation
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
    setEditError(null);
  }

  async function handleUpdate() {
    if (!editId || !editName.trim()) return;
    setEditPending(true);
    setEditError(null);

    const result = await updateTag(editId, editName);
    setEditPending(false);

    if (result.error) {
      setEditError(result.error);
    } else {
      cancelEdit();
      router.refresh();
    }
  }

  // ── Delete handlers ─────────────────────────────────────────────────────────
  function startDelete(id: string) {
    setDeleteId(id);
    setEditId(null); // close any open edit
  }

  function cancelDelete() {
    setDeleteId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeletePending(true);

    const result = await deleteTag(deleteId);
    setDeletePending(false);

    if (result.error) {
      // Shouldn't happen, but surface it
      setDeleteId(null);
    } else {
      setDeleteId(null);
      router.refresh();
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const createSlugPreview = toSlug(createName);
  const editSlugPreview   = toSlug(editName);
  const totalResources    = tags.reduce((s, t) => s + t._count.resources, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Tags"
          value={formatNumber(tags.length)}
          color="violet"
        />
        <StatCard
          label="Tagged Resources"
          value={formatNumber(totalResources)}
          color="blue"
        />
        <StatCard
          label="Unused Tags"
          value={formatNumber(tags.filter((t) => t._count.resources === 0).length)}
          color="zinc"
        />
      </div>

      {/* ── Create form ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold text-foreground">Create new tag</h2>
        </div>

        <form
          onSubmit={handleCreate}
          className="px-5 py-4"
          aria-busy={!isHydrated || createPending}
          data-admin-tags-create-form-ready={isHydrated ? "true" : "false"}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value);
                  setCreateError(null);
                }}
                placeholder="Tag name, e.g. Exam Prep"
                disabled={!isHydrated || createPending}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5
                           text-[13px] text-foreground placeholder:text-muted-foreground shadow-sm outline-none
                           transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                           disabled:opacity-50"
              />
              {/* Slug preview */}
              {createSlugPreview && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  Slug:
                  <span className="font-mono font-medium text-foreground">
                    {createSlugPreview}
                  </span>
                </p>
              )}
              {/* Error */}
              {createError && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {createError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isHydrated || !createName.trim() || createPending}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5
                         text-[13px] font-medium text-white shadow-sm transition
                         hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {createPending ? "Creating…" : "Create tag"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Tags table ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold text-foreground">
            All Tags
          </h2>
          <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]
                           font-semibold text-secondary-foreground tabular-nums">
            {tags.length}
          </span>
        </div>

        {tags.length === 0 ? (
          <EmptyTags />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Tag</th>
                  <th className="px-3 py-3 font-semibold text-muted-foreground">Slug</th>
                  <th className="px-3 py-3 text-center font-semibold text-muted-foreground">
                    Resources
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {tags.map((tag) => {
                  const isEditing   = editId === tag.id;
                  const isDeleting  = deleteId === tag.id;
                  const inUse       = tag._count.resources > 0;

                  return (
                    <tr
                      key={tag.id}
                      className={
                        isEditing || isDeleting
                          ? "bg-muted/60"
                          : "transition hover:bg-muted/40"
                      }
                    >
                      {/* ── Tag name (static or editable) ──────────────── */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div>
                            <Input
                              ref={editInputRef}
                              value={editName}
                              onChange={(e) => {
                                setEditName(e.target.value);
                                setEditError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdate();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              disabled={editPending}
                              className="w-full rounded-lg border border-violet-300 bg-background
                                         px-2.5 py-1.5 text-[13px] text-foreground outline-none
                                         ring-2 ring-violet-100 transition
                                         disabled:opacity-50"
                            />
                            {editError && (
                              <p className="mt-1 flex items-center gap-1 text-[11px]
                                            font-medium text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                {editError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{tag.name}</span>
                        )}
                      </td>

                      {/* ── Slug ───────────────────────────────────────── */}
                      <td className="px-3 py-3.5">
                        {isEditing ? (
                          <span className="flex items-center gap-1 font-mono text-[12px] text-muted-foreground">
                            <Hash className="h-3 w-3 flex-shrink-0" />
                            {editSlugPreview || (
                              <span className="italic text-muted-foreground/50">—</span>
                            )}
                          </span>
                        ) : (
                          <span className="font-mono text-[12px] text-muted-foreground">
                            {tag.slug}
                          </span>
                        )}
                      </td>

                      {/* ── Resource count ─────────────────────────────── */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5
                                      text-[11px] font-semibold tabular-nums
                                      ${inUse
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-muted text-muted-foreground"
                                      }`}
                        >
                          {tag._count.resources}
                        </span>
                      </td>

                      {/* ── Actions ────────────────────────────────────── */}
                      <td className="px-3 py-3.5 text-right">
                        {isEditing ? (
                          // ── Edit mode: Save / Cancel
                          <RowActions>
                            <RowActionButton
                              onClick={handleUpdate}
                              disabled={editPending || !editName.trim()}
                              variant="primary"
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              {editPending ? "Saving…" : "Save"}
                            </RowActionButton>
                            <RowActionButton
                              onClick={cancelEdit}
                              disabled={editPending}
                              tone="muted"
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </RowActionButton>
                          </RowActions>

                        ) : isDeleting ? (
                          // ── Delete confirmation
                          <div className="flex flex-col items-end gap-2">
                            {inUse && (
                              <p className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                Used by {tag._count.resources}{" "}
                                {tag._count.resources === 1 ? "resource" : "resources"}.
                                Deleting will remove this tag from all of them.
                              </p>
                            )}
                            <RowActions>
                              <RowActionButton
                                onClick={handleDelete}
                                disabled={deletePending}
                                variant="danger"
                                className="gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletePending ? "Deleting…" : "Confirm delete"}
                              </RowActionButton>
                              <RowActionButton
                                onClick={cancelDelete}
                                disabled={deletePending}
                                tone="muted"
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </RowActionButton>
                            </RowActions>
                          </div>

                        ) : (
                          // ── Default: Edit / Delete buttons
                          <RowActions>
                            <RowActionButton
                              onClick={() => startEdit(tag)}
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </RowActionButton>
                            <RowActionButton
                              onClick={() => startDelete(tag.id)}
                              tone="danger"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </RowActionButton>
                          </RowActions>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "violet" | "blue" | "zinc";
}) {
  const palette = {
    violet: "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-700",
    blue:   "border-blue-100   bg-gradient-to-br from-blue-50   to-white text-blue-700",
    zinc:   "border-border bg-card text-foreground",
  }[color];

  return (
    <div className={`rounded-2xl border p-5 shadow-card ${palette}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-[26px] font-bold tabular-nums leading-none tracking-tight">
        {value}
      </p>
    </div>
  );
}

function EmptyTags() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
        <Tag className="h-7 w-7 text-violet-400" />
      </span>
      <p className="mt-4 font-semibold text-foreground">No tags yet.</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Use the form above to create your first tag.
      </p>
    </div>
  );
}
