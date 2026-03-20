"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Link as LinkIcon,
  Tag,
  Star,
  Search,
  X,
  ImagePlus,
  Trash2,
  GripVertical,
  Upload,
} from "lucide-react";
import {
  Button,
  Input,
  PickerActionButton,
  PickerActions,
  PickerIconButton,
  PreviewCard,
  Select,
  Textarea,
} from "@/design-system";
import { formatFileSize } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
}

export interface AvailableTag {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  tags: AvailableTag[];
}

interface FormState {
  title: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLIC" | "UNLISTED" | "ARCHIVED";
  isFree: boolean;
  price: string; // string for controlled input, parsed to cents on submit
  fileUrl: string;
  categoryId: string;
  featured: boolean;
}

const DEFAULT_STATE: FormState = {
  title: "",
  description: "",
  type: "PDF",
  status: "PUBLIC",
  isFree: false,
  price: "",
  fileUrl: "",
  categoryId: "",
  featured: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
].join(",");

// ── Component ─────────────────────────────────────────────────────────────────

export function NewResourceForm({ categories, tags }: Props) {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // ── Async / feedback state ─────────────────────────────────────────────────
  /** True while any async operation (create or upload) is in flight. */
  const [loading, setLoading] = useState(false);
  /** Which step we're currently executing — drives button label. */
  const [step, setStep] = useState<"creating" | "uploading" | null>(null);
  /** Resource-creation error (hard stop — no redirect). */
  const [error, setError] = useState<string | null>(null);
  /** Upload error after successful creation — resource exists, still redirect. */
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** Field-level validation errors from the API (Zod). */
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // Auto-clear price when switching to free
      ...(name === "isFree" && checked ? { price: "" } : {}),
    }));
  }

  function handleReset() {
    setForm(DEFAULT_STATE);
    setSelectedTagIds([]);
    setPreviewUrls([]);
    setFile(null);
    setError(null);
    setUploadError(null);
  }

  // ── Submit: two-step create → upload → redirect ────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStep("creating");
    setError(null);
    setFieldErrors({});
    setUploadError(null);

    // [1] Convert price dollars (string) → cents (int), safely handling NaN
    const priceCents = form.isFree
      ? 0
      : Math.round((Number(form.price) || 0) * 100);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      status: form.status,
      isFree: form.isFree,
      price: priceCents,
      fileUrl: form.fileUrl.trim() || undefined,
      categoryId: form.categoryId || null,
      featured: form.featured,
      tagIds: selectedTagIds,
      previewUrls: previewUrls.filter((u) => u.trim() !== ""),
    };

    // ── Step 1: Create the resource ──────────────────────────────────────────
    let createdId: string | null = null;

    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Validation error payload from API
        if (res.status === 400 && data?.errors?.fieldErrors) {
          setFieldErrors(data.errors.fieldErrors as Record<string, string[]>);
          setError("Please fix the highlighted fields.");
        } else {
          setError(data?.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      createdId = data.data.id as string;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
      return;
    } finally {
      // Only clean up loading state here if creation failed
      if (!createdId) {
        setLoading(false);
        setStep(null);
      }
    }

    // ── Step 2: Upload file (if one was selected) ────────────────────────────
    if (file && createdId) {
      setStep("uploading");

      try {
        const uploadBody = new FormData();
        uploadBody.append("resourceId", createdId);
        uploadBody.append("file", file);

        const uploadRes = await fetch("/api/admin/resources/upload", {
          method: "POST",
          body: uploadBody,
        });

        const uploadData = await uploadRes.json();

        // [2] Throw so the catch block handles all upload failure paths uniformly
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Unknown error");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown error";
        setUploadError(
          `File upload failed: ${msg}. ` +
            `The resource was created — you can upload the file from the edit page.`
        );
        setLoading(false);
        setStep(null);
        // Give admin 3 s to read the warning before redirecting
        setTimeout(() => router.push(`/admin/resources/${createdId!}`), 3000);
        return;
      } finally {
        setLoading(false);
        setStep(null);
      }
    }

    // ── Step 3: Redirect to edit page ────────────────────────────────────────
    router.push(`/admin/resources/${createdId}`);
  }

  // ── Button label helper ────────────────────────────────────────────────────

  function submitLabel() {
    if (step === "creating") return "Creating…";
    if (step === "uploading") return "Uploading file…";
    return "Create Resource";
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white shadow-card"
    >
      {/* Form header */}
      <div className="border-b border-zinc-100 px-6 py-4">
        <h2 className="text-[15px] font-semibold text-zinc-900">
          New Resource
        </h2>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          Fill in the details below to add a resource to the library.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <Label htmlFor="title" icon={<FileText className="h-3.5 w-3.5" />}>
            Title
          </Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. SAT Math Practice Pack"
            className="input-base"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.title[0]}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={10}
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the resource…"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.description[0]}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <Label htmlFor="type">Resource Type</Label>
          <Select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input-base"
          >
            <option value="PDF">PDF</option>
            <option value="DOCUMENT">Document</option>
          </Select>
          {fieldErrors.status && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.status[0]}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-base"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <p className="mt-1 text-[11px] text-zinc-400">
            {form.status === "DRAFT" && "Only visible to admins."}
            {form.status === "PUBLIC" && "Visible in marketplace."}
            {form.status === "UNLISTED" &&
              "Accessible by direct link only."}
            {form.status === "ARCHIVED" && "Hidden but not deleted."}
          </p>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="categoryId" icon={<Tag className="h-3.5 w-3.5" />}>
            Category
          </Label>
          <Select
            id="categoryId"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="input-base"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* File URL (external link fallback) */}
        <div>
          <Label
            htmlFor="fileUrl"
            icon={<LinkIcon className="h-3.5 w-3.5" />}
          >
            File URL{" "}
            <span className="ml-1 font-normal normal-case text-zinc-400">(optional)</span>
          </Label>
          <Input
            id="fileUrl"
            name="fileUrl"
            type="url"
            value={form.fileUrl}
            onChange={handleChange}
            placeholder="https://…"
            className="input-base"
          />
          {fieldErrors.fileUrl && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.fileUrl[0]}
            </p>
          )}
        </div>

        {/* isFree + Price */}
        <div className="sm:col-span-2">
          <div className="flex items-start gap-6">
            {/* isFree checkbox */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                id="isFree"
                name="isFree"
                type="checkbox"
                checked={form.isFree}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600
                           focus:ring-blue-500"
              />
              <span className="text-[13px] font-medium text-zinc-700">
                Free resource
              </span>
            </label>

            {/* Price (hidden when free) */}
            {!form.isFree && (
              <div className="flex-1">
                <Label
                  htmlFor="price"
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                >
                  Price (USD)
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="9.99"
                    className="input-base pl-7"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Enter the price in dollars. Leave blank or 0 for free.
                </p>
                {fieldErrors.price && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.price[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Featured */}
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600
                         focus:ring-blue-500"
            />
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-700">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Feature this resource on the homepage
            </span>
          </label>
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <TagSelector
            tags={tags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>

        {/* Preview images */}
        <div className="sm:col-span-2">
          <PreviewUrlsEditor urls={previewUrls} onChange={setPreviewUrls} />
          {fieldErrors.previewUrls && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.previewUrls[0]}
            </p>
          )}
        </div>

        {/* ── Downloadable file ────────────────────────────────────────────── */}
        <div className="sm:col-span-2">
          <FilePickerSection file={file} onChange={setFile} />
        </div>
      </div>

      {/* ── Feedback banners ── */}

      {/* Resource creation error */}
      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* Upload error (resource was created — amber warning, not red) */}
      {uploadError && (
        <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-[13px] font-medium text-amber-800">
              Resource created — file upload failed
            </p>
            <p className="mt-0.5 text-[12px] text-amber-700">{uploadError}</p>
            <p className="mt-1 text-[11px] text-amber-600">
              Redirecting to edit page in a moment…
            </p>
          </div>
        </div>
      )}

      {/* Footer / submit */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4">
        <Button
          type="button"
          onClick={handleReset}
          disabled={loading}
          variant="secondary"
          className="rounded-xl px-4 py-2 text-[13px] font-medium text-zinc-600
                     transition hover:bg-zinc-100 hover:text-zinc-900
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </Button>

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2
                     text-[13px] font-semibold text-white shadow-sm transition
                     hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60
                     disabled:cursor-not-allowed"
        >
          {submitLabel()}
        </Button>
      </div>
    </form>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// [3] Shared label — used by all section headings for consistent styling
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
      className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold
                 uppercase tracking-wide text-zinc-500"
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
  tags: AvailableTag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? tags.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : tags;

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div>
      {/* [3] Converted from <p className="…"> to <Label> for consistency */}
      <Label htmlFor="" icon={<Tag className="h-3.5 w-3.5" />}>
        Tags
        <span className="ml-1 font-normal normal-case text-zinc-400">
          (optional)
        </span>
      </Label>

      {/* Selected pills */}
      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5
                         text-[12px] font-medium text-blue-700"
            >
              {t.name}
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="ml-0.5 text-blue-400 transition hover:text-blue-700"
                aria-label={`Remove tag ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + list */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags…"
            className="w-full bg-transparent text-[13px] text-zinc-700 placeholder-zinc-400
                       outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-zinc-400">
              No tags found.
            </p>
          ) : (
            filtered.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5
                           transition hover:bg-zinc-100"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600
                             focus:ring-blue-500"
                />
                <span className="text-[13px] text-zinc-700">{t.name}</span>
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
    <div>
      {/* [3] Converted from <p className="…"> to <Label> for consistency */}
      <Label htmlFor="" icon={<ImagePlus className="h-3.5 w-3.5" />}>
        Preview Images
        <span className="ml-1 font-normal normal-case text-zinc-400">
          (optional)
        </span>
      </Label>

      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-zinc-300" />
            <input
              type="url"
              value={url}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`https://… (preview ${i + 1})`}
              className="input-base flex-1"
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

      <PickerActionButton
        type="button"
        onClick={add}
        actionStyle="dashed"
        className="mt-2"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        Add preview image
      </PickerActionButton>
    </div>
  );
}

// ── FilePickerSection ─────────────────────────────────────────────────────────

/**
 * A file picker that is visually consistent with the rest of the form.
 * Does NOT upload immediately — the parent's submit handler does that.
 *
 * When the parent resets `file` to null the hidden input is cleared via
 * a useEffect so the same file can be re-selected later.
 */
function FilePickerSection({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files?.[0] ?? null);
  }

  function handleClear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* [3] Converted from <p className="…"> to <Label> for consistency */}
      <Label htmlFor="downloadable-file" icon={<Upload className="h-3.5 w-3.5" />}>
        Downloadable File
        <span className="ml-1 font-normal normal-case text-zinc-400">
          (optional)
        </span>
      </Label>

      {/* Selected file display */}
      {file && (
        <PreviewCard tone="info" className="mb-2 flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-800">
              {file.name}
            </p>
            <p className="text-[11px] text-zinc-500">
              {formatFileSize(file.size)}
            </p>
          </div>
          <PickerIconButton
            onClick={handleClear}
            aria-label="Remove selected file"
            tone="info"
            className="p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </PickerIconButton>
        </PreviewCard>
      )}

      {/* Native file input */}
      <input
        ref={inputRef}
        id="downloadable-file"
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleChange}
        className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2
                   text-[13px] text-zinc-700 shadow-sm
                   file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100
                   file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-zinc-600
                   hover:file:bg-zinc-200
                   focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <p className="mt-1.5 text-[11px] text-zinc-400">
        PDF, DOCX, XLSX, ZIP, images — max 50 MB. Uploaded securely after the
        resource is created.
      </p>
    </div>
  );
}
