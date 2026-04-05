"use client";

import { useState } from "react";
import { User, Mail, Camera } from "lucide-react";
import { Avatar, Button, FormSection, Input } from "@/design-system";

type ProfileSettingsProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function ProfileSettings({ name, email, image }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [displayEmail, setDisplayEmail] = useState(email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: displayName, email: displayEmail }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to update profile");
        }
        return res.json();
      })
      .then(() => {
        // no-op for now; UI already reflects latest values
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
      description="Update your basic account information."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error && (
            <p className="text-caption text-danger-600">
              {error}
            </p>
          )}
          <div className="ml-auto">
            <Button type="submit" size="sm" loading={isSaving} form="profile-settings-form">
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <form id="profile-settings-form" onSubmit={handleSave} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar
            src={image}
            name={displayName}
            email={displayEmail}
            size={56}
            className="ring-2 ring-border"
          />
          <div>
            <p className="text-small text-muted-foreground">Avatar</p>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" size="sm">
                <Camera className="h-3.5 w-3.5" />
                Upload avatar
              </Button>
            </div>
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
