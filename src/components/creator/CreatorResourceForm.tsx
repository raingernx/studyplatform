"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "@/design-system";
import { CreatorStickyActionBar } from "@/components/creator/CreatorStickyActionBar";
import {
  CreatorPublishReadiness,
  type FieldName,
} from "@/components/creator/CreatorPublishReadiness";
import { CreatorResourcePreview } from "@/components/creator/CreatorResourcePreview";
import { CreatorBuyerPreviewModal } from "@/components/creator/CreatorBuyerPreviewModal";
import { CreatorPublishSuccessModal } from "@/components/creator/CreatorPublishSuccessModal";
import { routes } from "@/lib/routes";

export interface CreatorResourceFormCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CreatorResourceFormValues {
  id?: string;
  title: string;
  description: string;
  slug: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: string;
  categoryId: string;
  fileUrl: string;
  previewUrls: string[];
  /** Thumbnail URL for live preview only — not yet persisted by the backend. */
  thumbnailUrl?: string;
}

interface CreatorResourceFormProps {
  mode: "create" | "edit";
  categories: CreatorResourceFormCategory[];
  initialValues?: CreatorResourceFormValues;
  /** True when this creator has no resources yet. Enables guided UI. */
  isFirstResource?: boolean;
  /** When set, scroll-to and temporarily highlight this field on mount. */
  focusField?: FieldName;
}

const DEFAULT_VALUES: CreatorResourceFormValues = {
  title: "",
  description: "",
  slug: "",
  type: "PDF",
  status: "DRAFT",
  isFree: true,
  price: "",
  categoryId: "",
  fileUrl: "",
  previewUrls: [],
  thumbnailUrl: "",
};

function toPreviewTextarea(urls: string[]) {
  return urls.join("\n");
}

