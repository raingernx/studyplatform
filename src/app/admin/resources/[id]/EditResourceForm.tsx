"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminFormLayout,
  DetailsCard,
  ResourceForm,
  type ResourceFormCategory,
  type ResourceFormResource,
  type ResourceFormTag,
  type ResourcePayload,
  StatsCard,
} from "@/components/admin/resources";
import { Card } from "@/design-system";
import { ResourceCard } from "@/components/resources/ResourceCard";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { routes } from "@/lib/routes";

interface EditResourceFormProps {
  id?: string;
  resource: ResourceFormResource;
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
  currentUser?: { id: string; name: string | null };
  initialTagIds: string[];
  initialPreviewUrls: string[];
  initialFileName?: string | null;
  initialFileSize?: number | null;
  /** Initial data for the live preview card (updates as user types). */
  initialPreviewData: ResourceCardData;
  stats: { downloads: number; purchases: number; reviews: number };
  details: {
    resourceId: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function EditResourceForm({
  id,
  resource,
  categories,
  tags: initialTags,
  currentUser,
  initialTagIds,
  initialPreviewUrls,
  initialFileName,
  initialFileSize,
  initialPreviewData,
  stats,
  details,
}: EditResourceFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [previewData, setPreviewData] =
    useState<ResourceCardData>(initialPreviewData);

  async function handleUpdate(payload: ResourcePayload) {
    const res = await fetch(`/api/admin/resources/${resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Something went wrong.");
    }

    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/admin/resources/${resource.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Delete failed.");
    }

    router.push(routes.adminResources);
    router.refresh();
  }

  return (
    <AdminFormLayout
      form={
        <Card className="w-full min-w-0 rounded-2xl border border-border bg-card px-5 pb-6 pt-4 shadow-card sm:px-6 sm:pb-8 lg:px-8">
          <ResourceForm
            mode="edit"
            id={id}
            resource={resource}
            categories={categories}
            tags={tags}
            initialTagIds={initialTagIds}
            initialPreviewUrls={initialPreviewUrls}
            initialFileName={initialFileName}
            initialFileSize={initialFileSize}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
            onPreviewDataChange={setPreviewData}
            onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
            currentUser={currentUser}
          />
        </Card>
      }
      sidebar={
        <>
          <div className="w-full">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              LIVE PREVIEW
            </p>
            <ResourceCard resource={previewData} variant="preview" previewMode />
          </div>
          <StatsCard
            downloads={stats.downloads}
            purchases={stats.purchases}
            reviews={stats.reviews}
          />
          <DetailsCard
            resourceId={details.resourceId}
            slug={details.slug}
            createdAt={details.createdAt}
            updatedAt={details.updatedAt}
          />
        </>
      }
    />
  );
}
