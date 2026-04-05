"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/design-system";

interface Props {
  defaultSlug?: string;
}

export function CreatorApplicationForm({ defaultSlug = "" }: Props) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState(defaultSlug);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48);
  }

  function handleNameChange(value: string) {
    setDisplayName(value);
    if (!slug || slug === autoSlug(displayName)) {
      setSlug(autoSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorDisplayName: displayName, creatorSlug: slug, creatorBio: bio }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          setFieldErrors(json.fields);
          setError(json.error ?? "Please fix the errors below.");
        } else {
          setError(json.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-800">Application submitted!</p>
          <p className="mt-1 text-sm text-green-700">
            We'll review your application and get back to you shortly. This page will update once a decision is made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && !Object.keys(fieldErrors).length && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-[13px] font-medium text-foreground">
          Creator display name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          maxLength={64}
          placeholder="e.g. Jane Smith"
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground
                     placeholder:text-muted-foreground shadow-sm outline-none transition
                     focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {fieldErrors.creatorDisplayName && (
          <p className="mt-1 text-[12px] text-red-600">{fieldErrors.creatorDisplayName}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="mb-1.5 block text-[13px] font-medium text-foreground">
          Creator URL slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="select-none border-r border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
            /creators/
          </span>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 48))}
            required
            maxLength={48}
            placeholder="jane-smith"
            className="flex-1 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        {fieldErrors.creatorSlug ? (
          <p className="mt-1 text-[12px] text-red-600">{fieldErrors.creatorSlug}</p>
        ) : (
          <p className="mt-1 text-[12px] text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. This will be your public profile URL.
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="mb-1.5 block text-[13px] font-medium text-foreground">
          Short bio <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Tell us a bit about yourself and the content you plan to create."
          className="w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground
                     placeholder:text-muted-foreground shadow-sm outline-none transition
                     focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-right text-[12px] text-muted-foreground">{bio.length}/500</p>
      </div>

      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit application"
        )}
      </Button>
    </form>
  );
}
