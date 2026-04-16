"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button, Input, Textarea } from "@/design-system";
import { toSlug } from "@/lib/slug";

interface Props {
  defaultSlug?: string;
}

export function CreatorApplicationForm({ defaultSlug = "" }: Props) {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState(defaultSlug);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(defaultSlug));
  const [slugAvailability, setSlugAvailability] = useState<{
    status: "idle" | "checking" | "available" | "unavailable" | "invalid";
    message: string;
  }>({
    status: "idle",
    message:
      "Lowercase letters, numbers, and hyphens only. This will be your public profile URL.",
  });
  const formDisabled = !hydrated || loading;

  useEffect(() => {
    setHydrated(true);
  }, []);

  function autoSlug(name: string) {
    return toSlug(name).slice(0, 48);
  }

  function handleNameChange(value: string) {
    setDisplayName(value);
    setFieldErrors((current) => {
      if (!current.creatorDisplayName) {
        return current;
      }

      const next = { ...current };
      delete next.creatorDisplayName;
      return next;
    });
    if (!slugManuallyEdited) {
      setSlug(autoSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    const normalized = autoSlug(value);
    setSlug(normalized);
    setSlugManuallyEdited(normalized.length > 0);
    setFieldErrors((current) => {
      if (!current.creatorSlug) {
        return current;
      }

      const next = { ...current };
      delete next.creatorSlug;
      return next;
    });
  }

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!slug) {
      setSlugAvailability({
        status: "idle",
        message:
          "Lowercase letters, numbers, and hyphens only. This will be your public profile URL.",
      });
      return;
    }

    if (slug.length < 2) {
      setSlugAvailability({
        status: "invalid",
        message: "Slug must be at least 2 characters.",
      });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSlugAvailability({
        status: "checking",
        message: "Checking creator URL availability...",
      });

      try {
        const response = await fetch(
          `/api/creator/slug-availability?slug=${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Slug availability check failed.");
        }

        const json = (await response.json()) as {
          normalized?: string;
          available?: boolean;
          message?: string;
        };

        if (cancelled) {
          return;
        }

        if (typeof json.normalized === "string" && json.normalized !== slug) {
          setSlug(json.normalized);
          return;
        }

        setSlugAvailability({
          status: json.available ? "available" : "unavailable",
          message:
            json.message ??
            (json.available
              ? "This creator URL is available."
              : "That creator slug is already in use."),
        });
      } catch (fetchError) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        setSlugAvailability({
          status: "idle",
          message:
            "Lowercase letters, numbers, and hyphens only. This will be your public profile URL.",
        });
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hydrated, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorDisplayName: displayName,
          creatorSlug: slug,
          creatorBio: bio,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json")
        ? ((await res.json()) as {
            error?: string;
            fields?: Record<string, string>;
          })
        : null;

      if (!res.ok) {
        if (json?.fields) {
          setFieldErrors(json.fields);
          setError(json.error ?? "Please fix the errors below.");
        } else {
          setError(json?.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      router.refresh();
    } catch {
      setError(
        "We couldn't submit your application right now. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-busy={formDisabled}
      data-creator-application-form-ready={hydrated ? "true" : "false"}
    >
      {error && !Object.keys(fieldErrors).length && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger-600" />
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="displayName"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Creator display name <span className="text-danger-600">*</span>
        </label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          maxLength={64}
          placeholder="e.g. Jane Smith"
          autoComplete="nickname"
          disabled={formDisabled}
          error={fieldErrors.creatorDisplayName}
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Creator URL slug <span className="text-danger-600">*</span>
        </label>
        <div className="overflow-hidden rounded-xl border border-input bg-background transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
          <div className="flex min-h-11 items-stretch">
            <span className="inline-flex select-none items-center border-r border-input bg-muted px-3.5 text-sm text-muted-foreground">
              /creators/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              maxLength={48}
              placeholder="jane-smith"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={formDisabled}
              aria-invalid={Boolean(fieldErrors.creatorSlug)}
              aria-describedby="slug-hint"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
        {fieldErrors.creatorSlug ? (
          <p id="slug-hint" className="mt-1 text-caption text-danger-700">
            {fieldErrors.creatorSlug}
          </p>
        ) : (
          <p
            id="slug-hint"
            className={`mt-1 text-caption ${
              slugAvailability.status === "available"
                ? "text-success-700"
                : slugAvailability.status === "unavailable" ||
                    slugAvailability.status === "invalid"
                  ? "text-danger-700"
                  : "text-muted-foreground"
            }`}
          >
            {slugAvailability.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Short bio <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Tell us a bit about yourself and the content you plan to create."
          hint={`${bio.length}/500`}
          disabled={formDisabled}
          className="resize-none"
        />
      </div>

      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? "Submitting..." : "Submit application"}
      </Button>
      <p className="text-center text-caption text-muted-foreground">
        Review time: 1–3 business days after submission.
      </p>
    </form>
  );
}
