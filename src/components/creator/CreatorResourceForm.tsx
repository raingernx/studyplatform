"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "@/design-system";
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
}

interface CreatorResourceFormProps {
  mode: "create" | "edit";
  categories: CreatorResourceFormCategory[];
  initialValues?: CreatorResourceFormValues;
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
}: CreatorResourceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreatorResourceFormValues>(initialValues);
  const [previewInput, setPreviewInput] = useState(toPreviewTextarea(initialValues.previewUrls));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/creator/resources"
          : `/api/creator/resources/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
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
            fileUrl: form.fileUrl || null,
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

      router.push(routes.creatorResources);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Network error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            {mode === "create" ? "New resource" : "Edit resource"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the details learners will see in the marketplace.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Title</label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="My study guide"
            />
            {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Slug</label>
            <Input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="my-study-guide"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Description</label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Explain what learners get and who this resource is for."
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-600">{fieldErrors.description}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Pricing and visibility</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Price (THB)</label>
            <Input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              disabled={form.isFree}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-neutral-50"
              placeholder="99"
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

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Delivery and previews</h2>
        <div className="mt-5 grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">File URL</label>
            <Input
              name="fileUrl"
              value={form.fileUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />
            <p className="text-xs text-neutral-400">
              Use a direct downloadable file URL. Private uploads remain an admin-only flow today.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Preview image URLs</label>
            <Textarea
              value={previewInput}
              onChange={(event) => setPreviewInput(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder={"/uploads/preview-cover.webp\nhttps://example.com/preview-2.webp"}
            />
            <p className="text-xs text-neutral-400">
              One image URL per line. The first image becomes the card thumbnail and detail preview.
            </p>
            {fieldErrors.previewUrls && (
              <p className="text-xs text-red-600">{fieldErrors.previewUrls}</p>
            )}
          </div>
        </div>
      </section>

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
            {mode === "create" ? "Create resource" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
