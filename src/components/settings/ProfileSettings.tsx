"use client";

import { useState } from "react";
import { User, Mail, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormSection } from "@/components/ui/form-section";
import { Avatar } from "@/components/ui/Avatar";

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
      title="Profile"
      description="Update your basic account information."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error && (
            <p className="text-[11px] text-red-600">
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
      <form id="profile-settings-form" onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={image}
            name={displayName}
            email={displayEmail}
            size={56}
            className="ring-2 ring-zinc-100"
          />
          <div>
            <p className="text-[13px] text-zinc-500">Avatar</p>
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
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-700">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-700">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              Email
            </label>
            <input
              type="email"
              value={displayEmail}
              onChange={(e) => setDisplayEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>
        </div>
      </form>
    </FormSection>
  );
}
