"use client";

import type { CreatorStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "@/design-system";
import { Avatar } from "@/components/ui/Avatar";
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
}

export function CreatorProfileForm({ profile }: CreatorProfileFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
              Public identity
            </p>
            <h2 className="text-xl font-semibold text-neutral-900">Make your creator profile trustworthy</h2>
            <p className="max-w-2xl text-sm text-neutral-600">
              Your creator profile powers your public page, resource attribution, and brand trust
              across the marketplace.
            </p>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Profile completeness
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-900">
                  {completionPercent}% complete
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {completionPercent === 100 ? "Ready" : "In progress"}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Add a name, slug, bio, banner, and at least one social link to complete your profile.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">Creator profile</h2>
          <p className="mt-1 text-sm text-neutral-500">
            These details appear on your public creator page and help learners trust your work.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Display name</label>
            <Input
              name="creatorDisplayName"
              value={form.creatorDisplayName}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Your Studio"
            />
            <p className="text-xs text-neutral-400">
              Use the name learners should recognize on your resources and public profile.
            </p>
            {fieldErrors.creatorDisplayName && (
              <p className="text-xs text-red-600">{fieldErrors.creatorDisplayName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Creator slug</label>
            <Input
              name="creatorSlug"
              value={form.creatorSlug}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="your-studio"
            />
            <p className="text-xs text-neutral-400">
              We normalize this to lowercase, hyphenated URLs like <span className="font-medium text-neutral-600">math-notes-studio</span>.
            </p>
            {fieldErrors.creatorSlug && (
              <p className="text-xs text-red-600">{fieldErrors.creatorSlug}</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Bio</label>
          <Textarea
            name="creatorBio"
            value={form.creatorBio}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Tell learners what kind of resources you create and who they help."
          />
          <div className="flex items-center justify-between gap-4 text-xs text-neutral-400">
            <span>Share your niche, audience, and why your resources stand out.</span>
            <span>{form.creatorBio.trim().length}/600</span>
          </div>
          {fieldErrors.creatorBio && (
            <p className="text-xs text-red-600">{fieldErrors.creatorBio}</p>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Banner URL</label>
            <Input
              name="creatorBanner"
              value={form.creatorBanner}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />
            <p className="text-xs text-neutral-400">
              Use a wide banner image URL to give your public creator page a branded look.
            </p>
            {fieldErrors.creatorBanner && (
              <p className="text-xs text-red-600">{fieldErrors.creatorBanner}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <Select
              name="creatorStatus"
              value={form.creatorStatus}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start gap-8">
              <div className="flex w-28 shrink-0 flex-col items-center gap-2">
                <Avatar
                  src={profile.image}
                  name={form.creatorDisplayName || profile.name}
                  email={profile.email}
                  alt={profile.creatorDisplayName ?? profile.name ?? "Creator avatar"}
                  size={112}
                  className="h-28 w-full rounded-xl object-cover shadow-sm ring-1 ring-border-subtle"
                />
                <span className="w-full text-center text-xs text-muted-foreground">
                  Account avatar
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-neutral-900">Creator identity</p>
                  <p className="max-w-md text-sm leading-6 text-neutral-600">
                    Your creator profile currently uses your account avatar and public identity.
                  </p>
                </div>

                <p className="max-w-md text-xs leading-5 text-neutral-500">
                  Update your account avatar in Account Settings to change how you appear on your
                  creator page.
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link href={routes.settings}>Open account settings</Link>
                  </Button>
                  {hasSavedPublicProfile && profile.creatorSlug ? (
                    <Link
                      href={routes.creatorPublicProfile(profile.creatorSlug)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      View public profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400">
                      View public profile
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-700">Banner preview</p>
            <p className="mt-1 text-xs text-neutral-500">
              This preview updates as you edit your banner URL.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
              {form.creatorBanner ? (
                <img
                  src={form.creatorBanner}
                  alt="Creator banner preview"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-sm font-medium text-white/80">
                  Add a banner URL to preview your public header
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-neutral-500">
                Public URL preview:{" "}
                <span className="font-medium text-neutral-700">
                  {normalizedSlugPreview
                    ? `/creators/${normalizedSlugPreview}`
                    : "Add a slug or display name to preview your public URL"}
                </span>
              </p>
              {hasSavedPublicProfile ? (
                <Link
                  href={routes.creatorPublicProfile(profile.creatorSlug!)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View public profile
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs text-neutral-400">
                  <Link2 className="h-3.5 w-3.5" />
                  Save your profile to enable the public page
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">Social links</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add the destinations learners can use to verify your work and follow your brand.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["website", "Website", "https://your-site.com"],
            ["twitter", "X / Twitter", "https://x.com/yourname"],
            ["instagram", "Instagram", "https://instagram.com/yourname"],
            ["youtube", "YouTube", "https://youtube.com/@yourname"],
            ["linkedin", "LinkedIn", "https://linkedin.com/in/yourname"],
          ].map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">{label}</label>
              <Input
                name={key}
                value={form[key as keyof typeof form] as string}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder={placeholder}
              />
              {fieldErrors[key] && (
                <p className="text-xs text-red-600">{fieldErrors[key]}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
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
