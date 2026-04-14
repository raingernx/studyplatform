"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import { Button, FileUploadWidget, Input, Select, Textarea } from "@/design-system";
import {
  CreatorAIDraftGenerator,
  type CreatorAIDraftResourceSeed,
  type CreatorAIDraftValues,
} from "@/components/creator/CreatorAIDraftGenerator";
import { CreatorPublishActions } from "@/components/creator/CreatorPublishActions";
import {
  CreatorPublishReadiness,
  type FieldName,
} from "@/components/creator/CreatorPublishReadiness";
import { CreatorResourcePreview } from "@/components/creator/CreatorResourcePreview";
import { CreatorBuyerPreviewModal } from "@/components/creator/CreatorBuyerPreviewModal";
import { CreatorPublishSuccessModal } from "@/components/creator/CreatorPublishSuccessModal";
import {
  LazyImageDropzone,
  PreviewImageSortableList,
} from "@/components/admin/resources";
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
  fileKey?: string;
  fileName?: string;
  fileSize?: number | null;
  previewUrls: string[];
  /** Thumbnail URL for live preview only — not yet persisted by the backend. */
  thumbnailUrl?: string;
}

type DeliverySource = "upload" | "external";

interface CreatorResourceFormProps {
  mode: "create" | "edit";
  categories: CreatorResourceFormCategory[];
  initialValues?: CreatorResourceFormValues;
  initialAIDraft?: CreatorAIDraftValues | null;
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

function dedupeImageUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

function mergeImageUrls(previewUrls: string[], thumbnailUrl?: string | null) {
  return dedupeImageUrls([thumbnailUrl ?? "", ...previewUrls]);
}

function summarizeExternalUrl(value: string) {
  try {
    const target = new URL(value);
    return {
      host: target.host,
      path: `${target.pathname}${target.search}` || "/",
    };
  } catch {
    return {
      host: "External link",
      path: value,
    };
  }
}

function getExternalFileUrlIssue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const target = new URL(trimmed);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return "This URL can't be used yet. Use a full http:// or https:// link.";
    }
    return null;
  } catch {
    return "This URL can't be used yet. Use a full http:// or https:// link.";
  }
}

function getPreviewImageUrlIssue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return null;
  }

  try {
    const target = new URL(trimmed);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return "Use a full http:// or https:// image URL, or a local /path image reference.";
    }
    return null;
  } catch {
    return "Use a full http:// or https:// image URL, or a local /path image reference.";
  }
}

