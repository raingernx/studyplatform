import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { isMissingTableError } from "@/lib/prismaErrors";
import { logActivity } from "@/lib/activity";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { AlertCircle, BookOpen, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import { formatFileSize } from "@/lib/format";
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
import { PendingPurchasePoller } from "@/components/checkout/PendingPurchasePoller";
import { AutoScrollOnSuccess } from "@/components/resource/AutoScrollOnSuccess";
import {
  getResourceBySlug,
  getResourceDetailDeferredContent,
  getResourceMetadataBySlug,
} from "@/services/resource.service";
import {
  getResourceDetailExtras,
  getResourceDetailRelatedSection,
  getResourceDetailReviewSection,
  getResourceDetailTrustSummary,
} from "@/services/resources/resource.service";
import {
  traceServerStep,
  updateRequestPerformanceDetails,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasSessionTokenCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return (
    cookieStore.has("next-auth.session-token") ||
    cookieStore.has("__Secure-next-auth.session-token") ||
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token")
  );
}

async function getOptionalSession() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  if (!cookieStore || !hasSessionTokenCookie(cookieStore)) {
    return null;
  }

  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    return null;
  }
}

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
  const resource = await getResourceMetadataBySlug(slug);

  return {
    title: resource ? resource.title : "Resource",
    description: resource?.description?.slice(0, 155) ?? "",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const paymentStatus =
    typeof resolvedSearchParams.payment === "string"
      ? resolvedSearchParams.payment
      : undefined;

  return withRequestPerformanceTrace(
    "route:/resources/[slug]",
    {
      paymentStatus: paymentStatus ?? "",
      slug,
    },
    async () => {
      let resource;
      try {
        resource = await traceServerStep(
          "resource_detail.getResourceBySlug",
          () => getResourceBySlug(slug),
          { slug },
        );
      } catch (error) {
        if (!isMissingTableError(error)) throw error;
        // Resource table missing (local dev schema drift) — render 404.
        notFound();
      }

      if (!resource || resource.status !== "PUBLISHED") {
        notFound();
      }

      const trustSummaryPromise = traceServerStep(
        "resource_detail.getResourceDetailTrustSummary",
        () =>
          getResourceDetailTrustSummary({
            resourceId: resource.id,
            resourceAverageRating: resource.averageRating ?? null,
            resourceSalesCount: resource.resourceStat?.purchases ?? null,
            resourceTotalReviews: resource.visibleReviewCount ?? 0,
          }),
        {
          slug,
        },
      );
      const requestHeadersPromise = headers();

      const session = await traceServerStep(
        "resource_detail.optional_session",
        () => getOptionalSession(),
        { slug },
      );
      const userId = session?.user?.id;
      updateRequestPerformanceDetails({
        hasSession: Boolean(userId),
      });

      const ownershipPromise = userId
        ? traceServerStep(
            "resource_detail.getResourceDetailOwnership",
            () =>
              getResourceDetailExtras({
                resourceId: resource.id,
                userId,
              }),
            {
              personalized: true,
              slug,
            },
          )
        : Promise.resolve({ isOwned: false });

      const requestHeaders = await requestHeadersPromise;
      const userAgent = requestHeaders.get("user-agent");
      const hasFile = Boolean(resource.fileUrl ?? resource.fileKey);
      const isReturningFromCheckout = paymentStatus === "success";

  const fallbackPreviewUrl = resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null;
  const includedFiles = buildIncludedFiles(resource);
  const identityTargets = buildIdentityTargets(resource);
  const outcomePoints = buildOutcomePoints(resource);
  const levelLabel = formatLevel(resource.level);
  const outcomeHint = buildOutcomeHint(resource);

  logActivity({
    userId,
    action: "RESOURCE_VIEW",
    entity: "Resource",
    entityId: resource.id,
    userAgent,
    metadata: {
      slug: resource.slug,
      title: resource.title,
      categoryId: resource.categoryId,
      isFree: resource.isFree || resource.price === 0,
    },
  }).catch(() => {});

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="space-y-6 lg:space-y-9">

            {/* ── Full-width header ───────────────────────────────────────── */}
            <ResourceHeader
              breadcrumb={[
                { label: "Home", href: "/" },
                ...(resource.category
                  ? [{ label: resource.category.name, href: `/categories/${resource.category.slug}` }]
                  : []),
              ]}
              title={resource.title}
              creatorName={resource.author.name}
              creatorHref={resource.author.creatorSlug ? `/creators/${resource.author.creatorSlug}` : null}
              featured={resource.featured}
              downloadCount={resource.resourceStat?.downloads ?? resource.downloadCount}
            />

            {/* Payment feedback banners */}
            {/*
              Confirmed — webhook already processed before the user landed.
              Show a brief reassurance notice. The PurchaseCard below already
              displays the Download button in owned state.
            */}
            {isReturningFromCheckout && (
              <Suspense fallback={null}>
                <ResourceDetailSuccessShell
                  ownershipPromise={ownershipPromise}
                  hasFile={hasFile}
                  resourceId={resource.id}
                />
              </Suspense>
            )}

            {paymentStatus === "cancelled" && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-[13px] text-amber-700">
                  Payment was cancelled. You have not been charged.
                </p>
              </div>
            )}

            {/* ── Main two-column grid ────────────────────────────────────── */}
            {/*
              Desktop: col-1 row-1 = Gallery, col-1 row-2 = content,
                       col-2 rows 1-2 = sticky PurchaseCard
              Mobile:  Gallery (order-1) → PurchaseCard (order-2) → content (order-3)
            */}
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">

              {/* GALLERY — order-1 mobile, col-1 row-1 desktop */}
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[80px_minmax(0,1fr)]">
                  <ResourceGallery
                    previews={resource.previews}
                    resourceTitle={resource.title}
                    fallbackImageUrl={fallbackPreviewUrl}
                  />
                </div>
              </div>

              {/* CONTENT — order-3 mobile, col-1 row-2 desktop */}
              <div className="order-3 space-y-7 lg:col-start-1 lg:row-start-2">

                <section className="space-y-4 border-t border-surface-200 pt-5">
                  {((resource.fileSize != null && resource.fileSize > 0) ||
                    resource.type ||
                    hasFile) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-zinc-500">
                      <span className="font-medium text-zinc-700">Included</span>
                      {resource.type && (
                        <span>
                          {resource.type === "PDF"
                            ? "PDF document"
                            : resource.type}
                        </span>
                      )}
                      {resource.fileSize != null &&
                        resource.fileSize > 0 && (
                          <span>{formatFileSize(resource.fileSize)}</span>
                        )}
                      {hasFile && <span className="text-emerald-600">Ready to download</span>}
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-caption font-semibold text-primary-700">
                          What you&apos;ll achieve
                        </p>
                        <h2 className="font-display text-xl font-semibold text-zinc-900">
                          Move faster with a clearer study path
                        </h2>
                      </div>
                      <ul className="space-y-3">
                        {outcomePoints.map((point) => (
                          <li key={point} className="flex gap-3 text-body leading-7 text-zinc-600">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4 border-t border-surface-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <div className="space-y-1.5">
                        <p className="text-caption font-semibold text-primary-700">
                          Best for
                        </p>
                        <h2 className="font-display text-xl font-semibold text-zinc-900">
                          Learners who want a stronger starting point
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {identityTargets.map((target) => (
                          <span
                            key={target}
                            className="inline-flex rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-small font-medium text-zinc-700"
                          >
                            {target}
                          </span>
                        ))}
                      </div>
                      <p className="text-small leading-6 text-zinc-500">
                        A good fit if you want less guesswork, a cleaner study workflow, and
                        something you can revisit when it matters.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 4. About + 5. Included files */}
                <Suspense fallback={
                  <div className="space-y-3 py-2">
                    <div className="h-5 w-24 animate-pulse rounded-lg bg-surface-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-surface-100" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-surface-100" />
                    </div>
                  </div>
                }>
                  <ResourceDetailBodySection
                    includedFiles={includedFiles}
                    slug={resource.slug}
                  />
                </Suspense>

                {/* 6. Reviews */}
                <Suspense fallback={null}>
                  <ResourceDetailReviewSection
                    ownershipPromise={ownershipPromise}
                    resourceId={resource.id}
                    resourceTitle={resource.title}
                    userId={userId}
                  />
                </Suspense>

                {/* 8. Tags + 9. Creator */}
                <Suspense fallback={null}>
                  <ResourceDetailFooterSection slug={resource.slug} />
                </Suspense>

              </div>

              {/* PURCHASE CARD — order-2 mobile, col-2 rows 1–2 desktop */}
              <aside id="purchase-card" className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
                <Suspense fallback={<div className="h-[440px] rounded-[28px] border border-surface-200 bg-white/85 shadow-sm" />}>
                  <ResourceDetailPurchaseCard
                    resource={resource}
                    session={session}
                    ownershipPromise={ownershipPromise}
                    trustSummaryPromise={trustSummaryPromise}
                    isReturningFromCheckout={isReturningFromCheckout}
                    hasFile={hasFile}
                    levelLabel={levelLabel}
                    outcomeHint={outcomeHint}
                  />
                </Suspense>
              </aside>
            </div>

            {/* ── Related resources — outside the two-column grid ─────────── */}
            <Suspense fallback={null}>
              <ResourceDetailRelatedSection
                currentDownloads={resource.resourceStat?.downloads ?? resource.downloadCount ?? 0}
                currentIsFree={resource.isFree || resource.price === 0}
                currentPrice={resource.price ?? 0}
                currentRating={resource.averageRating ?? 0}
                currentSales={resource.resourceStat?.purchases ?? 0}
                categoryId={resource.categoryId}
                resourceId={resource.id}
                userId={userId}
              />
            </Suspense>

            {/* Back link */}
            <div className="border-t border-surface-200 pt-6">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-small font-medium text-zinc-500 transition hover:text-zinc-800"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Discover more resources
              </Link>
            </div>

          </div>
        </Container>
      </main>
    </div>
  );
    },
  );
}

async function ResourceDetailReviewSection({
  resourceId,
  resourceTitle,
  userId,
  ownershipPromise,
}: {
  resourceId: string;
  resourceTitle: string;
  userId?: string;
  ownershipPromise: Promise<{ isOwned: boolean }>;
}) {
  const { isOwned } = await ownershipPromise;
  const { reviews, viewerReview } = await traceServerStep(
    "resource_detail.getResourceDetailReviewSection",
    () =>
      getResourceDetailReviewSection({
        resourceId,
        userId,
        isOwned,
        reviewTake: 5,
      }),
    {
      isOwned,
      personalized: Boolean(userId),
      resourceId,
    },
  );

  return (
    <>
      <ResourceReviews reviews={reviews} resourceTitle={resourceTitle} />
      {userId && isOwned ? (
        <ResourceReviewForm
          resourceId={resourceId}
          resourceTitle={resourceTitle}
          existingReview={viewerReview}
        />
      ) : null}
    </>
  );
}

async function ResourceDetailBodySection({
  slug,
  includedFiles,
}: {
  slug: string;
  includedFiles: Array<{ name: string; size?: number | null }>;
}) {
  const content = await traceServerStep(
    "resource_detail.getResourceDetailDeferredContent",
    () => getResourceDetailDeferredContent(slug),
    { slug },
  );

  if (!content) {
    return null;
  }

  return (
    <>
      <ResourceDescription title="About" description={content.description} />
      <ResourceFiles files={includedFiles} />
    </>
  );
}

async function ResourceDetailRelatedSection({
  resourceId,
  categoryId,
  userId,
  currentIsFree,
  currentPrice,
  currentRating,
  currentSales,
  currentDownloads,
}: {
  resourceId: string;
  categoryId?: string | null;
  userId?: string;
  currentIsFree: boolean;
  currentPrice: number;
  currentRating: number;
  currentSales: number;
  currentDownloads: number;
}) {
  const { relatedResources, ownedRelatedIds } = await traceServerStep(
    "resource_detail.getResourceDetailRelatedSection",
    () =>
      getResourceDetailRelatedSection({
        resourceId,
        categoryId,
        userId,
        take: 4,
      }),
    {
      categoryId: categoryId ?? null,
      personalized: Boolean(userId),
      resourceId,
    },
  );

  const relatedResourcesWithBadges = relatedResources.map((resource) => {
    const relatedIsFree = resource.isFree || (resource.price ?? 0) === 0;
    let badge: string | null = null;

    if (relatedIsFree && !currentIsFree) {
      badge = "Free alternative";
    } else if (!relatedIsFree && !currentIsFree && (resource.price ?? 0) < currentPrice) {
      badge = "Cheaper";
    } else if ((resource.rating ?? 0) > currentRating && currentRating > 0) {
      badge = "Higher rated";
    } else if ((resource.salesCount ?? 0) > currentSales && currentSales > 0) {
      badge = "More popular";
    } else if ((resource.downloadCount ?? 0) > currentDownloads && currentDownloads > 0) {
      badge = "More downloads";
    }

    return badge ? { ...resource, highlightBadge: badge } : resource;
  });

  return (
    <RelatedResources
      resources={relatedResourcesWithBadges}
      ownedIds={ownedRelatedIds}
    />
  );
}

async function ResourceDetailFooterSection({
  slug,
}: {
  slug: string;
}) {
  const content = await traceServerStep(
    "resource_detail.getResourceDetailDeferredContent",
    () => getResourceDetailDeferredContent(slug),
    { slug },
  );

  if (!content) {
    return null;
  }

  return (
    <>
      <TagList tags={content.tags.map((resourceTag) => resourceTag.tag)} />
      <CreatorCard creator={content.author} />
    </>
  );
}

// ── Deferred components that share the ownership/trust promises ────────────────

async function ResourceDetailSuccessShell({
  ownershipPromise,
  hasFile,
  resourceId,
}: {
  ownershipPromise: Promise<{ isOwned: boolean }>;
  hasFile: boolean;
  resourceId: string;
}) {
  const { isOwned } = await ownershipPromise;
  if (!isOwned) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-[14px] font-semibold text-emerald-800">
              Payment confirmed — your file is ready.
            </p>
            <p className="mt-0.5 text-[13px] text-emerald-700">
              Added to your library.
            </p>
          </div>
        </div>
        {hasFile && (
          <a
            href={`/api/download/${resourceId}`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download instantly
          </a>
        )}
      </div>
      <AutoScrollOnSuccess enabled />
    </>
  );
}

async function ResourceDetailPurchaseCard({
  resource,
  session,
  ownershipPromise,
  trustSummaryPromise,
  isReturningFromCheckout,
  hasFile,
  levelLabel,
  outcomeHint,
}: {
  resource: NonNullable<Awaited<ReturnType<typeof getResourceBySlug>>>;
  session: Awaited<ReturnType<typeof getOptionalSession>>;
  ownershipPromise: Promise<{ isOwned: boolean }>;
  trustSummaryPromise: Promise<{ averageRating: number | null; totalReviews: number; totalSales: number }>;
  isReturningFromCheckout: boolean;
  hasFile: boolean;
  levelLabel: string | null;
  outcomeHint: string;
}) {
  const [{ isOwned }, trustSummary] = await Promise.all([
    ownershipPromise,
    trustSummaryPromise,
  ]);
  const userId = session?.user?.id;
  const isPendingPurchase = isReturningFromCheckout && !isOwned && !!userId;

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
  };

  if (isPendingPurchase) {
    return <PendingPurchasePoller resourceTitle={resource.title} />;
  }

  return (
    <PurchaseCard
      resource={purchaseCardResource}
      isOwned={isOwned}
      hasFile={hasFile}
      session={session}
      isReturningFromCheckout={isReturningFromCheckout && isOwned}
    />
  );
}
