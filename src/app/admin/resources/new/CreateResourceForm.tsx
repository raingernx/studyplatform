"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { AdminFormLayout } from "@/components/admin/resources";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import type {
  ResourceFormCategory,
  ResourceFormTag,
  ResourcePayload,
  ResourceFormResource,
} from "@/components/admin/resources";

const ResourceForm = dynamic(() =>
  import("@/components/admin/resources").then((m) => m.ResourceForm),
  {
    loading: () => <AdminResourceFormLoadingShell />,
  },
);

interface CreateResourceFormProps {
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
  currentUser?: { id: string; name: string | null };
}

const defaultPreviewData: ResourceCardData = {
  id: "preview",
  title: "Sample resource title",
  slug: "sample-resource",
  description:
    "Short description of the resource to show how it will look in the marketplace.",
  isFree: true,
  price: 0,
  previewUrl: null,
  downloadCount: 0,
  author: { name: "You" },
  category: undefined,
  tags: [],
  _count: { purchases: 0, reviews: 0 },
};

function AdminResourceFormLoadingShell() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-11 w-full rounded-2xl" />
      </div>
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-40" />
        <LoadingSkeleton className="h-28 w-full rounded-3xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <LoadingSkeleton className="h-11 w-full rounded-2xl" />
        <LoadingSkeleton className="h-11 w-full rounded-2xl" />
      </div>
      <LoadingSkeleton className="h-40 w-full rounded-3xl" />
      <div className="flex justify-end gap-3">
        <LoadingSkeleton className="h-10 w-28 rounded-full" />
        <LoadingSkeleton className="h-10 w-36 rounded-full" />
      </div>
    </div>
  );
}

export function CreateResourceForm({ categories, tags: initialTags, currentUser }: CreateResourceFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [previewData, setPreviewData] =
    useState<ResourceCardData>(defaultPreviewData);
  const [draftResourceId, setDraftResourceId] = useState<string | null>(null);

  async function ensureDraftResource() {
    if (draftResourceId) return draftResourceId;

    try {
      const res = await fetch("/api/admin/resources/draft", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to create draft resource", data);
        return undefined;
      }

      const draftId = data.id as string | undefined;
      if (!draftId) return undefined;

      setDraftResourceId(draftId);
      return draftId;
    } catch (err) {
      console.error("Error creating draft resource", err);
      return undefined;
    }
  }

  async function handleCreate(payload: ResourcePayload) {
    // When a draft exists, finalize it via PATCH so uploads stay attached.
    if (draftResourceId) {
      const res = await fetch(`/api/admin/resources/${draftResourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(
          data.error ?? "Failed to create resource.",
        ) as Error & { fields?: Record<string, string> };
        if (data.fields) {
          error.fields = data.fields as Record<string, string>;
        }
        throw error;
      }

      router.refresh();
      return;
    }

    // Fallback: legacy create behavior without draft.
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(
        data.error ?? "Failed to create resource.",
      ) as Error & { fields?: Record<string, string> };
      if (data.fields) {
        error.fields = data.fields as Record<string, string>;
      }
      throw error;
    }

    router.refresh();
  }

  return (
    <AdminFormLayout
      form={
        <Card className="w-full min-w-0 rounded-2xl border border-border bg-card px-5 pb-6 pt-4 shadow-card sm:px-6 sm:pb-8 lg:px-8">
          <ResourceForm
            mode="create"
            categories={categories}
            tags={tags}
            draftResourceId={draftResourceId ?? undefined}
            onEnsureDraftResource={ensureDraftResource}
            onSubmit={handleCreate}
            onPreviewDataChange={setPreviewData}
            onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
            currentUser={currentUser}
          />
        </Card>
      }
      sidebar={
        <div className="w-full">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            LIVE PREVIEW
          </p>
          <ResourceCard resource={previewData} variant="preview" previewMode />
        </div>
      }
    />
  );
}
