"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResourceForm,
  type ResourceFormCategory,
  type ResourceFormResource,
  type ResourceFormTag,
  type ResourcePayload,
} from "@/components/admin/ResourceForm";
import { Card } from "@/components/ui/Card";
import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { StatsCard } from "@/components/admin/StatsCard";
import { DetailsCard } from "@/components/admin/DetailsCard";
import type { ResourceCardData } from "@/components/resources/ResourceCard";

interface EditResourceFormProps {
  id?: string;
  resource: ResourceFormResource;
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
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
  tags,
  initialTagIds,
  initialPreviewUrls,
  initialFileName,
  initialFileSize,
  initialPreviewData,
  stats,
  details,
}: EditResourceFormProps) {
  const router = useRouter();
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

    router.push("/admin/resources");
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

    router.push("/admin/resources");
    router.refresh();
  }

  return (
    <AdminFormLayout
      form={
        <Card className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
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
          />
        </Card>
      }
      sidebar={
        <>
          <div className="w-full">
            <p className="mb-3 text-xs font-semibold uppercase tracking-tight text-zinc-500">
              LIVE PREVIEW
            </p>
            <ResourceCard resource={previewData} variant="preview" />
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
