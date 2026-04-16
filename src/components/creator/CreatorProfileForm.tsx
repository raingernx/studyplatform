"use client";

import type { CreatorStatus } from "@prisma/client";
import Link from "next/link";
import { Camera, CheckCircle2, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Badge, Button, Input, Select, Textarea } from "@/design-system";
import { routes } from "@/lib/routes";

interface CreatorProfileFormProps {
  profile: {
    name: string | null;
    email: string | null;
    creatorDisplayName: string | null;
    creatorSlug: string | null;
    creatorBio: string | null;
    creatorAvatar: string | null;
    creatorBanner: string | null;
    creatorStatus: CreatorStatus;
    socialLinks: {
      website?: string;
      twitter?: string;
      instagram?: string;
      youtube?: string;
      linkedin?: string;
    };
    image: string | null;
  };
}

const PANEL_CLASS = "rounded-2xl border border-border bg-card shadow-card";
const PANEL_BODY_CLASS = "space-y-6 p-6";
const SUPPORT_PANEL_CLASS = "rounded-2xl border border-border bg-muted p-4";
const LABEL_CLASS = "text-sm font-medium text-foreground";
const SUPPORTING_COPY_CLASS = "text-sm text-muted-foreground";
const SUBSECTION_TITLE_CLASS = "text-base font-semibold text-foreground";
const FEEDBACK_ERROR_CLASS =
  "rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700";

function buildCreatorProfileFormState(profile: CreatorProfileFormProps["profile"]) {
  return {
    creatorDisplayName: profile.creatorDisplayName ?? "",
    creatorSlug: profile.creatorSlug ?? "",
    creatorBio: profile.creatorBio ?? "",
    creatorAvatar: profile.creatorAvatar ?? "",
    creatorBanner: profile.creatorBanner ?? "",
    creatorStatus: profile.creatorStatus ?? "ACTIVE",
    website: profile.socialLinks.website ?? "",
    twitter: profile.socialLinks.twitter ?? "",
    instagram: profile.socialLinks.instagram ?? "",
    youtube: profile.socialLinks.youtube ?? "",
    linkedin: profile.socialLinks.linkedin ?? "",
  };
}

