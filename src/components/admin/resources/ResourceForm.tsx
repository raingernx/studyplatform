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
  ImagePlus,
  GripVertical,
} from "lucide-react";
import {
  Button,
  FileUploadWidget,
  MediaPreview,
  PickerActionButton,
  PickerActions,
  PickerIconButton,
  Select,
  Switch,
  Textarea,
} from "@/design-system";
import { LazyImageDropzone } from "./LazyImageDropzone";
import { PreviewImageSortableList } from "./PreviewImageSortableList";
import { TagInput } from "./TagInput";
import { UserSearchSelect } from "./UserSearchSelect";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { routes } from "@/lib/routes";

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

export type ResourceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ResourceLicense = "PERSONAL_USE" | "COMMERCIAL_USE" | "EXTENDED_LICENSE";
export type ResourceVisibility = "PUBLIC" | "UNLISTED";

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
  level?: ResourceLevel | null;
  license?: ResourceLicense | null;
  visibility?: ResourceVisibility | null;
  authorId?: string;
  authorName?: string | null;
}

export interface ResourcePayload {
  title: string;
  description: string;
  slug: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
  level?: ResourceLevel | null;
  license?: ResourceLicense | null;
  visibility?: ResourceVisibility | null;
  authorId?: string | null;
  tagIds: string[];
  previewUrls: string[];
}

type ResourceFormFieldErrors = Record<string, string | string[] | undefined>;

function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (!error || typeof error !== "object" || !("fields" in error)) {
    return null;
  }

  const { fields } = error as { fields?: unknown };
  if (!fields || typeof fields !== "object") {
    return null;
  }

  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields as ResourceFormFieldErrors)) {
    if (Array.isArray(value)) {
      if (typeof value[0] === "string" && value[0]) {
        next[key] = value[0];
      }
      continue;
    }

    if (typeof value === "string") {
      next[key] = value;
    }
  }

  return next;
}

interface FormState {
  title: string;
  description: string;
  slug: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: string;
  fileUrl: string;
  categoryId: string;
  featured: boolean;
  level: string;
  license: string;
  visibility: ResourceVisibility;
  authorId: string;
}

export interface ResourceFormProps {
  mode: "create" | "edit";
  id?: string;
  resource?: ResourceFormResource;
  /** When in create mode, an optional draft resource id used for uploads. */
  draftResourceId?: string;
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
  /** In create mode, called when the user first edits key fields or uses file upload so a draft can be created lazily. */
  onEnsureDraftResource?: () => Promise<string | undefined>;
  /** When the user creates a new tag from the tag input, called so the parent can add it to the tag list. */
  onTagCreated?: (tag: ResourceFormTag) => void;
  /** Current admin user (for Creator "Current user" default). */
  currentUser?: { id: string; name: string | null };
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

export function Label({
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
      className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {icon}
      {children}
    </label>
  );
}

// ── PreviewUrlsEditor ─────────────────────────────────────────────────────────

function PreviewUrlsEditor({
  urls,
  onChange,
  onUploadImage,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  /** When provided, shows "Upload image" and calls this with the selected file; expects public URL. */
  onUploadImage?: (file: File) => Promise<string | null>;
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
        <span className="ml-1 font-normal normal-case text-muted-foreground">
          (optional, multiple URLs or upload)
        </span>
      </Label>

      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              id={i === 0 ? "preview-url-0" : undefined}
              type="text"
              value={url}
              onChange={(e) => update(i, e.target.value)}
              placeholder={i === 0 ? "Thumbnail URL or path (e.g. /uploads/… or https://…)" : "https://… or /uploads/… (preview image)"}
              className="input-base w-full min-w-0 flex-1"
            />
            <PickerIconButton
              onClick={() => remove(i)}
              tone="danger"
              aria-label="Remove preview"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </PickerIconButton>
          </div>
        ))}
      </div>

      <PickerActions className="mt-2">
        <PickerActionButton
          type="button"
          onClick={add}
          actionStyle="dashed"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Add URL
        </PickerActionButton>
        {onUploadImage && (
          <PickerActionButton asChild actionStyle="dashed">
            <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await onUploadImage(file);
                  if (url) onChange([...urls.filter((u) => u.trim() !== ""), url]);
                } finally {
                  e.target.value = "";
                }
              }}
            />
            <ImagePlus className="h-3.5 w-3.5" />
            Upload image
            </label>
          </PickerActionButton>
        )}
      </PickerActions>
    </div>
  );
}

