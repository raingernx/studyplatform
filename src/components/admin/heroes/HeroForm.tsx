"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  Input,
  PageContent,
  PickerActionButton,
  PickerActions,
  Select,
  Switch,
  Textarea,
} from "@/design-system";
import { HeroSurface } from "@/components/marketplace/HeroSurface";
import {
  HERO_COLOR_TOKEN_OPTIONS,
  HERO_STYLE_DEFAULTS,
  HERO_STYLE_OPTIONS,
  type HeroColorTokenOption,
  type HeroBadgeBgColor,
  type HeroBadgeTextColor,
  type HeroBodyFont,
  type HeroContentWidth,
  type HeroHeadingFont,
  type HeroHeight,
  type HeroMobileSubtitleSize,
  type HeroMobileTitleSize,
  type HeroOverlayColor,
  type HeroPrimaryCtaColor,
  type HeroPrimaryCtaVariant,
  type HeroSecondaryCtaColor,
  type HeroSecondaryCtaVariant,
  type HeroSpacingPreset,
  type HeroSubtitleColor,
  type HeroSubtitleSize,
  type HeroSubtitleWeight,
  type HeroTextAlign,
  type HeroTitleColor,
  type HeroTitleSize,
  type HeroTitleWeight,
} from "@/lib/heroes/hero-style";

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
  textAlign: HeroTextAlign;
  contentWidth: HeroContentWidth;
  heroHeight: HeroHeight;
  spacingPreset: HeroSpacingPreset;
  headingFont: HeroHeadingFont;
  bodyFont: HeroBodyFont;
  titleSize: HeroTitleSize;
  subtitleSize: HeroSubtitleSize;
  titleWeight: HeroTitleWeight;
  subtitleWeight: HeroSubtitleWeight;
  mobileTitleSize: HeroMobileTitleSize;
  mobileSubtitleSize: HeroMobileSubtitleSize;
  titleColor: HeroTitleColor;
  subtitleColor: HeroSubtitleColor;
  badgeTextColor: HeroBadgeTextColor;
  badgeBgColor: HeroBadgeBgColor;
  primaryCtaVariant: HeroPrimaryCtaVariant;
  secondaryCtaVariant: HeroSecondaryCtaVariant;
  primaryCtaColor: HeroPrimaryCtaColor;
  secondaryCtaColor: HeroSecondaryCtaColor;
  overlayColor: HeroOverlayColor;
  overlayOpacity: number;
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