function fromPreviewTextarea(value: string) {
  return dedupeImageUrls(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

export function CreatorResourceForm({
  mode,
  categories,
  initialValues = DEFAULT_VALUES,
  initialAIDraft,
  isFirstResource = false,
  focusField,
}: CreatorResourceFormProps) {
  const router = useRouter();
  const fieldIdPrefix = useId();
  const titleInputId = `${fieldIdPrefix}-title`;
  const slugInputId = `${fieldIdPrefix}-slug`;
  const descriptionInputId = `${fieldIdPrefix}-description`;
  const statusSelectId = `${fieldIdPrefix}-status`;
  const typeSelectId = `${fieldIdPrefix}-type`;
  const categorySelectId = `${fieldIdPrefix}-category`;
  const priceInputId = `${fieldIdPrefix}-price`;
  const isFreeInputId = `${fieldIdPrefix}-is-free`;
  const previewUrlDraftPrefix = `${fieldIdPrefix}-preview-url`;
  const bulkPreviewTextareaId = `${fieldIdPrefix}-preview-url-bulk`;
  const externalFileUrlInputId = `${fieldIdPrefix}-external-file-url`;
  const initialImageUrls = mergeImageUrls(initialValues.previewUrls, initialValues.thumbnailUrl);
  // Spread DEFAULT_VALUES first so any field not in initialValues (e.g. thumbnailUrl
  // on existing resources) always has a safe default rather than undefined.
  const [form, setForm] = useState<CreatorResourceFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [previewUrlsState, setPreviewUrlsState] = useState<string[]>(initialImageUrls);
  const [previewUrlDrafts, setPreviewUrlDrafts] = useState<string[]>(initialImageUrls);
  const [bulkPreviewInput, setBulkPreviewInput] = useState("");
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [previewUrlError, setPreviewUrlError] = useState<string | null>(null);
  const [deliverySource, setDeliverySource] = useState<DeliverySource>(
    initialValues.fileUrl && !initialValues.fileKey ? "external" : "upload",
  );
  const [externalFileUrlDraft, setExternalFileUrlDraft] = useState(initialValues.fileUrl ?? "");
  const [externalFileUrlIssue, setExternalFileUrlIssue] = useState<string | null>(
    getExternalFileUrlIssue(initialValues.fileUrl ?? ""),
  );
  const [isEditingExternalFileUrl, setIsEditingExternalFileUrl] = useState(
    !initialValues.fileUrl || Boolean(getExternalFileUrlIssue(initialValues.fileUrl ?? "")),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
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
    if (!form.fileUrl && !form.fileKey) missing.push("file");
    return missing;
  }, [form.title, form.description, form.isFree, form.price, form.fileKey, form.fileUrl]);

  const completion = 4 - missingFields.length;
  const canPublish = missingFields.length === 0;
  // The draft PATCH endpoint still uses the full creator resource schema.
  // Skip opportunistic autosave calls until the form satisfies those minimums.
  const canPersistDraftSnapshot = useMemo(() => {
    if (!form.title || form.title.trim().length < 3) return false;
    if (!form.description || form.description.trim().length < 10) return false;
    if (!form.isFree && (!form.price || Number(form.price) <= 0)) return false;
    return true;
  }, [form.title, form.description, form.isFree, form.price]);

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

  const previewUrls = useMemo(() => dedupeImageUrls(previewUrlsState), [previewUrlsState]);
  const hasUploadedFile = Boolean(form.fileKey);
  const externalFileSummary = form.fileUrl ? summarizeExternalUrl(form.fileUrl) : null;

  useEffect(() => {
    if (form.fileKey) {
      setDeliverySource("upload");
      return;
    }
    if (form.fileUrl) {
      setDeliverySource("external");
    }
  }, [form.fileKey, form.fileUrl]);

  useEffect(() => {
    if (!form.fileUrl) return;
    const issue = getExternalFileUrlIssue(form.fileUrl);
    setExternalFileUrlDraft(form.fileUrl);
    setExternalFileUrlIssue(issue);
    setIsEditingExternalFileUrl(Boolean(issue));
  }, [form.fileUrl]);

  useEffect(() => {
    const coverUrl = previewUrls[0] || "";
    setForm((prev) => (prev.thumbnailUrl === coverUrl ? prev : { ...prev, thumbnailUrl: coverUrl }));
  }, [previewUrls]);

  function setPreviewUrls(next: string[]) {
    const merged = dedupeImageUrls(next);
    setPreviewUrlsState(merged);
    setPreviewUrlDrafts(merged);
  }

  function persistPreviewUrlsDraft(nextPreviewUrls: string[]) {
    if (!form.id || !canPersistDraftSnapshot) return;
    void persistCurrentFormToResource(form.id, {
      previewUrls: nextPreviewUrls,
    }).catch((persistError) => {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "ยังไม่สามารถบันทึกรายการรูปภาพได้",
      );
    });
  }

  function updatePreviewUrlDraft(index: number, value: string) {
    setPreviewUrlError(null);
    setPreviewUrlDrafts((prev) => prev.map((current, currentIndex) => (currentIndex === index ? value : current)));
  }

  function commitPreviewUrlDraft(index: number) {
    const nextDrafts = [...previewUrlDrafts];
    const trimmed = nextDrafts[index]?.trim() ?? "";

    if (!trimmed) {
      nextDrafts.splice(index, 1);
      const committed = dedupeImageUrls(nextDrafts);
      setPreviewUrlDrafts(committed);
      setPreviewUrlsState(committed);
      persistPreviewUrlsDraft(committed);
      return;
    }

    const issue = getPreviewImageUrlIssue(trimmed);
    if (issue) {
      setPreviewUrlDrafts(nextDrafts);
      return;
    }

    nextDrafts[index] = trimmed;
    const committed = dedupeImageUrls(nextDrafts);
    setPreviewUrlDrafts(committed);
    setPreviewUrlsState(committed);
    persistPreviewUrlsDraft(committed);
  }

  function addPreviewUrlDraftRow() {
    setPreviewUrlError(null);
    setPreviewUrlDrafts((prev) => [...prev, ""]);
  }

  function removePreviewUrlDraft(index: number) {
    setPreviewUrlError(null);
    const nextDrafts = previewUrlDrafts.filter((_, currentIndex) => currentIndex !== index);
    const committed = dedupeImageUrls(nextDrafts);
    setPreviewUrlDrafts(committed);
    setPreviewUrlsState(committed);
    persistPreviewUrlsDraft(committed);
  }

  function applyBulkPreviewUrls() {
    const incomingUrls = fromPreviewTextarea(bulkPreviewInput);
    const invalidUrls = incomingUrls.filter((url) => getPreviewImageUrlIssue(url));

    if (invalidUrls.length > 0) {
      setPreviewUrlError(
        "One or more image URLs can't be used yet. Use full http:// or https:// links, or a local /path image reference.",
      );
      return;
    }

    setPreviewUrlError(null);
    const nextUrls = dedupeImageUrls([...previewUrls, ...incomingUrls]);
    setPreviewUrls(nextUrls);
    persistPreviewUrlsDraft(nextUrls);
    setBulkPreviewInput("");
    setBulkPreviewOpen(false);
  }

  async function persistCurrentFormToResource(
    resourceId: string,
    overrides?: {
      previewUrls?: string[];
      fileUrl?: string | null;
    },
  ) {
    const response = await fetch(`/api/creator/resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        slug: form.slug,
        type: form.type,
        status: form.status,
        isFree: form.isFree,
        price: form.isFree ? 0 : Math.round((Number(form.price) || 0) * 100),
        categoryId: form.categoryId || null,
        fileUrl: overrides?.fileUrl !== undefined ? overrides.fileUrl : form.fileUrl || null,
        previewUrls: overrides?.previewUrls ?? previewUrls,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error ?? "ยังไม่สามารถบันทึกข้อมูลลงฉบับร่างได้");
    }
  }

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

  async function persistExternalFileUrl(nextFileUrl: string) {
    setForm((prev) => ({ ...prev, fileUrl: nextFileUrl }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.fileUrl;
      return next;
    });

    if (!form.id || !canPersistDraftSnapshot) return;

    try {
      await persistCurrentFormToResource(form.id, {
        fileUrl: nextFileUrl || null,
      });
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "ยังไม่สามารถบันทึกลิงก์ไฟล์ภายนอกได้",
      );
    }
  }

  async function saveExternalFileUrl() {
    const trimmed = externalFileUrlDraft.trim();
    const issue = getExternalFileUrlIssue(trimmed);
    setExternalFileUrlIssue(issue);

    if (!trimmed) {
      await persistExternalFileUrl("");
      setIsEditingExternalFileUrl(true);
      return;
    }

    if (issue) {
      setIsEditingExternalFileUrl(true);
      return;
    }

    await persistExternalFileUrl(trimmed);
    setExternalFileUrlDraft(trimmed);
    setIsEditingExternalFileUrl(false);
  }

  async function clearExternalFileUrl() {
    setExternalFileUrlDraft("");
    setExternalFileUrlIssue(null);
    setIsEditingExternalFileUrl(true);
    await persistExternalFileUrl("");
  }

  async function ensureDraftResourceId() {
    if (form.id) {
      return form.id;
    }

    const response = await fetch("/api/creator/resources/draft", {
      method: "POST",
    });
    const json = await response.json().catch(() => ({}));

    if (!response.ok || typeof json.id !== "string") {
      throw new Error(json.error ?? "ยังไม่สามารถสร้างฉบับร่างสำหรับอัปโหลดได้");
    }

    const resourceId = json.id as string;
    setForm((prev) => ({ ...prev, id: resourceId }));
    if (canPersistDraftSnapshot) {
      await persistCurrentFormToResource(resourceId);
    }
    return resourceId;
  }

  async function uploadImageFile(file: File): Promise<string | null> {
    setImageUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/creator/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setImageUploadError((data as { error?: string }).error ?? "อัปโหลดรูปภาพไม่สำเร็จ");
      return null;
    }

    return typeof (data as { url?: string }).url === "string"
      ? (data as { url: string }).url
      : null;
  }

  async function handlePreviewImagesUpload(
    files: File[],
    options?: {
      insertAtStart?: boolean;
    },
  ) {
    setImageUploading(true);
    setImageUploadError(null);

    try {
      const uploaded: string[] = [];

      for (const file of files) {
        const url = await uploadImageFile(file);
        if (url) {
          uploaded.push(url);
        }
      }

      if (uploaded.length > 0) {
        const nextPreviewUrls = options?.insertAtStart
          ? dedupeImageUrls([...uploaded, ...previewUrls.filter(Boolean)])
          : dedupeImageUrls([...previewUrls.filter(Boolean), ...uploaded]);
        setPreviewUrls(nextPreviewUrls);
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.previewUrls;
          return next;
        });

        const resourceId = form.id ?? (mode === "create" ? await ensureDraftResourceId() : undefined);
        if (resourceId && canPersistDraftSnapshot) {
          await persistCurrentFormToResource(resourceId, {
            previewUrls: nextPreviewUrls,
          });
        }
      }
    } finally {
      setImageUploading(false);
    }
  }

  async function handleRemoveUploadedFile() {
    if (!form.id) {
      setForm((prev) => ({ ...prev, fileKey: "", fileName: "", fileSize: null }));
      return;
    }

    const response = await fetch(`/api/creator/resources/${form.id}/file`, {
      method: "DELETE",
    });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json.error ?? "ลบไฟล์ไม่สำเร็จ");
    }

    setForm((prev) => ({
      ...prev,
      fileKey: "",
      fileName: "",
      fileSize: null,
    }));
  }

  async function handleRemovePreviewAtIndex(index: number) {
    const nextPreviewUrls = previewUrls.filter((_, currentIndex) => currentIndex !== index);

    setPreviewUrls(nextPreviewUrls);

    if (form.id) {
      if (!canPersistDraftSnapshot) return;
      await persistCurrentFormToResource(form.id, {
        previewUrls: nextPreviewUrls,
      });
    }
  }

  async function handleSetPreviewAsCover(index: number) {
    const nextPreviewUrls = [...previewUrls];
    const [selected] = nextPreviewUrls.splice(index, 1);
    nextPreviewUrls.unshift(selected);

    setPreviewUrls(nextPreviewUrls);

    if (form.id) {
      if (!canPersistDraftSnapshot) return;
      await persistCurrentFormToResource(form.id, {
        previewUrls: nextPreviewUrls,
      });
    }
  }

  async function handleReorderPreviews(nextPreviewUrls: string[]) {
    setPreviewUrls(nextPreviewUrls);

    if (form.id) {
      if (!canPersistDraftSnapshot) return;
      await persistCurrentFormToResource(form.id, {
        previewUrls: nextPreviewUrls,
      });
    }
  }

  async function submitWithStatus(status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const submittedForm = { ...form, status };
    const hasExistingDraft = Boolean(submittedForm.id);

    try {
      const response = await fetch(
        hasExistingDraft
          ? `/api/creator/resources/${submittedForm.id}`
          : "/api/creator/resources",
        {
          method: hasExistingDraft ? "PATCH" : "POST",
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
        router.push(routes.dashboardV2CreatorResources);
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
  // now driven by the merged image set. thumbnailUrl stays synced for
  // compatibility with downstream preview consumers that still read it.
  const previewThumbnail = previewUrls[0] || form.thumbnailUrl || null;
  const aiDraftResourceSeed = useMemo<CreatorAIDraftResourceSeed>(
    () => ({
      title: form.title,
      description: form.description,
      slug: form.slug,
      type: form.type,
      isFree: form.isFree,
      price: form.isFree ? 0 : Math.round((Number(form.price) || 0) * 100),
      categoryId: form.categoryId || null,
      fileUrl: form.fileUrl || null,
      previewUrls,
    }),
    [
      form.title,
      form.description,
      form.slug,
      form.type,
      form.isFree,
      form.price,
      form.categoryId,
      form.fileUrl,
      previewUrls,
    ],
  );

  function handleApplySummary(summary: string) {
    setForm((prev) => ({
      ...prev,
      description: summary,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.description;
      return next;
    });
  }

  return (
    <>
    <form onSubmit={isCreateMode ? (e) => e.preventDefault() : handleSubmit}>
      {/* ── Mobile: preview above form content ───────────────────────────── */}
      <div className="mb-6 lg:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
      <div className={isCreateMode ? "space-y-6" : "space-y-8"}>

      <CreatorAIDraftGenerator
        mode={mode}
        resourceId={form.id}
        initialDraft={initialAIDraft}
        resourceSeed={aiDraftResourceSeed}
        onApplySummary={handleApplySummary}
      />

      {/* ── Section 1: Basic info ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            {isCreateMode && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                1
              </span>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {isCreateMode ? "Basic info" : "Edit resource"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
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
            <label htmlFor={titleInputId} className="text-sm font-medium text-foreground">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id={titleInputId}
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
            <label htmlFor={slugInputId} className="text-sm font-medium text-foreground">
              Slug{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">(auto-generated if left blank)</span>
            </label>
            <Input
              id={slugInputId}
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
            <label htmlFor={descriptionInputId} className="text-sm font-medium text-foreground">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id={descriptionInputId}
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
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          {isCreateMode && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
              2
            </span>
          )}
          <h2 className="text-lg font-semibold text-foreground">Pricing and visibility</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Hide status select in create mode — sticky bar handles intent */}
          {!isCreateMode && (
            <div className="space-y-1.5">
              <label htmlFor={statusSelectId} className="text-sm font-medium text-foreground">Status</label>
              <Select
                id={statusSelectId}
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor={typeSelectId} className="text-sm font-medium text-foreground">Type</label>
            <Select
              id={typeSelectId}
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="PDF">PDF</option>
              <option value="DOCUMENT">Document</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={categorySelectId} className="text-sm font-medium text-foreground">Category</label>
            <Select
              id={categorySelectId}
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
            <label htmlFor={priceInputId} className="text-sm font-medium text-foreground">Price (THB)</label>
            <Input
              id={priceInputId}
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

        <label htmlFor={isFreeInputId} className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input
            id={isFreeInputId}
            name="isFree"
            type="checkbox"
            checked={form.isFree}
            onChange={handleChange}
            className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
          />
          Make this resource free
        </label>
      </section>

      {/* ── Section 3: Delivery and previews ─────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2">
            {isCreateMode && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                3
              </span>
            )}
            <h2 className="text-lg font-semibold text-foreground">Delivery and previews</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Set the buyer file, cover image, and preview gallery in one section.
          </p>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Images</p>
                <p className="text-sm text-muted-foreground">
                  Upload the cover first, then add extra previews or external image links.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <LazyImageDropzone
                rootTestId="preview-image-uploader"
                disabled={imageUploading}
                onFilesAccepted={(files) => {
                  void handlePreviewImagesUpload(files);
                }}
                helpText="ลากรูปภาพมาวาง หรือคลิกเพื่อเพิ่ม cover และ preview"
              />
              <PreviewImageSortableList
                images={previewUrls}
                onReorder={(next) => {
                  void handleReorderPreviews(next);
                }}
                onRemoveIndex={(index) => {
                  void handleRemovePreviewAtIndex(index);
                }}
                onSetCover={(index) => {
                  void handleSetPreviewAsCover(index);
                }}
              />
              <div className="rounded-xl border border-border bg-background/70 p-3">
                <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Image links</p>
                    <p className="text-xs text-muted-foreground">
                      Use links when some images are hosted outside Krukraft.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBulkPreviewOpen((prev) => !prev)}
                    >
                      {bulkPreviewOpen ? "Hide list" : "Paste list"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={addPreviewUrlDraftRow}
                    >
                      Add one
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  {previewUrlDrafts.length > 0 ? (
                    previewUrlDrafts.map((url, index) => (
                      <div
                        key={`preview-url-${index}`}
                        className="rounded-xl border border-border bg-background px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                              <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted px-2.5 text-[11px] text-foreground">
                                {index === 0 ? "Cover" : `Preview ${index + 1}`}
                              </span>
                              <span>
                                {index === 0 ? "Shown in marketplace cards" : "Shown in preview gallery"}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 self-start"
                            onClick={() => removePreviewUrlDraft(index)}
                            aria-label={`Remove image URL ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Input
                            id={`${previewUrlDraftPrefix}-${index}`}
                            value={url}
                            onChange={(event) => updatePreviewUrlDraft(index, event.target.value)}
                            onBlur={() => commitPreviewUrlDraft(index)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitPreviewUrlDraft(index);
                              }
                            }}
                            leftAdornment={<Link2 className="h-4 w-4" />}
                            placeholder={
                              index === 0
                                ? "Paste the cover image URL"
                                : "Paste an additional preview image URL"
                            }
                            error={getPreviewImageUrlIssue(url) ?? undefined}
                            hint={
                              getPreviewImageUrlIssue(url)
                                ? undefined
                                : index === 0
                                  ? "The first image is used as the cover."
                                  : "Additional images appear in the preview gallery."
                            }
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-brand-600">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No linked images yet</p>
                          <p className="text-xs text-muted-foreground">
                            Add a cover link or preview link only if the image is hosted elsewhere.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {bulkPreviewOpen ? (
                    <div className="rounded-xl border border-border bg-background px-3 py-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Paste image links</p>
                          <p className="text-xs text-muted-foreground">
                            Add one link per line. The first valid link becomes the cover.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={applyBulkPreviewUrls}
                          disabled={!bulkPreviewInput.trim()}
                        >
                          Apply URLs
                        </Button>
                      </div>
                      <Textarea
                        id={bulkPreviewTextareaId}
                        value={bulkPreviewInput}
                        onChange={(event) => {
                          setBulkPreviewInput(event.target.value);
                          setPreviewUrlError(null);
                        }}
                        rows={isFirstResource ? 4 : 5}
                        placeholder={"/uploads/cover.webp\nhttps://example.com/preview-2.webp"}
                        error={previewUrlError ?? undefined}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              {imageUploadError && (
                <p className="text-xs text-red-600">{imageUploadError}</p>
              )}
            </div>
            {fieldErrors.previewUrls && (
              <p className="text-xs text-red-600">{fieldErrors.previewUrls}</p>
            )}
          </div>

          <div
            ref={fileRef}
            className={`space-y-1.5 rounded-xl p-1 -m-1 transition-all duration-300${highlightedField === "file" ? " ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/60" : ""}`}
          >
            <div className="rounded-xl border border-border bg-muted p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 text-brand-600">
                  <Link2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Buyer file</p>
                  <p className="text-sm text-muted-foreground">
                    Choose how buyers receive the final file after checkout.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delivery method</p>
                      <p className="text-xs text-muted-foreground">
                        Pick one source and keep it active.
                      </p>
                    </div>
                    <div className="inline-flex rounded-xl border border-border bg-background p-1">
                      <button
                        type="button"
                        onClick={() => setDeliverySource("upload")}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          deliverySource === "upload"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliverySource("external")}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          deliverySource === "external"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Use link
                      </button>
                    </div>
                  </div>
                </div>

                {deliverySource === "upload" ? (
                  <div className="space-y-3">
                    <FileUploadWidget
                      resourceId={form.id}
                    initialFileName={form.fileName ?? null}
                    initialFileSize={form.fileSize ?? null}
                    uploadEndpoint="/api/creator/resources/upload"
                    onEnsureResourceId={ensureDraftResourceId}
                    onUploadComplete={(payload) => {
                      setDeliverySource("upload");
                      setExternalFileUrlDraft("");
                      setExternalFileUrlIssue(null);
                      setIsEditingExternalFileUrl(true);
                      setForm((prev) => ({
                        ...prev,
                        id: prev.id || payload.resourceId,
                        fileUrl: "",
                        fileKey: payload.fileKey ?? "",
                        fileName: payload.fileName ?? "",
                        fileSize: payload.fileSize ?? null,
                      }));
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.fileUrl;
                        return next;
                      });
                    }}
                    onRemoveCurrentFile={async () => {
                      try {
                        await handleRemoveUploadedFile();
                      } catch (removeError) {
                        setError(
                          removeError instanceof Error ? removeError.message : "ลบไฟล์ไม่สำเร็จ",
                        );
                      }
                    }}
                    copy={{
                      saveFirstError: "ยังไม่สามารถสร้างฉบับร่างเพื่ออัปโหลดไฟล์ได้",
                      dragAndDrop: "ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์",
                      formats: "PDF, DOCX, XLSX, ZIP หรือรูปภาพ สูงสุด 50 MB",
                      maxSize: "ขนาดไฟล์สูงสุด 50 MB",
                      replaceFile: "เปลี่ยนไฟล์",
                      uploading: "กำลังอัปโหลด…",
                      uploadFile: "อัปโหลดไฟล์",
                      uploadSuccess: "อัปโหลดไฟล์เรียบร้อยแล้ว",
                      removeFileAriaLabel: "ลบไฟล์",
                      removeSelectedFileAriaLabel: "ลบไฟล์ที่เลือก",
                    }}
                  />
                  {form.fileUrl && !hasUploadedFile ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-3.5">
                      <p className="text-sm font-medium text-foreground">An external link is saved</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploading a file here will replace the current external URL as the active delivery source.
                      </p>
                    </div>
                  ) : null}
                </div>
                ) : (
                  <div className="space-y-4 border-t border-border/80 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">External file link</p>
                        <p className="text-xs text-muted-foreground">
                          Use this only when the buyer file is hosted outside Krukraft.
                        </p>
                      </div>
                      {form.fileUrl && !isEditingExternalFileUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => {
                            void clearExternalFileUrl();
                          }}
                        >
                          Clear link
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-2.5">
                      {hasUploadedFile ? (
                        <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">Uploaded file is still active</p>
                              <p className="text-xs text-muted-foreground">
                                Remove the uploaded file first if you want buyers to use an external URL instead.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await handleRemoveUploadedFile();
                                } catch (removeError) {
                                  setError(
                                    removeError instanceof Error
                                      ? removeError.message
                                      : "ลบไฟล์ไม่สำเร็จ",
                                  );
                                }
                              }}
                            >
                              Remove uploaded file
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {isEditingExternalFileUrl || !form.fileUrl ? (
                            <div className="rounded-xl border border-border bg-background px-4 py-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                                  <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted px-2.5 text-[11px] text-foreground">
                                    External
                                  </span>
                                  <span>Direct download link for the buyer file</span>
                                </div>
                                <Input
                                  id={externalFileUrlInputId}
                                  name="externalFileUrl"
                                  value={externalFileUrlDraft}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setExternalFileUrlDraft(nextValue);
                                    setExternalFileUrlIssue(getExternalFileUrlIssue(nextValue));
                                  }}
                                  onBlur={() => {
                                    void saveExternalFileUrl();
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      void saveExternalFileUrl();
                                    }
                                  }}
                                  className="mt-3"
                                  leftAdornment={<Link2 className="h-4 w-4" />}
                                  placeholder="Paste an external file URL, e.g. https://example.com/worksheet.pdf"
                                  error={externalFileUrlIssue ?? fieldErrors.fileUrl}
                                />
                                {!externalFileUrlIssue && !fieldErrors.fileUrl ? (
                                  <p className="text-xs text-muted-foreground">
                                    Use one direct download link. Press Enter or click away to save.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ) : externalFileSummary ? (
                            <div className="rounded-xl border border-border bg-background px-4 py-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex items-start gap-3">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted px-2.5 text-[11px] font-medium text-foreground">
                                        External
                                      </span>
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {externalFileSummary.host}
                                      </p>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {externalFileSummary.path}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setExternalFileUrlDraft(form.fileUrl);
                                      setExternalFileUrlIssue(null);
                                      setIsEditingExternalFileUrl(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button type="button" variant="secondary" size="sm" asChild>
                                    <a href={form.fileUrl} target="_blank" rel="noreferrer">
                                      Open link
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-4">
                              <p className="text-sm text-muted-foreground">
                                Add one direct download URL for the buyer file.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
              )}
              </div>
            </div>
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

      {/* ── Edit mode: save actions ──────────────────────────────────────── */}
      {!isCreateMode && (
        <section
          aria-label="Resource editing actions"
          className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              {error ? (
                <p className="text-sm text-danger-700">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Save changes to update this listing.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push(routes.dashboardV2CreatorResources)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                Save changes
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Create mode: publish actions ─────────────────────────────────── */}
      {isCreateMode && (
        <CreatorPublishActions
          canPublish={canPublish}
          saving={saving}
          error={error}
          onSaveDraft={() => submitWithStatus("DRAFT")}
          onPublish={() => submitWithStatus("PUBLISHED")}
          onCancel={() => router.push(routes.dashboardV2CreatorResources)}
          onPreview={() => setPreviewOpen(true)}
        />
      )}

      </div> {/* end left column */}

      {/* ── Right column: sticky preview (desktop only) ───────────────────── */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        fileName: form.fileName || null,
        fileSize: form.fileSize ?? null,
        hasPrivateFile: Boolean(form.fileKey),
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
