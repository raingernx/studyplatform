"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Mail, Trash2, User } from "lucide-react";
import { Avatar, Badge, Button, FormSection, Input } from "@/design-system";

type ProfileSettingsProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  providerImage?: string | null;
  providerLabel?: string | null;
};

export function ProfileSettings({
  name,
  email,
  image,
  providerImage,
  providerLabel,
}: ProfileSettingsProps) {
  const router = useRouter();
  const { update } = useSession();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [displayEmail, setDisplayEmail] = useState(email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(image ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizedProviderImage = providerImage?.trim() ? providerImage.trim() : null;
  const providerAvatarAvailable = Boolean(normalizedProviderImage);
  const hasCustomAvatar = Boolean(avatarUrl) && avatarUrl !== normalizedProviderImage;
  const canResetPhoto = hasCustomAvatar || (!providerAvatarAvailable && Boolean(avatarUrl));
  const photoSourceLabel = hasCustomAvatar
    ? "Uploaded"
    : providerAvatarAvailable
      ? `${providerLabel ?? "Provider"} photo`
      : "Initials";

  async function handleAvatarFile(file: File) {
    setIsUploadingAvatar(true);
    setError(null);
    setStatus(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || typeof json.url !== "string") {
        throw new Error(json.error || "Failed to upload profile photo");
      }

      setAvatarUrl(json.url);
      setStatus("Photo ready to save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile photo");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleAvatarInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleAvatarFile(file);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setStatus(null);

    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayName,
        email: displayEmail,
        image: avatarUrl,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to update profile");
        }
        return res.json();
      })
      .then(async (json) => {
        const data = json?.data as
          | { name?: string | null; email?: string | null; image?: string | null }
          | undefined;
        const nextName = data?.name ?? displayName;
        const nextEmail = data?.email ?? displayEmail;
        const nextImage = data?.image ?? avatarUrl;

        setDisplayName(nextName ?? "");
        setDisplayEmail(nextEmail ?? "");
        setAvatarUrl(nextImage ?? null);
        await update({
          name: nextName ?? "",
          email: nextEmail ?? "",
          image: nextImage ?? null,
        });
        router.refresh();
        setStatus("Profile saved.");
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  return (
    <FormSection
      variant="flat"
      title="Profile"
      description="Update the profile details shown in your dashboard."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-h-[16px]">
            {error ? (
              <p className="text-caption text-danger-600">{error}</p>
            ) : status ? (
              <p className="text-caption text-success-600">{status}</p>
            ) : null}
          </div>
          <div className="ml-auto">
            <Button
              type="submit"
              size="sm"
              loading={isSaving}
              disabled={isUploadingAvatar}
              form="profile-settings-form"
            >
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <form id="profile-settings-form" onSubmit={handleSave} className="space-y-5">
        <div className="flex flex-col gap-5 border-b border-border-subtle pb-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              src={avatarUrl}
              name={displayName}
              email={displayEmail}
              size={72}
              className="ring-2 ring-border"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Profile photo</p>
                <Badge variant="info" className="px-2 py-0 text-[10px] leading-5">
                  {photoSourceLabel}
                </Badge>
              </div>
              <p className="mt-1 text-small text-muted-foreground">
                <span className="block">Used in navigation, menus, and</span>
                <span className="block">settings.</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarInputChange}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={
                isUploadingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )
              }
              disabled={isUploadingAvatar || isSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {canResetPhoto ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<Trash2 className="size-4" />}
                disabled={isUploadingAvatar || isSaving}
                onClick={() => {
                  setAvatarUrl(normalizedProviderImage);
                  setStatus(
                    providerAvatarAvailable
                      ? `${providerLabel ?? "Provider"} photo restored. Save changes to apply.`
                      : "Photo removed. Save changes to apply.",
                  );
                  setError(null);
                }}
              >
                Remove photo
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-display-name"
              className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Name
            </label>
            <Input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="profile-display-email"
              className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email
            </label>
            <Input
              id="profile-display-email"
              type="email"
              value={displayEmail}
              onChange={(e) => setDisplayEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
      </form>
    </FormSection>
  );
}
