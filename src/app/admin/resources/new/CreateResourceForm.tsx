"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResourceForm,
  type ResourceFormCategory,
  type ResourceFormTag,
  type ResourcePayload,
} from "@/components/admin/ResourceForm";
import { Card } from "@/components/ui/Card";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import type { ResourceCardData } from "@/components/resources/ResourceCard";

interface CreateResourceFormProps {
  categories: ResourceFormCategory[];
  tags: ResourceFormTag[];
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

export function CreateResourceForm({ categories, tags }: CreateResourceFormProps) {
  const router = useRouter();
  const [previewData, setPreviewData] =
    useState<ResourceCardData>(defaultPreviewData);

  async function handleCreate(payload: ResourcePayload) {
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Failed to create resource.");
    }

    router.push("/admin/resources");
    router.refresh();
  }

  return (
    <AdminFormLayout
      form={
        <Card className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <ResourceForm
            mode="create"
            categories={categories}
            tags={tags}
            onSubmit={handleCreate}
            onPreviewDataChange={setPreviewData}
          />
        </Card>
      }
      sidebar={
        <div className="w-full">
          <p className="mb-3 text-xs font-semibold uppercase tracking-tight text-zinc-500">
            LIVE PREVIEW
          </p>
          <ResourceCard resource={previewData} variant="preview" />
        </div>
      }
    />
  );
}
