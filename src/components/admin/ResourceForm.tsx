"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  Link as LinkIcon,
  Trash2,
  AlertTriangle,
  Search,
  X,
  ImagePlus,
  GripVertical,
} from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { FileUploadWidget } from "@/components/admin/FileUploadWidget";
import { FormSection } from "@/components/admin/FormSection";
import type { ResourceCardData } from "@/components/resources/ResourceCard";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResourceFormCategory {
  id: string;
  name: string;
}

export interface ResourceFormTag {
  id: string;
  name: string;
  slug: string;
}

export interface ResourceFormResource {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
}

export interface ResourcePayload {
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
  tagIds: string[];
  previewUrls: string[];
}

interface FormState {
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: string;
  fileUrl: string;
  categoryId: string;
  featured: boolean;
}

export interface ResourceFormProps {
  mode: "create" | "edit";
  id?: string;
  resource?: ResourceFormResource;
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
  initialTagIds?: string[];
  initialPreviewUrls?: string[];
  initialFileName?: string | null;
  initialFileSize?: number | null;
  onSubmit: (data: ResourcePayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Called when form state changes so the parent can render a live preview (e.g. create page sidebar). */
  onPreviewDataChange?: (data: ResourceCardData) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function centsToDollars(cents: number): string {
  if (cents === 0) return "";
  return (cents / 100).toFixed(2);
}

function slugifyPreview(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sample-resource";
}

// ── Label ────────────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  icon,
  children,
}: {
  htmlFor: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-zinc-500"
    >
      {icon}
      {children}
    </label>
  );
}

// ── TagSelector ───────────────────────────────────────────────────────────────

