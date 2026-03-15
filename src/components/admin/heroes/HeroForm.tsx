"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";

const HERO_MEDIA_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
const HERO_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const HERO_TYPES = [
  { value: "fallback", label: "Fallback" },
  { value: "featured", label: "Featured" },
  { value: "promotion", label: "Promotion" },
  { value: "seasonal", label: "Seasonal" },
  { value: "search", label: "Search" },
] as const;

type HeroTypeValue = (typeof HERO_TYPES)[number]["value"];
type MediaTypeValue = "" | "image" | "gif";

export interface HeroFormValues {
  name: string;
  type: HeroTypeValue;
  title: string;
  subtitle: string;
  badgeText: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageUrl: string;
  mediaUrl: string;
  mediaType: MediaTypeValue;
  priority: number;
  weight: number;
  experimentId: string;
  variant: string;
  abGroup: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface HeroFormProps {
  mode: "create" | "edit";
  heroId?: string;
  initialValues: HeroFormValues;
  isFallback?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs text-red-600">{message}</p>;
}

function getPreviewSrc(values: HeroFormValues) {
  const mediaUrl = values.mediaUrl.trim();
  const imageUrl = values.imageUrl.trim();
  return mediaUrl || imageUrl || null;
}

export function HeroForm({ mode, heroId, initialValues, isFallback = false }: HeroFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<HeroFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewSrc = useMemo(() => getPreviewSrc(values), [values]);
  const visibleHeroTypes = isFallback
    ? HERO_TYPES
    : HERO_TYPES.filter((type) => type.value !== "fallback");

  function updateValue<K extends keyof HeroFormValues>(key: K, value: HeroFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function buildPayload() {
    return {
      ...(mode === "edit" && heroId ? { id: heroId } : {}),
      name: values.name,
      type: values.type,
      title: values.title,
      subtitle: values.subtitle || null,
      badgeText: values.badgeText || null,
      primaryCtaText: values.primaryCtaText || null,
      primaryCtaLink: values.primaryCtaLink || null,
      secondaryCtaText: values.secondaryCtaText || null,
      secondaryCtaLink: values.secondaryCtaLink || null,
      imageUrl: values.imageUrl || null,
      mediaUrl: values.mediaUrl || null,
      mediaType: values.mediaType || null,
      priority: Number.isFinite(values.priority) ? values.priority : 0,
      weight: Number.isFinite(values.weight) ? values.weight : 1,
      experimentId: values.experimentId || null,
      variant: values.variant || null,
      abGroup: values.abGroup || null,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
      isActive: values.isActive,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const res = await fetch("/api/admin/heroes", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.fields ?? data.details?.fieldErrors ?? {});
        toast.error(data.error ?? `Failed to ${mode} hero.`);
        return;
      }

      toast.success(mode === "create" ? "Hero created." : "Hero updated.");
      router.push(routes.adminHeroes);
      router.refresh();
    } catch {
      toast.error(`Failed to ${mode} hero.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleMediaUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > HERO_MEDIA_MAX_BYTES) {
      toast.error("File too large. Maximum size is 5 MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }

      updateValue("mediaUrl", data.url ?? "");
      updateValue("mediaType", file.type === "image/gif" ? "gif" : "image");
      toast.success("Hero media uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveMedia() {
    updateValue("mediaUrl", "");
    updateValue("mediaType", "");
  }

  return (
    <AdminFormLayout
      form={
        <Card className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-8 pb-8 shadow-sm">
          <form className="space-y-8 pt-8" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-text-primary">
                {mode === "create" ? "Create Hero" : "Edit Hero"}
              </h2>
              <p className="text-sm text-text-secondary">
                {isFallback
                  ? "Edit the protected fallback hero that keeps the homepage populated when no campaign hero is eligible."
                  : "Configure a marketing hero without affecting the protected fallback hero."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-name">
                  Name
                </label>
                <Input
                  id="hero-name"
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  placeholder="Back to school campaign"
                />
                <FieldError message={errors.name} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-type">
                  Type
                </label>
                <Select
                  id="hero-type"
                  value={values.type}
                  disabled={isFallback}
                  onChange={(event) =>
                    updateValue("type", event.target.value as HeroTypeValue)
                  }
                >
                  {visibleHeroTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.type} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-title">
                  Title
                </label>
                <Input
                  id="hero-title"
                  value={values.title}
                  onChange={(event) => updateValue("title", event.target.value)}
                  placeholder="Discover beautiful study resources"
                />
                <FieldError message={errors.title} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-subtitle">
                  Subtitle
                </label>
                <Textarea
                  id="hero-subtitle"
                  rows={3}
                  value={values.subtitle}
                  onChange={(event) => updateValue("subtitle", event.target.value)}
                  placeholder="Worksheets, flashcards, and study guides from educators and creators."
                  className="min-h-[96px]"
                />
                <FieldError message={errors.subtitle} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-badge">
                  Badge Text
                </label>
                <Input
                  id="hero-badge"
                  value={values.badgeText}
                  onChange={(event) => updateValue("badgeText", event.target.value)}
                  placeholder="Trusted by 12,000+ educators"
                />
                <FieldError message={errors.badgeText} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-primary-cta-text">
                  Primary CTA Text
                </label>
                <Input
                  id="hero-primary-cta-text"
                  value={values.primaryCtaText}
                  onChange={(event) => updateValue("primaryCtaText", event.target.value)}
                  placeholder="Browse resources"
                />
                <FieldError message={errors.primaryCtaText} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-primary-cta-link">
                  Primary CTA Link
                </label>
                <Input
                  id="hero-primary-cta-link"
                  value={values.primaryCtaLink}
                  onChange={(event) => updateValue("primaryCtaLink", event.target.value)}
                  placeholder="/resources"
                />
                <FieldError message={errors.primaryCtaLink} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-secondary-cta-text">
                  Secondary CTA Text
                </label>
                <Input
                  id="hero-secondary-cta-text"
                  value={values.secondaryCtaText}
                  onChange={(event) => updateValue("secondaryCtaText", event.target.value)}
                  placeholder="Start selling"
                />
                <FieldError message={errors.secondaryCtaText} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-secondary-cta-link">
                  Secondary CTA Link
                </label>
                <Input
                  id="hero-secondary-cta-link"
                  value={values.secondaryCtaLink}
                  onChange={(event) => updateValue("secondaryCtaLink", event.target.value)}
                  placeholder="/membership"
                />
                <FieldError message={errors.secondaryCtaLink} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-image-url">
                  Image URL
                </label>
                <Input
                  id="hero-image-url"
                  value={values.imageUrl}
                  onChange={(event) => updateValue("imageUrl", event.target.value)}
                  placeholder="https://example.com/hero.jpg"
                />
                <FieldError message={errors.imageUrl} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-media-url">
                  Uploaded Media URL
                </label>
                <Input
                  id="hero-media-url"
                  value={values.mediaUrl}
                  onChange={(event) => updateValue("mediaUrl", event.target.value)}
                  placeholder="/uploads/hero-banner.webp"
                />
                <FieldError message={errors.mediaUrl} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-media-type">
                  Media Type
                </label>
                <Select
                  id="hero-media-type"
                  value={values.mediaType}
                  onChange={(event) =>
                    updateValue("mediaType", event.target.value as MediaTypeValue)
                  }
                >
                  <option value="">Auto / none</option>
                  <option value="image">Image</option>
                  <option value="gif">GIF</option>
                </Select>
                <FieldError message={errors.mediaType} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-priority">
                  Priority
                </label>
                <Input
                  id="hero-priority"
                  type="number"
                  value={String(values.priority)}
                  disabled={isFallback}
                  onChange={(event) =>
                    updateValue("priority", Number.parseInt(event.target.value || "0", 10))
                  }
                />
                <FieldError message={errors.priority} />
                {isFallback ? (
                  <p className="text-xs text-text-muted">Fallback hero priority is managed automatically.</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-weight">
                  Weight
                </label>
                <Input
                  id="hero-weight"
                  type="number"
                  min={1}
                  value={String(values.weight)}
                  disabled={isFallback}
                  onChange={(event) =>
                    updateValue("weight", Number.parseInt(event.target.value || "1", 10))
                  }
                />
                <FieldError message={errors.weight} />
                {isFallback ? (
                  <p className="text-xs text-text-muted">Fallback hero does not participate in weighted rotation.</p>
                ) : null}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-experiment-id">
                  Experiment ID
                </label>
                <Input
                  id="hero-experiment-id"
                  value={values.experimentId}
                  disabled={isFallback}
                  onChange={(event) => updateValue("experimentId", event.target.value)}
                  placeholder="Optional experiment key, e.g. spring-sale"
                />
                <FieldError message={errors.experimentId} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-variant">
                  Variant
                </label>
                <Input
                  id="hero-variant"
                  value={values.variant}
                  disabled={isFallback}
                  onChange={(event) => updateValue("variant", event.target.value)}
                  placeholder="Optional variant label, e.g. A"
                />
                <FieldError message={errors.variant} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-ab-group">
                  Legacy A/B Group
                </label>
                <Input
                  id="hero-ab-group"
                  value={values.abGroup}
                  disabled={isFallback}
                  onChange={(event) => updateValue("abGroup", event.target.value)}
                  placeholder="Optional group key, e.g. test-a"
                />
                <FieldError message={errors.abGroup} />
                {isFallback ? (
                  <p className="text-xs text-text-muted">Fallback hero is excluded from A/B testing.</p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Optional legacy grouping key. Prefer Experiment ID + Variant for new tests.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-start-date">
                  Start Date
                </label>
                <Input
                  id="hero-start-date"
                  type="datetime-local"
                  value={values.startDate}
                  disabled={isFallback}
                  onChange={(event) => updateValue("startDate", event.target.value)}
                />
                <FieldError message={errors.startDate} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary" htmlFor="hero-end-date">
                  End Date
                </label>
                <Input
                  id="hero-end-date"
                  type="datetime-local"
                  value={values.endDate}
                  disabled={isFallback}
                  onChange={(event) => updateValue("endDate", event.target.value)}
                />
                <FieldError message={errors.endDate} />
                {isFallback ? (
                  <p className="text-xs text-text-muted">Fallback hero stays available whenever no campaign hero qualifies.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-text-primary">Active</span>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                  <Switch
                    checked={values.isActive}
                    disabled={isFallback}
                    onCheckedChange={(checked) => updateValue("isActive", checked)}
                  />
                  <span className="text-sm text-text-secondary">
                    {isFallback
                      ? "Always active as the homepage safety net"
                      : values.isActive
                        ? "Enabled on homepage rotation"
                        : "Disabled"}
                  </span>
                </div>
                <FieldError message={errors.isActive} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-text-primary">
                  Upload media
                </span>
                <p className="text-xs text-text-muted">
                  PNG, JPG, JPEG, WEBP, GIF. Max 5 MB. Uploaded media overrides Image URL on the homepage.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={HERO_MEDIA_ACCEPT}
                  className="hidden"
                  onChange={handleMediaUpload}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload image or GIF"}
                  </Button>
                  {values.mediaUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveMedia}
                    >
                      <X className="h-4 w-4" />
                      Remove media
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-surface-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(routes.adminHeroes)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {mode === "create" ? "Create Hero" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      }
      sidebar={
        <>
          <Card className="p-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
                  Live Preview
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  This mirrors the current HeroBanner contract without changing the homepage component.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-surface-200 bg-surface-100">
                <div className="relative min-h-[220px] bg-zinc-900">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/60">
                      <ImagePlus className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                  <div className="relative flex min-h-[220px] flex-col justify-end gap-3 p-5 text-white">
                    <p className="text-xs text-white/70">
                      {values.badgeText || "Optional badge text"}
                    </p>
                    <h3 className="font-display text-2xl font-semibold leading-tight">
                      {values.title || "Hero title"}
                    </h3>
                    <p className="text-sm text-white/85">
                      {values.subtitle || "Hero subtitle"}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900">
                        {values.primaryCtaText || "Primary CTA"}
                      </span>
                      {values.secondaryCtaText ? (
                        <span className="rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold">
                          {values.secondaryCtaText}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
                Render Rules
              </p>
              <div className="space-y-2 text-sm text-text-secondary">
                <p>Heroes render only when active and inside their schedule window.</p>
                <p>Lower priority values render first when multiple heroes are eligible.</p>
                <p>Weight distributes traffic within the same priority and A/B group bucket.</p>
                <p>If no campaign hero qualifies, the protected fallback hero in Marketing → Heroes is used.</p>
              </div>
            </div>
          </Card>
        </>
      }
    />
  );
}