// ── ResourceForm ──────────────────────────────────────────────────────────────

  /**
   * Shared form for Create Resource and Edit Resource.
   * Root container: <form className="space-y-8">. Layout is handled by AdminFormLayout.
   *
   * Field order:
   *  1. Title
   *  2. Description
   *  3. Category / Type / Status (3-column grid)
   *  4. Pricing (model + price)
   *  5. Tags
   *  6. Media (thumbnail + preview images)
   *  7. File (external URL + private upload)
   */
export function ResourceForm({
  mode,
  id,
  resource,
  draftResourceId,
  categories,
  tags,
  initialTagIds = [],
  initialPreviewUrls = [],
  initialFileName,
  initialFileSize,
  onSubmit,
  onDelete,
  onPreviewDataChange,
  onEnsureDraftResource,
  onTagCreated,
  currentUser,
}: ResourceFormProps) {
  const isEdit = mode === "edit";
  const effectiveResourceId = resource?.id ?? draftResourceId;

  const [form, setForm] = useState<FormState>(() => {
    if (isEdit && resource) {
      return {
        title: resource.title,
        description: resource.description,
        slug: resource.slug,
        type: resource.type,
        status: resource.status,
        isFree: resource.isFree,
        price: resource.isFree ? "" : String(Math.round(resource.price / 100)),
        fileUrl: resource.fileUrl ?? "",
        categoryId: resource.categoryId ?? "",
        featured: resource.featured,
        level: resource.level ?? "",
        license: resource.license ?? "",
        visibility: (resource.visibility ?? "PUBLIC") as ResourceVisibility,
        authorId: resource.authorId ?? "",
      };
    }
    return {
      title: "",
      description: "",
      slug: "",
      type: "PDF",
      status: "DRAFT",
      isFree: true,
      price: "",
      fileUrl: "",
      categoryId: "",
      featured: false,
      level: "",
      license: "",
      visibility: "PUBLIC",
      authorId: "",
    };
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialPreviewUrls.length > 0
      ? initialPreviewUrls.filter((u) => u.trim() !== "")
      : [],
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
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  async function uploadImageFile(file: File): Promise<string | null> {
    setImageUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setImageUploadError((data as { error?: string }).error ?? "Upload failed.");
      return null;
    }
    return typeof (data as { url?: string }).url === "string" ? (data as { url: string }).url : null;
  }

  async function handleThumbnailUpload(file: File) {
    setThumbnailUploading(true);
    setImageUploadError(null);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setPreviewUrls((prev) => {
          const next = prev.filter((u) => u.trim() !== "");
          return [url, ...next];
        });
      }
    } finally {
      setThumbnailUploading(false);
    }
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  // Keep slug in sync with title unless the user has edited it manually.
  useEffect(() => {
    if (!slugEditedManually && form.title.trim()) {
      setForm((prev) => ({
        ...prev,
        slug: slugify(form.title),
      }));
    }
  }, [form.title, slugEditedManually]);

  // Live preview sync: update when user edits title, description, tags, price, preview images.
  useEffect(() => {
    if (!onPreviewDataChange) return;

    const category = form.categoryId
      ? categories.find((c) => c.id === form.categoryId)
      : null;
    // For preview, keep price semantics consistent with the database:
    // Resource.price is stored in the smallest unit (satang).
    const priceNum = form.isFree
      ? 0
      : Math.round((Number(form.price) || 0) * 100);
    const previewUrl =
      previewUrls.filter((u) => u.trim() !== "")[0] ?? null;
    const selectedTagsData = tags.filter((t) => selectedTagIds.includes(t.id));

    const data: ResourceCardData = {
      id: "preview",
      title: form.title.trim() || "Sample resource title",
      slug: form.slug.trim() || slugifyPreview(form.title) || "sample-resource",
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

    setFieldErrors((prev) => {
      if (!name) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

    const nextValue =
      name === "description" ? value.slice(0, 500) : value;

    // Lazily create a draft when the user first edits the title in create mode.
    if (
      mode === "create" &&
      !resource?.id &&
      !draftResourceId &&
      onEnsureDraftResource &&
      name &&
      name === "title"
    ) {
      const trimmed = typeof nextValue === "string" ? nextValue.trim() : "";
      if (trimmed.length > 0) {
        void onEnsureDraftResource();
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : nextValue,
      ...(name === "isFree" && checked ? { price: "" } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveState("saving");
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const priceCents = form.isFree
      ? 0
      : Math.round((Number(form.price) || 0) * 100);

    const rawSlug = (form.slug && form.slug.trim()) || slugify(form.title);

    const payload: ResourcePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      slug: rawSlug,
      type: form.type,
      status: form.status,
      isFree: form.isFree,
      price: priceCents,
      fileUrl: form.fileUrl.trim() || null,
      categoryId: form.categoryId || null,
      featured: form.featured,
      level: form.level ? (form.level as ResourceLevel) : undefined,
      license: form.license ? (form.license as ResourceLicense) : undefined,
      visibility: form.visibility,
      authorId: form.authorId?.trim() || undefined,
      tagIds: selectedTagIds,
      previewUrls: previewUrls.filter((u) => u.trim() !== ""),
    };

    try {
      await onSubmit(payload);
      setSuccess(
        isEdit ? "Resource updated successfully." : "Resource created successfully.",
      );
      setSaveState("saved");
    } catch (err) {
      const nextFieldErrors = extractFieldErrors(err);
      if (nextFieldErrors) {
        setFieldErrors(nextFieldErrors);
      }
      setError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
      setSaveState("idle");
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

  const normalizedPreviewUrls = previewUrls.filter((u) => u.trim() !== "");
  const descriptionLength = form.description.length;
  const slugPreview = form.slug.trim() || slugifyPreview(form.title);

  return (
    <>
      <form
        id={id}
        onSubmit={handleSubmit}
        className="w-full min-w-0 space-y-8"
      >
        {/* Save state indicator */}
        <div className="flex justify-end text-[11px] text-muted-foreground">
          {saveState === "saving" && <span>Saving...</span>}
          {saveState === "saved" && (
            <span className="text-emerald-600">Saved</span>
          )}
        </div>

        {/* Basic Info */}
        <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
        <div className="grid w-full min-w-0 gap-4">
          <div className="min-w-0 space-y-1.5">
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
              placeholder="Enter resource title"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-[12px] text-red-600">
                {fieldErrors.title}
              </p>
            )}
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              {!isEditingSlug ? (
                <>
                  <p className="truncate text-muted-foreground">
                    /resources/{slugPreview}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-50"
                    onClick={() => setIsEditingSlug(true)}
                  >
                    Edit URL
                  </button>
                </>
              ) : (
                <div className="flex w-full items-center gap-1.5">
                  <span className="shrink-0 text-muted-foreground">
                    /resources/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        slug: value,
                      }));
                      setSlugEditedManually(true);
                    }}
                    className="input-base w-full py-1 text-[11px]"
                    placeholder={slugPreview}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-50"
                    onClick={() => setIsEditingSlug(false)}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Description */}
        <div className="grid w-full min-w-0 gap-4">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={10}
              value={form.description}
              onChange={handleChange}
              placeholder="Briefly describe what this resource contains..."
            />
            {fieldErrors.description && (
              <p className="mt-1 text-[12px] text-red-600">
                {fieldErrors.description}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {descriptionLength} / 500 characters
            </p>
          </div>
        </div>

        {/* Basic Info: Category, Level, Type */}
        <div className="grid w-full min-w-0 gap-4 md:grid-cols-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {fieldErrors.categoryId && (
              <p className="mt-1 text-[12px] text-red-600">
                {fieldErrors.categoryId}
              </p>
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="level">Level</Label>
            <Select
              id="level"
              name="level"
              value={form.level}
              onChange={handleChange}
            >
              <option value="">— None —</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="type">Resource Type</Label>
            <Select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="PDF">PDF</option>
              <option value="DOCUMENT">Document</option>
            </Select>
            {fieldErrors.type && (
              <p className="mt-1 text-[12px] text-red-600">
                {fieldErrors.type}
              </p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid w-full min-w-0 gap-4">
          <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="isFree"
                checked={form.isFree}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    isFree: checked,
                    ...(checked ? { price: "" } : {}),
                  }))
                }
              />
              <label htmlFor="isFree" className="text-sm font-medium text-foreground">
                Free resource
              </label>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-[140px]">
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
                className="input-base w-full disabled:opacity-70"
                disabled={form.isFree}
              />
              {fieldErrors.price && (
                <p className="mt-1 text-[12px] text-red-600">
                  {fieldErrors.price}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="grid w-full min-w-0 gap-4">
          <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
            <div className="min-w-0 space-y-1.5 sm:max-w-[180px]">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {form.status === "DRAFT" && "Only visible to admins."}
                {form.status === "PUBLISHED" && "Visible in marketplace."}
                {form.status === "ARCHIVED" && "Hidden but not deleted."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, featured: checked }))
                }
              />
              <label htmlFor="featured" className="text-sm font-medium text-foreground">
                Featured resource
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              May appear on homepage or in featured sections.
            </p>
            {form.status === "PUBLISHED" && (
              <div className="min-w-0 space-y-1.5 sm:max-w-[180px]">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  id="visibility"
                  name="visibility"
                  value={form.visibility}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      visibility: e.target.value as ResourceVisibility,
                    }))
                  }
                >
                  <option value="PUBLIC">Public</option>
                  <option value="UNLISTED">Unlisted</option>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Unlisted: accessible by URL, not shown in marketplace listings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="w-full min-w-0">
          <Label htmlFor="tag-input-search" icon={<Tag className="h-3.5 w-3.5" />}>
            Tags
            <span className="ml-1 font-normal normal-case text-muted-foreground">
              (optional)
            </span>
          </Label>
          <TagInput
            options={tags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
            placeholder="Search or add tags…"
            label={undefined}
            onCreateTag={
              onTagCreated
                ? async (name) => {
                    const res = await fetch("/api/admin/tags", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: name.trim() }),
                    });
                    const json = await res.json();
                    if (!res.ok) return null;
                    const tag = json.data as ResourceFormTag;
                    onTagCreated(tag);
                    return tag;
                  }
                : undefined
            }
          />
        </div>

        {/* Media */}
        <h3 className="text-sm font-semibold text-foreground">Media</h3>
        <div className="w-full min-w-0 space-y-4">
          <p className="text-[11px] text-muted-foreground">
            JPEG, PNG, WebP, GIF. Max 5MB per image.
          </p>
          {/* Thumbnail: uses first preview URL (cover = first in list) */}
          <div className="w-full min-w-0 space-y-2">
            <Label htmlFor="thumbnail-upload">Thumbnail</Label>
            {normalizedPreviewUrls[0] && (
              <MediaPreview>
                <img
                  src={normalizedPreviewUrls[0]}
                  alt="Thumbnail preview"
                  className="h-32 w-auto max-w-[240px] object-cover"
                />
              </MediaPreview>
            )}
            <PickerActions>
              <PickerActionButton asChild disabled={thumbnailUploading}>
                <label className="cursor-pointer">
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={thumbnailUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbnailUpload(file);
                    e.target.value = "";
                  }}
                />
                {thumbnailUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {thumbnailUploading ? "Uploading…" : "Upload thumbnail"}
                </label>
              </PickerActionButton>
            </PickerActions>
            {imageUploadError && (
              <p className="text-[12px] text-red-600">{imageUploadError}</p>
            )}
          </div>

          {/* Drag & drop upload + sortable previews; first image = cover */}
          <div className="w-full min-w-0 space-y-2">
            <Label htmlFor="preview-images">Preview images</Label>
            <p className="text-[11px] text-muted-foreground">
              First image is the cover. Drag to reorder; use first position as cover.
            </p>
            <LazyImageDropzone
              rootTestId="preview-image-uploader"
              disabled={thumbnailUploading}
              onFilesAccepted={async (files) => {
                const uploaded: string[] = [];
                for (const file of files) {
                  const url = await uploadImageFile(file);
                  if (url) uploaded.push(url);
                }
                if (uploaded.length > 0) {
                  setPreviewUrls((prev) => [
                    ...prev.filter((u) => u.trim() !== ""),
                    ...uploaded,
                  ]);
                }
              }}
              helpText="Drag & drop preview images here, or click to browse"
            />
            <PreviewImageSortableList
              images={normalizedPreviewUrls}
              onReorder={(next) => setPreviewUrls(next)}
              onRemoveIndex={(index) =>
                setPreviewUrls((prev) =>
                  prev.filter((_, i) => i !== index),
                )
              }
              onSetCover={(index) =>
                setPreviewUrls((prev) => {
                  const next = [...prev];
                  const [img] = next.splice(index, 1);
                  next.unshift(img);
                  return next;
                })
              }
            />
          </div>

          <PreviewUrlsEditor
            urls={normalizedPreviewUrls}
            onChange={setPreviewUrls}
            onUploadImage={uploadImageFile}
          />
        </div>

        {/* File */}
        <div className="grid w-full min-w-0 gap-4">
          <h3 className="text-sm font-semibold text-foreground">File</h3>
          <div className="min-w-0 space-y-4">
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
                placeholder="https://example.com/file.pdf"
                className="input-base w-full"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Used when the file is hosted externally instead of private
                uploads.
              </p>
            </div>

            <div className="w-full min-w-0 space-y-1.5">
              <Label htmlFor="file">File upload</Label>
              <div className="w-full min-w-0 space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-tightest text-muted-foreground">
                    File upload
                  </p>

                  {hasPrivateFile && initialFileName && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-medium uppercase tracking-tightest text-muted-foreground">
                        Current file
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {initialFileName}
                          </p>
                          {initialFileSize != null && (
                            <p className="text-[11px] text-muted-foreground">
                              {(initialFileSize / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-tightest text-muted-foreground">
                    {hasPrivateFile ? "Replace file" : "Upload file"}
                  </div>
                  <FileUploadWidget
                    key={fileUploadKey}
                    resourceId={effectiveResourceId}
                    initialFileName={hasPrivateFile ? initialFileName : null}
                    initialFileSize={
                      hasPrivateFile ? initialFileSize ?? undefined : undefined
                    }
                    onRemoveCurrentFile={
                      isEdit && resource ? handleRemoveFile : undefined
                    }
                    onEnsureResourceId={
                      !isEdit && onEnsureDraftResource ? onEnsureDraftResource : undefined
                    }
                  />
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Allowed: PDF, DOCX, XLSX, ZIP. Max file size: 50MB.
              </p>
            </div>
          </div>
        </div>

        {/* License */}
        <div className="grid w-full min-w-0 gap-4">
          <h3 className="text-sm font-semibold text-foreground">License</h3>
          <div className="min-w-0 max-w-md space-y-1.5">
            <Label htmlFor="license">License type</Label>
            <Select
              id="license"
              name="license"
              value={form.license}
              onChange={handleChange}
            >
              <option value="">— None —</option>
              <option value="PERSONAL_USE">Personal Use</option>
              <option value="COMMERCIAL_USE">Commercial Use</option>
              <option value="EXTENDED_LICENSE">Extended License</option>
            </Select>
          </div>
        </div>

        {/* Creator (admin override) — optional; default is current user */}
        <div className="grid w-full min-w-0 gap-4">
          <h3 className="text-sm font-semibold text-foreground">Creator</h3>
          <div className="min-w-0 max-w-md space-y-1.5">
            <Label htmlFor="authorId">Assign owner</Label>
            <UserSearchSelect
              id="authorId"
              value={form.authorId}
              onChange={(userId) =>
                setForm((prev) => ({ ...prev, authorId: userId }))
              }
              currentUserId={currentUser?.id}
              currentUserName={currentUser?.name}
              initialAuthorName={resource?.authorName}
            />
            <p className="text-[11px] text-muted-foreground">
              Optional. Defaults to the current admin user.
            </p>
          </div>
        </div>

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

        <div className="flex items-center justify-between border-t border-border pt-6">
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
                href={routes.resource(resource.slug)}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
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
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card-lg">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">
                  Delete &ldquo;{resource.title}&rdquo;?
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
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
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
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