export function CreatorProfileForm({ profile }: CreatorProfileFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const initialFormState = useMemo(() => buildCreatorProfileFormState(profile), [profile]);
  const [form, setForm] = useState(initialFormState);
  const [savedFormState, setSavedFormState] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bannerPreviewError, setBannerPreviewError] = useState(false);
  const [assetStatus, setAssetStatus] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<"avatar" | "banner" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const formDisabled = !isHydrated || saving;
  const assetControlsDisabled = !isHydrated || saving || Boolean(uploadingAsset);
  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedFormState),
    [form, savedFormState],
  );
  const avatarHasUnsavedChanges = form.creatorAvatar !== savedFormState.creatorAvatar;
  const bannerHasUnsavedChanges = form.creatorBanner !== savedFormState.creatorBanner;

  const normalizedSlugPreview = useMemo(() => {
    const trimmed = form.creatorSlug.trim();
    if (!trimmed) {
      return "";
    }

    return trimmed
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }, [form.creatorSlug]);

  const completionChecks = useMemo(
    () => [
      Boolean(form.creatorDisplayName.trim()),
      Boolean(normalizedSlugPreview),
      Boolean(form.creatorBio.trim()),
      Boolean(form.creatorBanner.trim()),
      Boolean(
        form.website.trim() ||
          form.twitter.trim() ||
          form.instagram.trim() ||
          form.youtube.trim() ||
          form.linkedin.trim(),
      ),
    ],
    [
      form.creatorBio,
      form.creatorBanner,
      form.creatorDisplayName,
      form.instagram,
      form.linkedin,
      form.twitter,
      form.website,
      form.youtube,
      normalizedSlugPreview,
    ],
  );
  const completionPercent = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );
  const hasSavedPublicProfile = Boolean(profile.creatorSlug);
  const completionSummary =
    completionPercent === 100
      ? "Profile is ready to publish."
      : "Add a bio, banner, and at least one link to finish the profile.";
  const previewAvatar = form.creatorAvatar.trim() || profile.creatorAvatar || profile.image;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setForm(initialFormState);
    setSavedFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    setBannerPreviewError(false);
  }, [form.creatorBanner]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
    setAssetStatus(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isHydrated) {
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorDisplayName: form.creatorDisplayName,
          creatorSlug: form.creatorSlug,
          creatorBio: form.creatorBio,
          creatorAvatar: form.creatorAvatar,
          creatorBanner: form.creatorBanner,
          creatorStatus: form.creatorStatus,
          socialLinks: {
            website: form.website,
            twitter: form.twitter,
            instagram: form.instagram,
            youtube: form.youtube,
            linkedin: form.linkedin,
          },
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (json.fields && typeof json.fields === "object") {
          setFieldErrors(json.fields as Record<string, string>);
        }
        throw new Error(json.error ?? "Failed to update creator profile.");
      }

      setSuccessMessage("Creator profile updated.");
      setAssetStatus(null);
      setSavedFormState(form);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Network error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File, target: "avatar" | "banner") {
    setUploadingAsset(target);
    setError(null);
    setAssetStatus(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/creator/upload/image", {
        method: "POST",
        body,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || typeof json.url !== "string") {
        throw new Error(json.error || "Failed to upload image");
      }

      setForm((prev) => ({
        ...prev,
        ...(target === "avatar"
          ? { creatorAvatar: json.url }
          : { creatorBanner: json.url }),
      }));
      setAssetStatus(target === "avatar" ? "Store avatar ready to save." : "Banner ready to save.");
      setSuccessMessage(null);
      if (target === "banner") {
        setBannerPreviewError(false);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image");
    } finally {
      setUploadingAsset(null);
      const input = target === "avatar" ? avatarInputRef.current : bannerInputRef.current;
      if (input) {
        input.value = "";
      }
    }
  }

  function handleAssetInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "banner",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleImageUpload(file, target);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-busy={!isHydrated || saving}
      data-creator-profile-form-ready={isHydrated ? "true" : "false"}
    >
      <div className="relative rounded-2xl border border-border bg-secondary px-5 py-4 shadow-card">
        <Badge
          variant={form.creatorStatus === "ACTIVE" ? "success" : "warning"}
          className="absolute right-4 top-4 h-fit w-fit px-2.5 py-1 font-semibold"
        >
          {form.creatorStatus === "ACTIVE" ? "Active" : "Paused"}
        </Badge>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="pr-20">
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Profile progress</p>
              <p className={SUPPORTING_COPY_CLASS}>{completionSummary}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{completionPercent}% complete</p>
          </div>
        </div>
      </div>

      <section className={PANEL_CLASS}>
        <div className={PANEL_BODY_CLASS}>
            <section className="space-y-5 border-b border-border-subtle pb-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className={SUBSECTION_TITLE_CLASS}>Identity</p>
                    <p className={SUPPORTING_COPY_CLASS}>
                      Set the name, URL, and public details learners see on your storefront.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="creator-display-name" className={LABEL_CLASS}>
                          Display name
                        </label>
                        <Input
                          id="creator-display-name"
                          name="creatorDisplayName"
                          value={form.creatorDisplayName}
                          onChange={handleChange}
                          disabled={formDisabled}
                          placeholder="Your Studio"
                          error={fieldErrors.creatorDisplayName}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="creator-slug" className={LABEL_CLASS}>
                          Creator slug
                        </label>
                        <Input
                          id="creator-slug"
                          name="creatorSlug"
                          value={form.creatorSlug}
                          onChange={handleChange}
                          disabled={formDisabled}
                          placeholder="your-studio"
                          error={fieldErrors.creatorSlug}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary px-4 py-3">
                      <p className="text-sm font-medium text-muted-foreground">Public URL</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {normalizedSlugPreview ? (
                          <span className="font-medium text-foreground">
                            /creators/{normalizedSlugPreview}
                          </span>
                        ) : (
                          "Add a slug or display name to preview your public URL."
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="creator-bio" className={LABEL_CLASS}>
                        Bio
                      </label>
                      <Textarea
                        id="creator-bio"
                        name="creatorBio"
                        value={form.creatorBio}
                        onChange={handleChange}
                        disabled={formDisabled}
                        rows={5}
                        className="min-h-[144px]"
                        placeholder="Tell learners what kind of resources you create and who they help."
                        error={fieldErrors.creatorBio}
                      />
                      <div className="flex items-center justify-end text-sm text-muted-foreground">
                        <span>{form.creatorBio.trim().length}/600</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <label htmlFor="creator-status" className={LABEL_CLASS}>
                            Status
                          </label>
                          <p className={SUPPORTING_COPY_CLASS}>
                            Shown as active or paused on your storefront.
                          </p>
                        </div>
                        <div className="w-full sm:w-[240px]">
                          <Select
                            id="creator-status"
                            name="creatorStatus"
                            value={form.creatorStatus}
                            onChange={handleChange}
                            disabled={formDisabled}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <div className="space-y-1">
                    <p className={SUBSECTION_TITLE_CLASS}>Store media</p>
                    <p className={SUPPORTING_COPY_CLASS}>
                      Add the avatar and banner shown on your storefront. Paste a URL or upload each file, then review both previews before saving.
                    </p>
                  </div>

                  <div className={`${SUPPORT_PANEL_CLASS} space-y-5`}>
                    <div className="divide-y divide-border lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                      <div className="space-y-4 pb-5 lg:pb-0 lg:pr-6">
                        <div className="flex items-start justify-between gap-3">
                          <label htmlFor="creator-avatar" className={LABEL_CLASS}>
                            Store avatar URL
                          </label>
                          {assetStatus === "Store avatar removed. Save to apply." ||
                          avatarHasUnsavedChanges ? (
                            <p className="pt-0.5 text-right text-xs font-medium text-muted-foreground">
                              {assetStatus === "Store avatar removed. Save to apply."
                                ? assetStatus
                                : "Store avatar ready to save."}
                            </p>
                          ) : null}
                        </div>
                        <Input
                          id="creator-avatar"
                          name="creatorAvatar"
                          value={form.creatorAvatar}
                          onChange={handleChange}
                          disabled={formDisabled}
                          placeholder="https://..."
                          error={fieldErrors.creatorAvatar}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={avatarInputRef}
                            data-testid="creator-avatar-upload-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={assetControlsDisabled}
                            onChange={(event) => handleAssetInputChange(event, "avatar")}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            leftIcon={
                              uploadingAsset === "avatar" ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Camera className="size-4" />
                              )
                            }
                            disabled={assetControlsDisabled}
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            {form.creatorAvatar.trim() ? "Change image" : "Upload image"}
                          </Button>
                          {form.creatorAvatar.trim() ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              leftIcon={<Trash2 className="size-4" />}
                              disabled={assetControlsDisabled}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, creatorAvatar: "" }));
                                setAssetStatus("Store avatar removed. Save to apply.");
                                setSuccessMessage(null);
                              }}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>

                      </div>

                      <div className="space-y-4 pt-5 lg:pt-0 lg:pl-6">
                        <div className="flex items-start justify-between gap-3">
                          <label htmlFor="creator-banner" className={LABEL_CLASS}>
                            Banner URL
                          </label>
                          {assetStatus === "Banner removed. Save to apply." ||
                          bannerHasUnsavedChanges ? (
                            <p className="pt-0.5 text-right text-xs font-medium text-muted-foreground">
                              {assetStatus === "Banner removed. Save to apply."
                                ? assetStatus
                                : "Banner ready to save."}
                            </p>
                          ) : null}
                        </div>
                        <Input
                          id="creator-banner"
                          name="creatorBanner"
                          value={form.creatorBanner}
                          onChange={handleChange}
                          disabled={formDisabled}
                          placeholder="https://..."
                          error={fieldErrors.creatorBanner}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={bannerInputRef}
                            data-testid="creator-banner-upload-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={assetControlsDisabled}
                            onChange={(event) => handleAssetInputChange(event, "banner")}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            leftIcon={
                              uploadingAsset === "banner" ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Camera className="size-4" />
                              )
                            }
                            disabled={assetControlsDisabled}
                            onClick={() => bannerInputRef.current?.click()}
                          >
                            {form.creatorBanner.trim() ? "Change banner" : "Upload banner"}
                          </Button>
                          {form.creatorBanner.trim() ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              leftIcon={<Trash2 className="size-4" />}
                              disabled={assetControlsDisabled}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, creatorBanner: "" }));
                                setBannerPreviewError(false);
                                setAssetStatus("Banner removed. Save to apply.");
                                setSuccessMessage(null);
                              }}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>

                      </div>
                    </div>

                    <div className="space-y-4 border-t border-border pt-6">
                      <div className="relative rounded-2xl border border-border bg-card p-4">
                        <Badge
                          variant={hasSavedPublicProfile ? "success" : "neutral"}
                          className="absolute right-4 top-4 h-fit w-fit px-2.5 py-1 font-semibold"
                        >
                          {hasSavedPublicProfile ? "Live" : "Pending"}
                        </Badge>

                        <div className="grid gap-4 pr-20 sm:grid-cols-[80px_minmax(0,1fr)] sm:items-start">
                          <Avatar
                            src={previewAvatar}
                            name={form.creatorDisplayName || profile.name}
                            email={profile.email}
                            alt={profile.creatorDisplayName ?? profile.name ?? "Creator avatar"}
                            size={80}
                            className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-border-subtle"
                          />

                          <div className="min-w-0 space-y-2">
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-foreground">
                                {form.creatorDisplayName.trim() || "Creator profile"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {normalizedSlugPreview
                                  ? `/creators/${normalizedSlugPreview}`
                                  : "Add a slug or display name to preview your public URL."}
                              </p>
                            </div>

                            {hasSavedPublicProfile ? (
                              <Link
                                href={routes.creatorPublicProfile(profile.creatorSlug!)}
                                className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-primary hover:text-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View profile
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        {form.creatorBanner && !bannerPreviewError ? (
                          <img
                            src={form.creatorBanner}
                            alt="Creator banner preview"
                            className="h-48 w-full object-cover object-center bg-card"
                            onError={() => setBannerPreviewError(true)}
                          />
                        ) : (
                          <div className="flex h-48 items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground">
                            {form.creatorBanner && bannerPreviewError
                              ? "Banner preview unavailable. Check the image URL and try again."
                              : "Add a banner URL to preview your public header."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="space-y-1">
                <p className={SUBSECTION_TITLE_CLASS}>Social links</p>
                <p className={SUPPORTING_COPY_CLASS}>
                  Add the links you want on your public profile.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["website", "Website", "https://your-site.com"],
                  ["twitter", "X / Twitter", "https://x.com/yourname"],
                  ["instagram", "Instagram", "https://instagram.com/yourname"],
                  ["youtube", "YouTube", "https://youtube.com/@yourname"],
                  ["linkedin", "LinkedIn", "https://linkedin.com/in/yourname"],
                ].map(([key, label, placeholder], index, items) => (
                  <div
                    key={key}
                    className={`space-y-2 ${index === items.length - 1 ? "md:col-span-2" : ""}`}
                  >
                    <label htmlFor={`creator-${key}`} className={LABEL_CLASS}>
                      {label}
                    </label>
                    <Input
                      id={`creator-${key}`}
                      name={key}
                      value={form[key as keyof typeof form] as string}
                      onChange={handleChange}
                      disabled={formDisabled}
                      placeholder={placeholder}
                      error={fieldErrors[key]}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-3 border-t border-border-subtle pt-6">
              {error ? <p className={FEEDBACK_ERROR_CLASS}>{error}</p> : null}
              {successMessage ? (
                <p className="inline-flex items-center gap-2 text-sm text-success-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {successMessage}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Changes update your public creator page after save.
                </p>
              )}
              <Button
                type="submit"
                size="sm"
                loading={saving}
                disabled={!isHydrated || !hasChanges}
                className="w-full"
              >
                Save creator profile
              </Button>
            </div>
        </div>
      </section>
    </form>
  );
}