function fromPreviewTextarea(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CreatorResourceForm({
  mode,
  categories,
  initialValues = DEFAULT_VALUES,
  isFirstResource = false,
  focusField,
}: CreatorResourceFormProps) {
  const router = useRouter();
  // Spread DEFAULT_VALUES first so any field not in initialValues (e.g. thumbnailUrl
  // on existing resources) always has a safe default rather than undefined.
  const [form, setForm] = useState<CreatorResourceFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [previewInput, setPreviewInput] = useState(toPreviewTextarea(initialValues.previewUrls));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [highlightedField, setHighlightedField] = useState<FieldName | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLDivElement>(null);

  // ── Readiness (single source of truth) ──────────────────────────────────
  const missingFields = useMemo<FieldName[]>(() => {
    const missing: FieldName[] = [];
    if (!form.title || form.title.trim().length < 3) missing.push("title");
    if (!form.description || form.description.trim().length < 10) missing.push("description");
    if (!form.isFree && (!form.price || Number(form.price) <= 0)) missing.push("price");
    if (!form.fileUrl) missing.push("file");
    return missing;
  }, [form.title, form.description, form.isFree, form.price, form.fileUrl]);

  const completion = 4 - missingFields.length;
  const canPublish = missingFields.length === 0;

  // ── Scroll + highlight helper (shared by auto-focus and chip clicks) ─────
  const refMap: Record<FieldName, React.RefObject<HTMLDivElement | null>> = {
    title: titleRef,
    description: descriptionRef,
    price: priceRef,
    file: fileRef,
  };

  function scrollToField(field: FieldName): ReturnType<typeof setTimeout> | undefined {
    const ref = refMap[field];
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = ref.current.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");
    if (input) input.focus({ preventScroll: true });
    setHighlightedField(field);
    return setTimeout(() => setHighlightedField(null), 2000);
  }

  // Auto-scroll to focusField on mount (from ?focus= query param)
  useEffect(() => {
    if (!focusField) return;
    const timer = scrollToField(focusField);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
    // scrollToField uses only stable refs and state setters — safe with empty deps
  }, [focusField]);

  const previewUrls = useMemo(() => fromPreviewTextarea(previewInput), [previewInput]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = event.target;
    const checked =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "isFree" && checked ? { price: "" } : {}),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function submitWithStatus(status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const submittedForm = { ...form, status };

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/creator/resources"
          : `/api/creator/resources/${submittedForm.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: submittedForm.title,
            description: submittedForm.description,
            slug: submittedForm.slug,
            type: submittedForm.type,
            status: submittedForm.status,
            isFree: submittedForm.isFree,
            price: submittedForm.isFree ? 0 : Math.round((Number(submittedForm.price) || 0) * 100),
            categoryId: submittedForm.categoryId || null,
            fileUrl: submittedForm.fileUrl || null,
            previewUrls,
          }),
        },
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (json.fields && typeof json.fields === "object") {
          setFieldErrors(json.fields as Record<string, string>);
        }
        throw new Error(json.error ?? "Failed to save resource.");
      }

      if (status === "PUBLISHED") {
        // Show success modal instead of redirecting — user navigates from there
        setPublishedSlug((json.data?.slug as string) ?? null);
        setPublishSuccess(true);
      } else {
        router.push(routes.creatorResources);
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Network error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Legacy submit handler used in edit mode (status select drives intent)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitWithStatus(form.status);
  }

  const isCreateMode = mode === "create";

  // The live preview thumbnail uses the dedicated thumbnailUrl input first,
  // then falls back to previewUrls[0] — the same image the backend saves to
  // resource.previewUrl and displays in the marketplace.
  const previewThumbnail = form.thumbnailUrl || previewUrls[0] || null;

  return (
    <>
    <form onSubmit={isCreateMode ? (e) => e.preventDefault() : handleSubmit}>
      {/* ── Mobile: preview above form content ───────────────────────────── */}
      <div className="mb-6 lg:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Marketplace preview
        </p>
        <CreatorResourcePreview
          title={form.title}
          description={form.description}
          price={Number(form.price) || null}
          isFree={form.isFree}
          thumbnailUrl={previewThumbnail}
        />
      </div>

      {/* ── Desktop: 2-col grid — form left, sticky preview right ─────────── */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">

      {/* ── Left column: all form sections ───────────────────────────────── */}
      <div className={isCreateMode ? "space-y-6 pb-24" : "space-y-8"}>

      {/* ── Section 1: Basic info ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            {isCreateMode && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                1
              </span>
            )}
            <h2 className="text-lg font-semibold text-neutral-900">
              {isCreateMode ? "Basic info" : "Edit resource"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {isCreateMode
              ? "The title and description are the most important parts of your listing."
              : "Manage the details learners will see in the marketplace."}
          </p>
        </div>

        <div className="grid gap-5">
          <div
            ref={titleRef}
            className={`space-y-1.5 rounded-xl p-1 -m-1 transition-all duration-300${highlightedField === "title" ? " ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/60" : ""}`}
          >
            <label className="text-sm font-medium text-neutral-700">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={
                isFirstResource
                  ? "e.g. Grade 5 Fractions Worksheet — Practice & Answer Key"
                  : "My study guide"
              }
              error={fieldErrors.title}
              hint={
                isFirstResource && !fieldErrors.title
                  ? "Be specific about the subject, grade level, or topic. Specific titles rank and convert better."
                  : undefined
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Slug{" "}
              <span className="ml-1 text-xs font-normal text-neutral-400">(auto-generated if left blank)</span>
            </label>
            <Input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="grade-5-fractions-worksheet"
              hint="Only lowercase letters, numbers, and hyphens. This becomes the page URL."
            />
          </div>

          <div
            ref={descriptionRef}
            className={`space-y-1.5 rounded-xl p-1 -m-1 transition-all duration-300${highlightedField === "description" ? " ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/60" : ""}`}
          >
            <label className="text-sm font-medium text-neutral-700">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={isFirstResource ? 7 : 6}
              placeholder={
                isFirstResource
                  ? "Describe what's inside, who it's for, and what learners will be able to do after using it.\n\nExample:\nThis 12-page worksheet pack covers fraction addition and subtraction for Grade 5. Includes 40 practice problems, worked examples, and a full answer key. Aligned to the Thai national curriculum."
                  : "Explain what learners get and who this resource is for."
              }
              error={fieldErrors.description}
              hint={
                isFirstResource && !fieldErrors.description
                  ? "Aim for 3–5 sentences. Include: what's inside, who it's for, and what outcome it delivers."
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Pricing and visibility ────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          {isCreateMode && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
              2
            </span>
          )}
          <h2 className="text-lg font-semibold text-neutral-900">Pricing and visibility</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Hide status select in create mode — sticky bar handles intent */}
          {!isCreateMode && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Status</label>
              <Select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Type</label>
            <Select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="PDF">PDF</option>
              <option value="DOCUMENT">Document</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Category</label>
            <Select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div
            ref={priceRef}
            className={`space-y-1.5 rounded-xl p-1 -m-1 transition-all duration-300${highlightedField === "price" ? " ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/60" : ""}`}
          >
            <label className="text-sm font-medium text-neutral-700">Price (THB)</label>
            <Input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              disabled={form.isFree}
              placeholder={form.isFree ? "Free" : "e.g. 99"}
              hint={
                !form.isFree
                  ? "Enter the amount in Thai Baht. Buyers pay this price at checkout."
                  : undefined
              }
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
          <input
            name="isFree"
            type="checkbox"
            checked={form.isFree}
            onChange={handleChange}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
          Make this resource free
        </label>
      </section>

      {/* ── Section 3: Delivery and previews ─────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          {isCreateMode && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
              3
            </span>
          )}
          <h2 className="text-lg font-semibold text-neutral-900">Delivery and previews</h2>
        </div>

        <div className="grid gap-5">
          {/* Thumbnail URL — drives live preview and, when present, is the first
              image buyers see. Not yet persisted separately; add it to Preview
              image URLs below to save it with the resource. */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              Thumbnail URL{" "}
              <span className="ml-1 text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <Input
              name="thumbnailUrl"
              value={form.thumbnailUrl ?? ""}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
              hint="This is what buyers see first · Recommended: 1280×720 (16:9) · Updates the preview on the right"
            />
          </div>

          <div
            ref={fileRef}
            className={`space-y-1.5 rounded-xl p-1 -m-1 transition-all duration-300${highlightedField === "file" ? " ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/60" : ""}`}
          >
            <label className="text-sm font-medium text-neutral-700">File URL</label>
            <Input
              name="fileUrl"
              value={form.fileUrl}
              onChange={handleChange}
              placeholder="https://r2.example.com/uploads/my-worksheet.pdf"
              hint="Paste the direct download URL for the file buyers will receive. Private uploads remain an admin-only flow today."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Preview image URLs</label>
            <Textarea
              value={previewInput}
              onChange={(event) => setPreviewInput(event.target.value)}
              rows={isFirstResource ? 4 : 5}
              placeholder={"/uploads/preview-cover.webp\nhttps://example.com/preview-2.webp"}
              hint="One image URL per line. The first image becomes the card thumbnail and detail header. Use a clean, readable cover for best results."
            />
            {fieldErrors.previewUrls && (
              <p className="text-xs text-red-600">{fieldErrors.previewUrls}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Publish readiness summary (both modes) ───────────────────────── */}
      <CreatorPublishReadiness
        missingFields={missingFields}
        completion={completion}
        onJumpToField={scrollToField}
        subtle={!isCreateMode}
      />

      {/* ── Edit mode: traditional bottom buttons ────────────────────────── */}
      {!isCreateMode && (
        <div className="flex items-center justify-between gap-4">
          <div>{error && <p className="text-sm text-red-600">{error}</p>}</div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(routes.creatorResources)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      {/* ── Create mode: sticky action bar ───────────────────────────────── */}
      {isCreateMode && (
        <CreatorStickyActionBar
          canPublish={canPublish}
          saving={saving}
          error={error}
          onSaveDraft={() => submitWithStatus("DRAFT")}
          onPublish={() => submitWithStatus("PUBLISHED")}
          onCancel={() => router.push(routes.creatorResources)}
          onPreview={() => setPreviewOpen(true)}
        />
      )}

      </div> {/* end left column */}

      {/* ── Right column: sticky preview (desktop only) ───────────────────── */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Marketplace preview
          </p>
          <CreatorResourcePreview
            title={form.title}
            description={form.description}
            price={Number(form.price) || null}
            isFree={form.isFree}
            thumbnailUrl={previewThumbnail}
          />
        </div>
      </aside>

      </div> {/* end grid */}
    </form>

    {/* Buyer preview modal — outside <form> so its buttons can't trigger submit */}
    <CreatorBuyerPreviewModal
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      resource={{
        title: form.title || "Untitled resource",
        description: form.description,
        price: Number(form.price) || 0,
        isFree: form.isFree,
        previewUrls: previewUrls,
        thumbnailUrl: form.thumbnailUrl || previewUrls[0] || null,
        fileUrl: form.fileUrl || undefined,
        type: form.type,
      }}
    />

    {/* Publish success modal — shown instead of redirecting after a successful publish */}
    <CreatorPublishSuccessModal
      open={publishSuccess}
      onClose={() => setPublishSuccess(false)}
      resourceSlug={publishedSlug ?? undefined}
      title={form.title}
      description={form.description}
      price={Number(form.price) || 0}
      isFree={form.isFree}
      thumbnailUrl={previewThumbnail}
    />
    </>
  );
}
