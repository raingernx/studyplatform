import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Navbar } from "@/components/layout/Navbar";
import { PageContainer, PageContentWide } from "@/design-system";
import { AlertCircle, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ResourceHeader } from "@/components/resource/ResourceHeader";
import { ResourceGallery } from "@/components/resource/ResourceGallery";
import { PurchaseCard } from "@/components/resource/PurchaseCard";
import { ResourceDescription } from "@/components/resource/ResourceDescription";
import { ResourceFiles } from "@/components/resource/ResourceFiles";
import { TagList } from "@/components/resource/TagList";
import { CreatorCard } from "@/components/resource/CreatorCard";
import { RelatedResources } from "@/components/resource/RelatedResources";
import { ResourceReviews } from "@/components/resource/ResourceReviews";
import { ResourceReviewForm } from "@/components/resource/ResourceReviewForm";
import { getOwnedIdsFromSet, hasPurchased } from "@/services/purchase.service";
import { getPublicResourcePageData } from "@/services/resource.service";
import {
  getResourceReviews,
  getResourceTrustSummary,
  getUserResourceReview,
} from "@/services/review.service";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatLevel(level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null) {
  if (!level) return null;

  switch (level) {
    case "BEGINNER":
      return "Beginners";
    case "INTERMEDIATE":
      return "Intermediate learners";
    case "ADVANCED":
      return "Advanced learners";
    default:
      return null;
  }
}

function buildIdentityTargets(resource: {
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  category: { name: string } | null;
  type: string;
}) {
  const targets = new Set<string>();

  const formattedLevel = formatLevel(resource.level);
  if (formattedLevel) {
    targets.add(formattedLevel);
  }

  if (resource.category?.name) {
    targets.add(`${resource.category.name} learners`);
  }

  if (resource.type === "PDF") {
    targets.add("Self-paced revision");
  } else {
    targets.add("Structured note-taking");
  }

  return Array.from(targets).slice(0, 3);
}

function buildOutcomePoints(resource: {
  category: { name: string } | null;
  type: string;
  fileUrl: string | null;
  fileKey: string | null;
}) {
  const subject = resource.category?.name ?? "your subject";
  const formatLabel = resource.type === "PDF" ? "PDF" : "document";

  const points = [
    `Focus your ${subject.toLowerCase()} study sessions with one organized ${formatLabel} instead of collecting scattered material.`,
    `Work from a clearer starting point so you can spend more time reviewing and less time setting up.`,
  ];

  if (resource.fileUrl ?? resource.fileKey) {
    points.push(
      "Keep it in your library for repeat revision whenever you need a quick refresher.",
    );
  }

  return points;
}

function buildOutcomeHint(resource: {
  category: { name: string } | null;
  type: string;
}) {
  if (resource.category?.name) {
    return `Focused ${resource.category.name.toLowerCase()} revision`;
  }

  return resource.type === "PDF"
    ? "Built for self-paced review"
    : "Built for structured note-taking";
}