function TagSelector({
  tags,
  selectedIds,
  onChange,
}: {
  tags: ResourceFormTag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? tags.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : tags;

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="w-full min-w-0">
      <Label htmlFor="tag-search" icon={<Tag className="h-3.5 w-3.5" />}>
        Tags
        <span className="ml-1 font-normal normal-case text-text-secondary">
          (optional)
        </span>
      </Label>

      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {t.name.toLowerCase()}
              </span>
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="rounded-full p-0.5 text-text-secondary transition hover:bg-surface-100 hover:text-text-primary"
                aria-label={`Remove tag ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-50">
        <div className="flex min-w-0 items-center gap-2 border-b border-border-subtle px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          <input
            id="tag-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags…"
            className="w-full min-w-0 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 text-text-secondary hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-text-secondary">
              No tags found.
            </p>
          ) : (
            filtered.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-surface-100"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[13px] text-text-primary">{t.name}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── PreviewUrlsEditor ─────────────────────────────────────────────────────────

function PreviewUrlsEditor({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  function update(index: number, value: string) {
    const next = [...urls];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...urls, ""]);
  }

  return (
    <div className="w-full min-w-0">
      <Label htmlFor="preview-url-0" icon={<ImagePlus className="h-3.5 w-3.5" />}>
        Preview Images
        <span className="ml-1 font-normal normal-case text-text-secondary">
          (optional, multiple URLs)
        </span>
      </Label>

      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
            <input
              id={i === 0 ? "preview-url-0" : undefined}
              type="url"
              value={url}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`https://… (preview ${i + 1})`}
              className="input-base w-full min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 rounded-lg p-1.5 text-text-secondary transition hover:bg-red-50 hover:text-red-500"
              aria-label="Remove preview"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border-subtle px-4 py-2 text-[12px] font-medium text-text-secondary transition hover:border-brand-400 hover:text-brand-600"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        Add preview image
      </button>
    </div>
  );
}

// ── ResourceForm ──────────────────────────────────────────────────────────────

/**
 * Shared form for Create Resource and Edit Resource.
 * Root container: <form className="space-y-8">. Layout is handled by AdminFormLayout.
 * Props: mode, resource?, categories, tags, initialTagIds, initialPreviewUrls,
 * initialFileName, initialFileSize, onSubmit, onDelete?
 */
export function ResourceForm({
  mode,
  id,
  resource,
  categories,
  tags,
  initialTagIds = [],
  initialPreviewUrls = [],
  initialFileName,
  initialFileSize,
  onSubmit,
  onDelete,
  onPreviewDataChange,
}: ResourceFormProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState<FormState>(() => {
    if (isEdit && resource) {
      return {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        status: resource.status,
        isFree: resource.isFree,
        price: resource.isFree ? "" : centsToDollars(resource.price),
        fileUrl: resource.fileUrl ?? "",
        categoryId: resource.categoryId ?? "",
        featured: resource.featured,
      };
    }
    return {
      title: "",
      description: "",
      type: "PDF",
      status: "DRAFT",
      isFree: true,
      price: "",
      fileUrl: "",
      categoryId: "",
      featured: false,
    };
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialPreviewUrls.length > 0 ? initialPreviewUrls : [""],
  );

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeFileLoading, setRemoveFileLoading] = useState(false);
  const [hasPrivateFile, setHasPrivateFile] = useState(
    Boolean(initialFileName ?? initialFileSize),
  );
  const [fileUploadKey, setFileUploadKey] = useState(0);

  // Live preview sync: update when user edits title, description, tags, price, preview images.
  useEffect(() => {
    if (!onPreviewDataChange) return;

    const category = form.categoryId
      ? categories.find((c) => c.id === form.categoryId)
      : null;
    const priceNum = form.isFree ? 0 : Number(form.price) || 0;
    const previewUrl =
      previewUrls.filter((u) => u.trim() !== "")[0] ?? null;
    const selectedTagsData = tags.filter((t) => selectedTagIds.includes(t.id));

    const data: ResourceCardData = {
      id: "preview",
      title: form.title.trim() || "Sample resource title",
      slug: slugifyPreview(form.title) || "sample-resource",
      description:
        form.description.trim() ||
        "Short description of the resource to show how it will look in the marketplace.",
      isFree: form.isFree,
      price: priceNum,
      previewUrl: previewUrl || null,
      downloadCount: 0,
      author: { name: "You" },
      category: category
        ? { name: category.name, slug: "category" }
        : undefined,
      tags: selectedTagsData.map((t) => ({
        tag: { id: t.id, name: t.name, slug: t.slug },
      })),
      _count: { purchases: 0, reviews: 0 },
    };

    onPreviewDataChange(data);
  }, [
    onPreviewDataChange,
    form.title,
    form.description,
    form.categoryId,
    form.isFree,
    form.price,
    previewUrls,
    selectedTagIds,
    categories,
    tags,
  ]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "isFree" && checked ? { price: "" } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    const priceCents = form.isFree
      ? 0
      : Math.round((Number(form.price) || 0) * 100);

    const payload: ResourcePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      status: form.status,
      isFree: form.isFree,
      price: priceCents,
      fileUrl: form.fileUrl.trim() || null,
      categoryId: form.categoryId || null,
      featured: form.featured,
      tagIds: selectedTagIds,
      previewUrls: previewUrls.filter((u) => u.trim() !== ""),
    };

    try {
      await onSubmit(payload);
      setSuccess(
        isEdit ? "Resource updated successfully." : "Resource created successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleRemoveFile() {
    if (!isEdit || !resource || !hasPrivateFile) return;

    setRemoveFileLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/resources/${resource.id}/file`, {
        method: "DELETE",
      });

      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: await res.text() };

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in data
            ? (data as { error: string }).error
            : "Failed to remove file.",
        );
      }

      setForm((prev) => ({ ...prev, fileUrl: "" }));
      setHasPrivateFile(false);
      setFileUploadKey((prev) => prev + 1);
      setSuccess("File removed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setRemoveFileLoading(false);
    }
  }

  const normalizedPreviewUrls =
    previewUrls.length === 0 ? [""] : previewUrls;

  return (
    <>
      <form
        id={id}
        onSubmit={handleSubmit}
        className="w-full min-w-0 space-y-8"
      >
        <FormSection title="Basic Information">
          <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0 space-y-1.5 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <input
                id="title"
                name="title"
                type="text"
                required
                minLength={3}
                value={form.title}
                onChange={handleChange}
                className="input-base w-full"
              />
            </div>
            <div className="min-w-0 space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                required
                minLength={10}
                rows={4}
                value={form.description}
                onChange={handleChange}
                className="input-base w-full resize-none"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Metadata">
          <div className="grid w-full min-w-0 gap-4 md:grid-cols-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="type">Resource Type</Label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="PDF">PDF</option>
                <option value="DOCUMENT">Document</option>
              </select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <p className="mt-1 text-[11px] text-text-secondary">
                {form.status === "DRAFT" && "Only visible to admins."}
                {form.status === "PUBLISHED" && "Visible in marketplace."}
                {form.status === "ARCHIVED" && "Hidden but not deleted."}
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing">
          <div className="grid w-full min-w-0 gap-4 md:grid-cols-3">
            <div className="min-w-0 space-y-1.5 md:col-span-2">
              <Label htmlFor="pricing">Pricing model</Label>
              <div className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isFree: true,
                      price: "",
                    }))
                  }
                  className={[
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    form.isFree
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "bg-transparent text-zinc-600 hover:text-zinc-900",
                  ].join(" ")}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isFree: false,
                    }))
                  }
                  className={[
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    !form.isFree
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "bg-transparent text-zinc-600 hover:text-zinc-900",
                  ].join(" ")}
                >
                  Paid
                </button>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="price">Price (THB)</Label>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={handleChange}
                placeholder="49"
                className="input-base w-full"
                disabled={form.isFree}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Marketplace Options">
          <div className="space-y-4">
            <div className="flex min-w-0 items-start justify-between gap-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  Featured Resource
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Featured resources appear more prominently in the marketplace.
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle
                  checked={form.featured}
                  onCheckedChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      featured: value,
                    }))
                  }
                />
              </div>
            </div>

            <input
              type="hidden"
              name="isFeatured"
              value={form.featured ? "true" : "false"}
            />
          </div>
        </FormSection>

        <FormSection title="Tags">
          <div className="grid w-full min-w-0 gap-4">
            <TagSelector
              tags={tags}
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>
        </FormSection>

        <FormSection title="Content">
          <div className="w-full min-w-0 space-y-4">
            <PreviewUrlsEditor
              urls={normalizedPreviewUrls}
              onChange={setPreviewUrls}
            />

            <div className="min-w-0 space-y-1.5">
              <Label
                htmlFor="fileUrl"
                icon={<LinkIcon className="h-3.5 w-3.5" />}
              >
                External file URL
              </Label>
              <input
                id="fileUrl"
                name="fileUrl"
                type="url"
                value={form.fileUrl}
                onChange={handleChange}
                placeholder="https://…"
                className="input-base w-full"
              />
              <p className="mt-1 text-[11px] text-text-secondary">
                Used when the file is hosted externally instead of private
                uploads.
              </p>
            </div>

            <div className="w-full min-w-0 space-y-1.5">
              <Label htmlFor="file">File upload</Label>
              <div className="w-full min-w-0 space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-tightest text-text-secondary">
                    File upload
                  </p>

                  {hasPrivateFile && initialFileName && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium uppercase tracking-tightest text-text-muted">
                        Current file
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-text-primary">
                            {initialFileName}
                          </p>
                          {initialFileSize != null && (
                            <p className="text-[11px] text-text-muted">
                              {(initialFileSize / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-tightest text-text-muted">
                    {hasPrivateFile ? "Replace file" : "Upload file"}
                  </div>
                  <FileUploadWidget
                    key={fileUploadKey}
                    resourceId={resource?.id}
                    initialFileName={hasPrivateFile ? initialFileName : null}
                    initialFileSize={
                      hasPrivateFile ? initialFileSize ?? undefined : undefined
                    }
                    onRemoveCurrentFile={
                      isEdit && resource ? handleRemoveFile : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Feedback banners */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-[13px] text-emerald-700">{success}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border-subtle pt-6">
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="border-danger-200 text-danger-600 hover:bg-danger-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete resource
            </Button>
          ) : (
            <div /> 
          )}

          <div className="flex gap-3">
            {isEdit && resource && (
              <Link
                href={`/resources/${resource.slug}`}
                className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                View resource
              </Link>
            )}
            <Button type="submit" disabled={saveLoading}>
              {saveLoading && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              {isEdit ? "Save changes" : "Create resource"}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {isEdit && onDelete && showDeleteConfirm && resource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-card-lg">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-900">
                  Delete &ldquo;{resource.title}&rdquo;?
                </h3>
                <p className="mt-1.5 text-[13px] text-zinc-500">
                  This will permanently remove the resource along with all
                  associated purchases and reviews. This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  setError(null);
                  try {
                    await onDelete();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Network error. Please try again.",
                    );
                  } finally {
                    setDeleteLoading(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
