import { notFound, redirect } from "next/navigation";
import {
  getAdminResourceEditPageData,
  getAdminResourceEditTitle,
} from "@/services/admin";
import { EditResourceForm } from "./EditResourceForm";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> };

// ── Metadata (dynamic) ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const resource = await getAdminResourceEditTitle(id);
  return {
    title: resource ? `Edit "${resource.title}" – Admin` : "Edit Resource – Admin",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EditResourcePage({ params }: Props) {
  const { id } = await params;
  const session = await requireAdminSession(routes.adminResource(id));

  const { resource, categories, tags } = await getAdminResourceEditPageData(id);

  // ── 3. 404 if resource doesn't exist ──────────────────────────────────────
  if (!resource) {
    notFound();
  }

  const previewTags = resource.tags
    .map((rt) => tags.find((t) => t.id === rt.tagId))
    .filter(Boolean)
    .map((t) => ({ tag: { id: t!.id, name: t!.name, slug: t!.slug } }));

  const previewUrlsFromPreviews = resource.previews.map((p) => p.imageUrl);
  const firstPreviewUrl =
    resource.previewUrl ?? previewUrlsFromPreviews[0] ?? null;
  const restPreviewUrls = previewUrlsFromPreviews.filter(
    (u, i) => i > 0 || u !== resource.previewUrl,
  );
  const initialPreviewUrls = firstPreviewUrl
    ? [firstPreviewUrl, ...restPreviewUrls]
    : restPreviewUrls;

  const previewData: ResourceCardData = {
    id: resource.id,
    title: resource.title || "Sample resource title",
    slug: resource.slug || "sample-resource",
    description:
      resource.description ||
      "Short description of the resource to show how it will look in the marketplace.",
    isFree: resource.isFree || resource.price === 0,
    price: resource.price || 0,
    previewUrl:
      resource.previews[0]?.imageUrl ??
      resource.previewUrl ??
      null,
    downloadCount: resource.downloadCount ?? 0,
    author: {
      name: resource.author.name ?? "Creator",
    },
    category: resource.category
      ? {
          name: resource.category.name,
          slug: "category",
        }
      : undefined,
    tags: previewTags,
    _count: {
      purchases: resource._count.purchases ?? 0,
      reviews: 0,
    },
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
            Edit Resource
          </h1>
          <p className="mt-1 text-meta text-muted-foreground">
            Update details, pricing, and file for this resource.
          </p>
        </div>
      </div>

      <EditResourceForm
        id="edit-resource-form"
        currentUser={
          session.user?.id
            ? { id: session.user.id, name: session.user.name ?? null }
            : undefined
        }
        resource={{
          id: resource.id,
          slug: resource.slug,
          title: resource.title,
          description: resource.description,
          type: resource.type,
          status: resource.status,
          isFree: resource.isFree,
          price: resource.price,
          fileUrl: resource.fileUrl,
          categoryId: resource.categoryId,
          featured: resource.featured,
          level: resource.level,
          license: resource.license,
          visibility: resource.visibility,
          authorId: resource.authorId,
          authorName: resource.author?.name ?? null,
        }}
        categories={categories}
        tags={tags}
        initialTagIds={resource.tags.map((rt) => rt.tagId)}
        initialPreviewUrls={initialPreviewUrls}
        initialFileName={resource.fileName}
        initialFileSize={resource.fileSize}
        initialPreviewData={previewData}
        stats={{
          downloads: resource.downloadCount,
          purchases: resource._count.purchases,
          reviews: resource._count.reviews,
        }}
        details={{
          resourceId: resource.id,
          slug: resource.slug,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
        }}
      />
    </div>
  );
}
