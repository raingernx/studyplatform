"use client";

import type { CreatorStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, FormSection, Input, Select, Textarea } from "@/design-system";
import { routes } from "@/lib/routes";

interface CreatorProfileFormProps {
  profile: {
    name: string | null;
    email: string | null;
    creatorDisplayName: string | null;
    creatorSlug: string | null;
    creatorBio: string | null;
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
  accountSettingsHref?: string;
}

const PANEL_CLASS = "rounded-2xl border border-border bg-card shadow-card";
const PANEL_HEADER_CLASS =
  "flex flex-col gap-5 border-b border-border px-6 py-6 lg:flex-row lg:items-start lg:justify-between";
const PANEL_BODY_CLASS = "grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]";
const SUPPORT_PANEL_CLASS = "rounded-2xl border border-border bg-muted p-4";
const LABEL_CLASS = "text-sm font-medium text-foreground";
const FEEDBACK_ERROR_CLASS =
  "rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700";

export function CreatorProfileForm({
  profile,
  accountSettingsHref = routes.dashboardV2Settings,
}: CreatorProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    creatorDisplayName: profile.creatorDisplayName ?? "",
    creatorSlug: profile.creatorSlug ?? "",
    creatorBio: profile.creatorBio ?? "",
    creatorBanner: profile.creatorBanner ?? "",
    creatorStatus: profile.creatorStatus ?? "ACTIVE",
    website: profile.socialLinks.website ?? "",
    twitter: profile.socialLinks.twitter ?? "",
    instagram: profile.socialLinks.instagram ?? "",
    youtube: profile.socialLinks.youtube ?? "",
    linkedin: profile.socialLinks.linkedin ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
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
      const response = await fetch("/api/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorDisplayName: form.creatorDisplayName,
          creatorSlug: form.creatorSlug,
          creatorBio: form.creatorBio,
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
      router.refresh();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className={PANEL_HEADER_CLASS}>
          <div className="space-y-3">
            <Badge variant="info" className="w-fit px-2.5 py-1 font-semibold">
              Public identity
            </Badge>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Make your creator profile trustworthy
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Your creator profile powers your public page, resource attribution, and brand trust
                across the marketplace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={completionPercent === 100 ? "success" : "neutral"}
                className="px-2.5 py-1 font-semibold"
              >
                {completionPercent === 100 ? "Ready" : "In progress"}
              </Badge>
              <Badge
                variant={hasSavedPublicProfile ? "success" : "neutral"}
                className="px-2.5 py-1 font-semibold"
              >
                {hasSavedPublicProfile ? "Public profile live" : "Public profile pending"}
              </Badge>
              <Badge
                variant={form.creatorStatus === "ACTIVE" ? "success" : "warning"}
                className="px-2.5 py-1 font-semibold"
              >
                {form.creatorStatus === "ACTIVE" ? "Active" : "Paused"}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Profile completeness
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {completionPercent}% complete
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {completionPercent === 100 ? "Ready to publish" : "Keep filling the essentials"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Add a name, slug, bio, banner, and at least one social link to complete your profile.
            </p>
          </div>
        </div>

        <div className={PANEL_BODY_CLASS}>
          <div className="space-y-6">
            <FormSection
              title="Creator profile"
              description="These details appear on your public creator page and help learners trust your work."
              className="pb-6"
            >
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
                    placeholder="Your Studio"
                    hint="Use the name learners should recognize on your resources and public profile."
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
                    placeholder="your-studio"
                    hint="We'll normalize this to lowercase URLs like math-notes-studio."
                    error={fieldErrors.creatorSlug}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Public URL preview
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {normalizedSlugPreview ? (
                    <span className="font-medium text-foreground">
                      /creators/{normalizedSlugPreview}
                    </span>
                  ) : (
                    "Add a slug or display name to preview your public URL."
                  )}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <label htmlFor="creator-bio" className={LABEL_CLASS}>
                  Bio
                </label>
                <Textarea
                  id="creator-bio"
                  name="creatorBio"
                  value={form.creatorBio}
                  onChange={handleChange}
                  rows={5}
                  className="min-h-[144px]"
                  placeholder="Tell learners what kind of resources you create and who they help."
                  hint="Share your niche, audience, and why your resources stand out."
                  error={fieldErrors.creatorBio}
                />
                <div className="flex items-center justify-end text-xs text-muted-foreground">
                  <span>{form.creatorBio.trim().length}/600</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="creator-banner" className={LABEL_CLASS}>
                    Banner URL
                  </label>
                  <Input
                    id="creator-banner"
                    name="creatorBanner"
                    value={form.creatorBanner}
                    onChange={handleChange}
                    placeholder="https://..."
                    hint="Use a wide banner image URL to give your public creator page a branded look."
                    error={fieldErrors.creatorBanner}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="creator-status" className={LABEL_CLASS}>
                    Status
                  </label>
                  <Select
                    id="creator-status"
                    name="creatorStatus"
                    value={form.creatorStatus}
                    onChange={handleChange}
                    hint="Paused creators stay visible on the marketplace but signal limited activity."
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </Select>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Social links"
              description="Add the destinations learners can use to verify your work and follow your brand."
              className="border-b-0 pb-0"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["website", "Website", "https://your-site.com"],
                  ["twitter", "X / Twitter", "https://x.com/yourname"],
                  ["instagram", "Instagram", "https://instagram.com/yourname"],
                  ["youtube", "YouTube", "https://youtube.com/@yourname"],
                  ["linkedin", "LinkedIn", "https://linkedin.com/in/yourname"],
                ].map(([key, label, placeholder]) => (
                  <div key={key} className="space-y-2">
                    <label htmlFor={`creator-${key}`} className={LABEL_CLASS}>
                      {label}
                    </label>
                    <Input
                      id={`creator-${key}`}
                      name={key}
                      value={form[key as keyof typeof form] as string}
                      onChange={handleChange}
                      placeholder={placeholder}
                      error={fieldErrors[key]}
                    />
                  </div>
                ))}
              </div>
            </FormSection>
          </div>

          <div className="space-y-4">
            <div className={SUPPORT_PANEL_CLASS}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex w-28 shrink-0 flex-col items-center gap-2">
                  <Avatar
                    src={profile.image}
                    name={form.creatorDisplayName || profile.name}
                    email={profile.email}
                    alt={profile.creatorDisplayName ?? profile.name ?? "Creator avatar"}
                    size={112}
                    className="h-28 w-full rounded-xl object-cover ring-1 ring-border-subtle"
                  />
                  <span className="w-full text-center text-xs text-muted-foreground">Account avatar</span>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">Creator identity</p>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                      Your creator profile currently uses your account avatar and public identity.
                    </p>
                  </div>

                  <p className="max-w-md text-xs leading-5 text-muted-foreground">
                    Update your account avatar in Account Settings to change how you appear on your
                    creator page.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href={accountSettingsHref}>Open account settings</Link>
                    </Button>
                    {hasSavedPublicProfile && profile.creatorSlug ? (
                      <Link
                        href={routes.creatorPublicProfile(profile.creatorSlug)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700"
                      >
                        View public profile
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        View public profile
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={SUPPORT_PANEL_CLASS}>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Banner preview</p>
                <p className="text-xs text-muted-foreground">
                  This preview updates as you edit your banner URL.
                </p>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
                {form.creatorBanner ? (
                  <img
                    src={form.creatorBanner}
                    alt="Creator banner preview"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground">
                    Add a banner URL to preview your public header
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Public URL preview:{" "}
                  <span className="font-medium text-foreground">
                    {normalizedSlugPreview
                      ? `/creators/${normalizedSlugPreview}`
                      : "Add a slug or display name to preview your public URL"}
                  </span>
                </p>
                {hasSavedPublicProfile ? (
                  <Link
                    href={routes.creatorPublicProfile(profile.creatorSlug!)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View public profile
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Save your profile to enable the public page
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          {error ? <p className={FEEDBACK_ERROR_CLASS}>{error}</p> : null}
          {successMessage ? (
            <p className="inline-flex items-center gap-2 text-sm text-success-700">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Changes update your public creator page and marketplace attribution after save.
            </p>
          )}
        </div>
        <Button type="submit" size="sm" loading={saving}>
          Save creator profile
        </Button>
      </div>
    </form>
  );
}
