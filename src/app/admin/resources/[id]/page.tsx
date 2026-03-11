import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditResourceForm } from "./EditResourceForm";
import type { ResourceCardData } from "@/components/resources/ResourceCard";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = { params: { id: string } };

// ── Metadata (dynamic) ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return {
    title: resource ? `Edit "${resource.title}" – Admin` : "Edit Resource – Admin",
  };
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getEditData(id: string) {
  const [resource, categories, tags] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { purchases: true, reviews: true } },
        tags: { select: { tagId: true } },
        previews: { select: { imageUrl: true }, orderBy: { order: "asc" } },
      },
      // scalar fields (fileKey, fileName, fileSize, fileUrl …) are always selected
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { resource, categories, tags };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EditResourcePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  // ── 1. Require login ───────────────────────────────────────────────────────
  if (!session?.user) {
    redirect(`/auth/login?next=/admin/resources/${params.id}`);
  }

  // ── 2. Require ADMIN role ──────────────────────────────────────────────────
  const role = session.user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { resource, categories, tags } = await getEditData(params.id);

  // ── 3. 404 if resource doesn't exist ──────────────────────────────────────
  if (!resource) {
    notFound();
  }

  const previewTags = resource.tags
    .map((rt) => tags.find((t) => t.id === rt.tagId))
    .filter(Boolean)
    .map((t) => ({ tag: { id: t!.id, name: t!.name, slug: t!.slug } }));

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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Edit Resource
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Update details, pricing, and file for this resource.
          </p>
        </div>
      </div>

      <EditResourceForm
        id="edit-resource-form"
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
        }}
        categories={categories}
        tags={tags}
        initialTagIds={resource.tags.map((rt) => rt.tagId)}
        initialPreviewUrls={resource.previews.map((p) => p.imageUrl)}
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