function buildComparisonAnchor(
  resource: { isFree: boolean; price: number; category: { name: string } | null },
  relatedResources: Array<{ price: number; isFree: boolean }>,
) {
  if (resource.isFree || resource.price === 0 || !resource.category) {
    return null;
  }

  const paidPeerPrices = relatedResources
    .filter((item) => !item.isFree && item.price > 0)
    .map((item) => item.price);

  if (paidPeerPrices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...paidPeerPrices);
  const maxPrice = Math.max(...paidPeerPrices);

  return {
    label:
      minPrice === maxPrice
        ? `Similar ${resource.category.name.toLowerCase()} resources are typically priced around ${formatPrice(minPrice / 100)}.`
        : `Similar ${resource.category.name.toLowerCase()} resources are usually priced between ${formatPrice(minPrice / 100)} and ${formatPrice(maxPrice / 100)}.`,
  };
}

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

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { resource } = await getPublicResourcePageData(slug);

  return {
    title: resource ? resource.title : "Resource",
    description: resource?.description?.slice(0, 155) ?? "",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { resource, relatedResources } = await getPublicResourcePageData(slug);

  if (!resource || resource.status !== "PUBLISHED") {
    notFound();
  }

  const [isOwned, ownedRelatedIds, trustSummary, reviews, viewerReview] = await Promise.all([
    userId ? hasPurchased(userId, resource.id) : false,
    userId
      ? getOwnedIdsFromSet(
          userId,
          relatedResources.map((related) => related.id),
        )
      : [],
    getResourceTrustSummary(resource.id),
    getResourceReviews(resource.id, 5),
    userId ? getUserResourceReview(userId, resource.id) : null,
  ]);
  const hasFile = Boolean(resource.fileUrl ?? resource.fileKey);
  const paymentStatus =
    typeof resolvedSearchParams.payment === "string"
      ? resolvedSearchParams.payment
      : undefined;
  const fallbackPreviewUrl = resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null;
  const includedFiles = buildIncludedFiles(resource);
  const identityTargets = buildIdentityTargets(resource);
  const outcomePoints = buildOutcomePoints(resource);
  const levelLabel = formatLevel(resource.level);
  const outcomeHint = buildOutcomeHint(resource);
  const comparisonAnchor = buildComparisonAnchor(resource, relatedResources);

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
    downloadCount: resource.resourceStat?.downloads ?? resource.downloadCount,
    author: resource.author,
    category: resource.category,
    mimeType: resource.mimeType ?? null,
    fileSize: resource.fileSize ?? undefined,
    updatedAt: resource.updatedAt ?? undefined,
    averageRating: trustSummary.averageRating,
    reviewCount: trustSummary.totalReviews,
    salesCount: trustSummary.totalSales,
    recentDownloads: resource.resourceStat?.last30dDownloads ?? 0,
    recentSales: resource.resourceStat?.last30dPurchases ?? 0,
    levelLabel,
    outcomeHint,
    comparisonAnchor,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <PageContainer className="py-8 sm:py-10 lg:py-12">
          <PageContentWide className="space-y-8 lg:space-y-10">
            <section className="rounded-[32px] border border-surface-200 bg-gradient-to-br from-white via-white to-brand-50/30 p-4 shadow-card sm:p-6 lg:p-8">
              <div className="space-y-6 lg:space-y-8">
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
                  averageRating={trustSummary.averageRating}
                  reviewCount={trustSummary.totalReviews}
                  salesCount={trustSummary.totalSales}
                  downloadCount={resource.resourceStat?.downloads ?? resource.downloadCount}
                />

                {/* Payment feedback banners */}
                {paymentStatus === "success" && (
                  <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
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
                    {relatedResources.length > 0 && (
                      <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Next best action
                        </p>
                        <p className="mt-1 text-[13px] text-emerald-900">
                          Keep going with similar resources from the same study flow.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {relatedResources.slice(0, 2).map((related) => (
                            <Link
                              key={related.id}
                              href={`/resources/${related.slug}`}
                              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-800 transition hover:bg-emerald-100"
                            >
                              {related.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentStatus === "cancelled" && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 shadow-sm">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-[13px] text-amber-700">
                      Payment was cancelled. You have not been charged.
                    </p>
                  </div>
                )}

                {/* Gallery: thumbnails | preview | purchase card (3 columns on lg, equal height) */}
                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[80px_1fr_320px]">
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
              </div>
            </section>

            {/* Sections: About → Included files → Tags → Creator card → Related resources */}
            <div className="space-y-10 lg:space-y-12">
              <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                      What you&apos;ll achieve
                    </p>
                    <h2 className="font-display text-lg font-semibold text-zinc-900">
                      Move faster with a clearer study path
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {outcomePoints.map((point) => (
                      <li key={point} className="flex gap-3 text-[14px] leading-7 text-zinc-600">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                      Best for
                    </p>
                    <h2 className="font-display text-lg font-semibold text-zinc-900">
                      Learners who want a stronger starting point
                    </h2>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {identityTargets.map((target) => (
                      <span
                        key={target}
                        className="inline-flex rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-[13px] font-medium text-zinc-700"
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-[13px] leading-6 text-zinc-500">
                    A good fit if you want less guesswork, a cleaner study workflow, and something you can revisit when it matters.
                  </p>
                </div>
              </section>

              <ResourceDescription title="About" description={resource.description} />
              <ResourceFiles files={includedFiles} />
              {userId && isOwned ? (
                <ResourceReviewForm
                  resourceId={resource.id}
                  resourceTitle={resource.title}
                  existingReview={viewerReview}
                />
              ) : null}
              <ResourceReviews reviews={reviews} resourceTitle={resource.title} />
              <TagList tags={resource.tags.map((rt) => rt.tag)} />
              <CreatorCard creator={{ id: resource.author.id, name: resource.author.name, image: resource.author.image }} />
              <RelatedResources resources={relatedResources} ownedIds={ownedRelatedIds} />
            </div>

            {/* Back link */}
            <div className="border-t border-surface-200 pt-6">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Discover more resources
              </Link>
            </div>
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}