function HeroColorField<T extends string>({
  label,
  name,
  value,
  options,
  helper,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: readonly HeroColorTokenOption<T>[];
  helper?: string;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-text-primary">{label}</legend>
      {helper ? <p className="text-xs text-text-secondary">{helper}</p> : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = option.value === value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                checked
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn("h-5 w-5 shrink-0 rounded-full", option.swatchClassName)}
              />
              <span className="min-w-0 text-sm font-medium text-text-primary">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function buildPreviewConfig(values: HeroFormValues) {
  return {
    title: values.title,
    subtitle: values.subtitle,
    badgeText: values.badgeText || null,
    primaryCtaText: values.primaryCtaText,
    primaryCtaLink: values.primaryCtaLink,
    secondaryCtaText: values.secondaryCtaText || null,
    secondaryCtaLink: values.secondaryCtaLink || null,
    imageUrl: values.imageUrl || null,
    mediaUrl: values.mediaUrl || null,
    mediaType: values.mediaType || null,
    textAlign: values.textAlign,
    contentWidth: values.contentWidth,
    heroHeight: values.heroHeight,
    spacingPreset: values.spacingPreset,
    headingFont: values.headingFont,
    bodyFont: values.bodyFont,
    titleSize: values.titleSize,
    subtitleSize: values.subtitleSize,
    titleWeight: values.titleWeight,
    subtitleWeight: values.subtitleWeight,
    mobileTitleSize: values.mobileTitleSize,
    mobileSubtitleSize: values.mobileSubtitleSize,
    titleColor: values.titleColor,
    subtitleColor: values.subtitleColor,
    badgeTextColor: values.badgeTextColor,
    badgeBgColor: values.badgeBgColor,
    primaryCtaVariant: values.primaryCtaVariant,
    secondaryCtaVariant: values.secondaryCtaVariant,
    primaryCtaColor: values.primaryCtaColor,
    secondaryCtaColor: values.secondaryCtaColor,
    overlayColor: values.overlayColor,
    overlayOpacity: values.overlayOpacity,
  };
}

export function HeroForm({ mode, heroId, initialValues, isFallback = false }: HeroFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<HeroFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewConfig = useMemo(() => buildPreviewConfig(values), [values]);
  const visibleHeroTypes = isFallback
    ? HERO_TYPES
    : HERO_TYPES.filter((type) => type.value !== "fallback");
  const secondaryCtaColorOptions = useMemo(
    () =>
      values.secondaryCtaVariant === "secondary"
        ? HERO_COLOR_TOKEN_OPTIONS.secondaryCtaColor
        : HERO_COLOR_TOKEN_OPTIONS.secondaryCtaColor.filter(
            (option) => option.value !== "dark",
          ),
    [values.secondaryCtaVariant],
  );

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
      textAlign: values.textAlign,
      contentWidth: values.contentWidth,
      heroHeight: values.heroHeight,
      spacingPreset: values.spacingPreset,
      headingFont: values.headingFont,
      bodyFont: values.bodyFont,
      titleSize: values.titleSize,
      subtitleSize: values.subtitleSize,
      titleWeight: values.titleWeight,
      subtitleWeight: values.subtitleWeight,
      mobileTitleSize: values.mobileTitleSize,
      mobileSubtitleSize: values.mobileSubtitleSize,
      titleColor: values.titleColor,
      subtitleColor: values.subtitleColor,
      badgeTextColor: values.badgeTextColor,
      badgeBgColor: values.badgeBgColor,
      primaryCtaVariant: values.primaryCtaVariant,
      secondaryCtaVariant: values.secondaryCtaVariant,
      primaryCtaColor: values.primaryCtaColor,
      secondaryCtaColor: values.secondaryCtaColor,
      overlayColor: values.overlayColor,
      overlayOpacity: values.overlayOpacity,
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
    <PageContent className="space-y-6">
      <aside className="min-w-0">
        <Card className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="space-y-1 border-b border-surface-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
              Live Preview
            </p>
            <p className="text-sm text-text-secondary">
              This uses the same hero surface contract as the public discover hero.
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <HeroSurface config={previewConfig} className="rounded-[1.25rem]" />
          </div>
        </Card>
      </aside>

      <div className="min-w-0 space-y-6">
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
                <PickerActions>
                  <PickerActionButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload image or GIF"}
                  </PickerActionButton>
                  {values.mediaUrl ? (
                    <PickerActionButton
                      type="button"
                      tone="danger"
                      onClick={handleRemoveMedia}
                    >
                      <X className="h-4 w-4" />
                      Remove media
                    </PickerActionButton>
                  ) : null}
                </PickerActions>
              </div>
            </div>

            <div className="space-y-4 border-t border-surface-100 pt-8">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Layout</h3>
                <p className="text-xs text-text-secondary">
                  Control alignment, content width, hero height, and spacing without breaking the layout.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-text-align">
                    Text Alignment
                  </label>
                  <Select
                    id="hero-text-align"
                    value={values.textAlign}
                    onChange={(event) =>
                      updateValue("textAlign", event.target.value as HeroTextAlign)
                    }
                  >
                    {HERO_STYLE_OPTIONS.textAlign.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-content-width">
                    Content Width
                  </label>
                  <Select
                    id="hero-content-width"
                    value={values.contentWidth}
                    onChange={(event) =>
                      updateValue("contentWidth", event.target.value as HeroContentWidth)
                    }
                  >
                    {HERO_STYLE_OPTIONS.contentWidth.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-height">
                    Hero Height
                  </label>
                  <Select
                    id="hero-height"
                    value={values.heroHeight}
                    onChange={(event) =>
                      updateValue("heroHeight", event.target.value as HeroHeight)
                    }
                  >
                    {HERO_STYLE_OPTIONS.heroHeight.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-spacing-preset">
                    Vertical Spacing
                  </label>
                  <Select
                    id="hero-spacing-preset"
                    value={values.spacingPreset}
                    onChange={(event) =>
                      updateValue("spacingPreset", event.target.value as HeroSpacingPreset)
                    }
                  >
                    {HERO_STYLE_OPTIONS.spacingPreset.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-surface-100 pt-8">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Typography</h3>
                <p className="text-xs text-text-secondary">
                  Use bounded font and size presets so the hero stays responsive and readable.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-heading-font">
                    Heading Font
                  </label>
                  <Select
                    id="hero-heading-font"
                    value={values.headingFont}
                    onChange={(event) =>
                      updateValue("headingFont", event.target.value as HeroHeadingFont)
                    }
                  >
                    {HERO_STYLE_OPTIONS.headingFont.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-body-font">
                    Body Font
                  </label>
                  <Select
                    id="hero-body-font"
                    value={values.bodyFont}
                    onChange={(event) =>
                      updateValue("bodyFont", event.target.value as HeroBodyFont)
                    }
                  >
                    {HERO_STYLE_OPTIONS.bodyFont.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-title-size">
                    Title Size
                  </label>
                  <Select
                    id="hero-title-size"
                    value={values.titleSize}
                    onChange={(event) =>
                      updateValue("titleSize", event.target.value as HeroTitleSize)
                    }
                  >
                    {HERO_STYLE_OPTIONS.titleSize.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-subtitle-size">
                    Subtitle Size
                  </label>
                  <Select
                    id="hero-subtitle-size"
                    value={values.subtitleSize}
                    onChange={(event) =>
                      updateValue("subtitleSize", event.target.value as HeroSubtitleSize)
                    }
                  >
                    {HERO_STYLE_OPTIONS.subtitleSize.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-title-weight">
                    Title Weight
                  </label>
                  <Select
                    id="hero-title-weight"
                    value={values.titleWeight}
                    onChange={(event) =>
                      updateValue("titleWeight", event.target.value as HeroTitleWeight)
                    }
                  >
                    {HERO_STYLE_OPTIONS.titleWeight.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-subtitle-weight">
                    Subtitle Weight
                  </label>
                  <Select
                    id="hero-subtitle-weight"
                    value={values.subtitleWeight}
                    onChange={(event) =>
                      updateValue("subtitleWeight", event.target.value as HeroSubtitleWeight)
                    }
                  >
                    {HERO_STYLE_OPTIONS.subtitleWeight.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-mobile-title-size">
                    Mobile Title Size
                  </label>
                  <Select
                    id="hero-mobile-title-size"
                    value={values.mobileTitleSize}
                    onChange={(event) =>
                      updateValue("mobileTitleSize", event.target.value as HeroMobileTitleSize)
                    }
                  >
                    {HERO_STYLE_OPTIONS.mobileTitleSize.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-mobile-subtitle-size">
                    Mobile Subtitle Size
                  </label>
                  <Select
                    id="hero-mobile-subtitle-size"
                    value={values.mobileSubtitleSize}
                    onChange={(event) =>
                      updateValue(
                        "mobileSubtitleSize",
                        event.target.value as HeroMobileSubtitleSize,
                      )
                    }
                  >
                    {HERO_STYLE_OPTIONS.mobileSubtitleSize.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-surface-100 pt-8">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Colors</h3>
                <p className="text-xs text-text-secondary">
                  Choose from curated token-based colors so text stays on-brand and easy to read.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <HeroColorField
                  label="Title Color"
                  name="hero-title-color"
                  value={values.titleColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.titleColor}
                  helper="Use a strong high-contrast title tone for the hero headline."
                  onChange={(value) => updateValue("titleColor", value as HeroTitleColor)}
                />
                <HeroColorField
                  label="Subtitle Color"
                  name="hero-subtitle-color"
                  value={values.subtitleColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.subtitleColor}
                  helper="Subtitle colors are tuned for readable supporting copy."
                  onChange={(value) =>
                    updateValue("subtitleColor", value as HeroSubtitleColor)
                  }
                />
                <HeroColorField
                  label="Badge Text Color"
                  name="hero-badge-text-color"
                  value={values.badgeTextColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.badgeTextColor}
                  helper="Badge text should stay short and high contrast."
                  onChange={(value) =>
                    updateValue("badgeTextColor", value as HeroBadgeTextColor)
                  }
                />
                <HeroColorField
                  label="Badge Background"
                  name="hero-badge-bg-color"
                  value={values.badgeBgColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.badgeBgColor}
                  helper="Pick a small supporting surface that still reads over media."
                  onChange={(value) =>
                    updateValue("badgeBgColor", value as HeroBadgeBgColor)
                  }
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-surface-100 pt-8">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Buttons</h3>
                <p className="text-xs text-text-secondary">
                  CTA styles are limited to approved design-system button variants.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-primary-cta-variant">
                    Primary CTA Style
                  </label>
                  <Select
                    id="hero-primary-cta-variant"
                    value={values.primaryCtaVariant}
                    onChange={(event) =>
                      updateValue(
                        "primaryCtaVariant",
                        event.target.value as HeroPrimaryCtaVariant,
                      )
                    }
                  >
                    {HERO_STYLE_OPTIONS.primaryCtaVariant.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-secondary-cta-variant">
                    Secondary CTA Style
                  </label>
                  <Select
                    id="hero-secondary-cta-variant"
                    value={values.secondaryCtaVariant}
                    onChange={(event) => {
                      const nextVariant = event.target.value as HeroSecondaryCtaVariant;

                      setValues((prev) => ({
                        ...prev,
                        secondaryCtaVariant: nextVariant,
                        secondaryCtaColor:
                          (nextVariant === "outline" || nextVariant === "ghost") &&
                          prev.secondaryCtaColor === "dark"
                            ? "white"
                            : prev.secondaryCtaColor,
                      }));
                    }}
                  >
                    {HERO_STYLE_OPTIONS.secondaryCtaVariant.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <HeroColorField
                  label="Primary CTA Color"
                  name="hero-primary-cta-color"
                  value={values.primaryCtaColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.primaryCtaColor}
                  helper="Filled primary CTA colors always use system-controlled text contrast."
                  onChange={(value) =>
                    updateValue("primaryCtaColor", value as HeroPrimaryCtaColor)
                  }
                />
                <HeroColorField
                  label="Secondary CTA Color"
                  name="hero-secondary-cta-color"
                  value={values.secondaryCtaColor}
                  options={secondaryCtaColorOptions}
                  helper="Outline and ghost styles only show compatible high-contrast color presets."
                  onChange={(value) =>
                    updateValue("secondaryCtaColor", value as HeroSecondaryCtaColor)
                  }
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-surface-100 pt-8">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Background & Overlay</h3>
                <p className="text-xs text-text-secondary">
                  Keep media readable with a controlled overlay color and bounded opacity.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <HeroColorField
                  label="Overlay Color"
                  name="hero-overlay-color"
                  value={values.overlayColor}
                  options={HERO_COLOR_TOKEN_OPTIONS.overlayColor}
                  helper="Overlay colors are limited to a few safe tones for readable text over media."
                  onChange={(value) =>
                    updateValue("overlayColor", value as HeroOverlayColor)
                  }
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary" htmlFor="hero-overlay-opacity">
                    Overlay Opacity ({values.overlayOpacity}%)
                  </label>
                  <input
                    id="hero-overlay-opacity"
                    type="range"
                    min={0}
                    max={80}
                    step={5}
                    value={values.overlayOpacity}
                    onChange={(event) =>
                      updateValue(
                        "overlayOpacity",
                        Number.parseInt(event.target.value || String(HERO_STYLE_DEFAULTS.overlayOpacity), 10),
                      )
                    }
                    className="h-10 w-full accent-brand-600"
                  />
                  <p className="text-xs text-text-muted">
                    Use higher opacity for light media or lower opacity for dark, high-contrast artwork.
                  </p>
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
      </div>
    </PageContent>
  );
}
