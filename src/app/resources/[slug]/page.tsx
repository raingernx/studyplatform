import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { Navbar } from "@/components/layout/Navbar";
import { AlertCircle, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ResourceHeader } from "@/components/resource/ResourceHeader";
import { ResourceGallery } from "@/components/resource/ResourceGallery";
import { PurchaseCard } from "@/components/resource/PurchaseCard";
import { ResourceDescription } from "@/components/resource/ResourceDescription";
import { ResourceFiles } from "@/components/resource/ResourceFiles";
import { TagList } from "@/components/resource/TagList";
import { CreatorCard } from "@/components/resource/CreatorCard";
import { RelatedResources } from "@/components/resource/RelatedResources";
import type { ResourceCardResource } from "@/components/resources/ResourceCard";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildIncludedFiles(resource: {
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  fileKey: string | null;
  type: string;
}) {
  if (resource.fileName) {
    return [{ name: resource.fileName, size: resource.fileSize ?? undefined }];
  }

  if (!(resource.fileUrl ?? resource.fileKey)) {
    return [];
  }

  const fallbackName =
    resource.fileKey?.split("/").pop() ||
    (resource.type === "PDF" ? "Downloadable PDF" : "Downloadable file");

  return [{ name: fallbackName, size: resource.fileSize ?? undefined }];
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getResourceData(slug: string, userId?: string) {
  const resource = await prisma.resource.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
      previews: { orderBy: { order: "asc" } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  const purchase =
    resource && userId
      ? await prisma.purchase.findFirst({
          where: { userId, resourceId: resource.id, status: "COMPLETED" },
        })
      : null;

  // Related resources: same category, exclude current, limit 4
  let relatedResources: ResourceCardResource[] = [];
  let ownedRelatedIds: string[] = [];
  if (resource?.categoryId) {
    const related = await prisma.resource.findMany({
      where: {
        categoryId: resource.categoryId,
        id: { not: resource.id },
        status: "PUBLISHED",
      },
      take: 4,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        previews: { orderBy: { order: "asc" }, select: { imageUrl: true } },
      },
    });
    relatedResources = related.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description ?? "",
      price: r.price,
      isFree: r.isFree || r.price === 0,
      author: r.author,
      category: r.category,
      previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null,
      previewImages: r.previews?.map((p) => p.imageUrl) ?? null,
      downloadCount: r.downloadCount,
    }));
    if (userId && related.length > 0) {
      const owned = await prisma.purchase.findMany({
        where: {
          userId,
          resourceId: { in: related.map((r) => r.id) },
          status: "COMPLETED",
        },
        select: { resourceId: true },
      });
      ownedRelatedIds = owned.map((p) => p.resourceId);
    }
  }

  return { resource, purchase, relatedResources, ownedRelatedIds };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const resource = await prisma.resource.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  return {
    title: resource ? `${resource.title} | PaperDock` : "Resource | PaperDock",
    description: resource?.description?.slice(0, 155) ?? "",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { resource, purchase, relatedResources, ownedRelatedIds } = await getResourceData(
    slug,
    userId
  );

  if (!resource || resource.status !== "PUBLISHED") {
    notFound();
  }

  const isOwned = Boolean(purchase);
  const hasFile = Boolean(resource.fileUrl ?? resource.fileKey);
  const paymentStatus =
    typeof resolvedSearchParams.payment === "string"
      ? resolvedSearchParams.payment
      : undefined;
  const fallbackPreviewUrl = resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null;
  const includedFiles = buildIncludedFiles(resource);

  logActivity({
    userId,
    action: "RESOURCE_VIEW",
    entity: "Resource",
    entityId: resource.id,
    metadata: {
      slug: resource.slug,
      title: resource.title,
      categoryId: resource.categoryId,
      isFree: resource.isFree || resource.price === 0,
    },
  }).catch(() => {});

  const purchaseCardResource = {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    price: resource.price,
    isFree: resource.isFree || resource.price === 0,
    type: resource.type,
    downloadCount: resource.downloadCount,
    author: resource.author,
    category: resource.category,
    fileSize: resource.fileSize ?? undefined,
    updatedAt: resource.updatedAt ?? undefined,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <ResourceHeader
            breadcrumb={[
              { label: "Home", href: "/" },
              ...(resource.category
                ? [{ label: resource.category.name, href: `/categories/${resource.category.slug}` }]
                : []),
            ]}
            title={resource.title}
            creatorName={resource.author.name}
            creatorHref={resource.author.id ? `/creators/${resource.author.id}` : null}
            featured={resource.featured}
          />

          {/* Payment feedback banners */}
          {paymentStatus === "success" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-[14px] font-semibold text-emerald-800">Payment successful!</p>
                <p className="mt-0.5 text-[13px] text-emerald-700">
                  Your purchase is being confirmed. Head to{" "}
                  <Link href="/library" className="underline underline-offset-2">
                    My Library
                  </Link>{" "}
                  to access your download once it appears.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "cancelled" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-[13px] text-amber-700">
                Payment was cancelled. You have not been charged.
              </p>
            </div>
          )}

          {/* Gallery: thumbnails | preview | purchase card (3 columns on lg, equal height) */}
          <div className="grid grid-cols-1 gap-6 items-stretch lg:grid-cols-[80px_1fr_320px]">
            <ResourceGallery
              previews={resource.previews}
              resourceTitle={resource.title}
              fallbackImageUrl={fallbackPreviewUrl}
            />
            <div className="order-3 h-full min-h-0">
              <PurchaseCard
                resource={purchaseCardResource}
                isOwned={isOwned}
                hasFile={hasFile}
                session={session}
              />
            </div>
          </div>

          {/* Sections: About → Included files → Tags → Creator card → Related resources */}
          <div className="mt-12 space-y-12">
            <ResourceDescription title="About" description={resource.description} />
            <ResourceFiles files={includedFiles} />
            <TagList tags={resource.tags.map((rt) => rt.tag)} />
            <CreatorCard creator={{ id: resource.author.id, name: resource.author.name, image: resource.author.image }} />
            <RelatedResources resources={relatedResources} ownedIds={ownedRelatedIds} />
          </div>

          {/* Back link */}
          <div className="mt-10">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Discover more resources
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
