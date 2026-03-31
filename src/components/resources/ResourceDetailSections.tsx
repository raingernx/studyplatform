import Link from "next/link";
import { CheckCircle, Download } from "lucide-react";
import { AutoScrollOnSuccess } from "@/components/resource/AutoScrollOnSuccess";
import { PurchaseCard } from "@/components/resource/PurchaseCard";
import { ResourceDescription } from "@/components/resource/ResourceDescription";
import { ResourceFiles } from "@/components/resource/ResourceFiles";
import { TagList } from "@/components/resource/TagList";
import { CreatorCard } from "@/components/resource/CreatorCard";
import { RelatedResources } from "@/components/resource/RelatedResources";
import { ResourceReviews } from "@/components/resource/ResourceReviews";
import { ResourceReviewForm } from "@/components/resource/ResourceReviewForm";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  getResourceDetailPageBodyContent,
  getResourceDetailPageFooterContent,
  getResourceDetailPagePurchaseMeta,
  getResourceDetailPageRelatedSection,
  getResourceDetailPageResource,
  getResourceDetailPageReviewList,
  getResourceDetailPageViewerReview,
} from "@/services/resources/resource-detail-page.service";
import { runNonCriticalResourceDetailTask } from "@/services/resources/resource-detail-resilience";

type OptionalSession = {
  user?: { id?: string; subscriptionStatus?: string };
} | null;

export function ResourceDetailBodyFallback() {
  return (
    <div className="space-y-3 py-2">
      <LoadingSkeleton className="h-5 w-24 rounded-lg" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
        <LoadingSkeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function ResourceDetailReviewsFallback() {
  return (
    <div className="space-y-3 border-t border-surface-200 pt-6">
      <div className="space-y-1">
        <LoadingSkeleton className="h-5 w-24 rounded-lg" />
        <LoadingSkeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <LoadingSkeleton key={s} className="h-4 w-4" />
                ))}
              </div>
              <LoadingSkeleton className="h-3 w-16" />
            </div>
            <div className="mt-2 space-y-1.5">
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourceDetailOwnerReviewFallback() {
  return null;
}

export function ResourceDetailFooterFallback() {
  return (
    <>
      <div className="space-y-4 border-t border-surface-200 pt-6">
        <LoadingSkeleton className="h-5 w-16 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {[72, 96, 64, 88, 80].map((w) => (
            <LoadingSkeleton key={w} className="h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="space-y-4 border-t border-surface-200 pt-6">
        <LoadingSkeleton className="h-5 w-20 rounded-lg" />
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-3 w-full" />
            <LoadingSkeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </>
  );
}

export function ResourceDetailRelatedFallback() {
  return (
    <div className="space-y-4 border-t border-surface-200 pt-7">
      <div className="space-y-1.5">
        <LoadingSkeleton className="h-5 w-28 rounded-lg" />
        <LoadingSkeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border-subtle bg-white">
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-3 w-3/4" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourceDetailRelatedQuickLinks({
  categoryName,
  categorySlug,
}: {
  categoryName?: string | null;
  categorySlug?: string | null;
}) {
  if (!categoryName || !categorySlug) {
    return <ResourceDetailRelatedFallback />;
  }

  return (
    <section className="space-y-4 border-t border-surface-200 pt-7">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-zinc-900">More like this</h2>
        <p className="text-small leading-6 text-zinc-500">
          Keep exploring nearby resources while we load tailored suggestions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/categories/${categorySlug}`}
          className="rounded-2xl border border-surface-200 bg-white p-5 transition hover:border-primary-200 hover:bg-primary-50/40"
        >
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-600">
            Category
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Browse more in {categoryName}
          </p>
          <p className="mt-2 text-small leading-6 text-zinc-500">
            Jump straight into similar resources from the same subject area.
          </p>
        </Link>
        <Link
          href="/resources?sort=newest"
          className="rounded-2xl border border-surface-200 bg-white p-5 transition hover:border-primary-200 hover:bg-primary-50/40"
        >
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-600">
            Explore
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            See the newest marketplace picks
          </p>
          <p className="mt-2 text-small leading-6 text-zinc-500">
            Open the latest uploads while the tailored list finishes loading.
          </p>
        </Link>
      </div>
    </section>
  );
}

export async function ResourceDetailPublicReviewsSection({
  resourceTitle,
  reviewListPromise,
}: {
  resourceTitle: string;
  reviewListPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPageReviewList>>>;
}) {
  const reviews = await reviewListPromise;
  return <ResourceReviews reviews={reviews} resourceTitle={resourceTitle} />;
}

export async function ResourceDetailOwnerReviewSection({
  resourceId,
  resourceTitle,
  sessionPromise,
  ownershipPromise,
}: {
  resourceId: string;
  resourceTitle: string;
  sessionPromise: Promise<OptionalSession>;
  ownershipPromise: Promise<{ isOwned: boolean }>;
}) {
  const [{ isOwned }, session] = await Promise.all([ownershipPromise, sessionPromise]);
  const userId = session?.user?.id;

  if (!userId || !isOwned) {
    return null;
  }

  const viewerReview = await runNonCriticalResourceDetailTask(
    () => getResourceDetailPageViewerReview(userId, resourceId),
    {
      context: { resourceId, section: "viewer-review" },
      fallback: null,
    },
  );

  return (
    <ResourceReviewForm
      resourceId={resourceId}
      resourceTitle={resourceTitle}
      existingReview={viewerReview}
    />
  );
}

export async function ResourceDetailBodySection({
  bodyContentPromise,
}: {
  bodyContentPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPageBodyContent>>>;
}) {
  const content = await bodyContentPromise;

  if (!content) {
    return null;
  }

  const includedFiles = content.fileName
    ? [{ name: content.fileName, size: content.fileSize ?? undefined }]
    : content.fileUrl ?? content.fileKey
      ? [
          {
            name:
              content.fileKey?.split("/").pop() ||
              (content.type === "PDF" ? "Downloadable PDF" : "Downloadable file"),
            size: content.fileSize ?? undefined,
          },
        ]
      : [];

  return (
    <>
      <ResourceDescription title="About" description={content.description} />
      <ResourceFiles files={includedFiles} />
    </>
  );
}

export async function ResourceDetailRelatedSection({
  resourceId,
  categoryId,
  currentIsFree,
  currentPrice,
  currentRating,
  currentSales,
  currentDownloads,
}: {
  resourceId: string;
  categoryId?: string | null;
  currentIsFree: boolean;
  currentPrice: number;
  currentRating: number;
  currentSales: number;
  currentDownloads: number;
}) {
  const { relatedResources } =
    await runNonCriticalResourceDetailTask(
      () =>
        getResourceDetailPageRelatedSection({
          resourceId,
          categoryId,
          take: 4,
        }),
      {
        context: {
          resourceId,
          section: "related-resources",
        },
        fallback: {
          relatedResources: [],
        },
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
    <RelatedResources resources={relatedResourcesWithBadges} />
  );
}

export async function ResourceDetailFooterSection({
  footerContentPromise,
}: {
  footerContentPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPageFooterContent>>>;
}) {
  const content = await footerContentPromise;

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

export async function ResourceDetailSuccessShell({
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
        {hasFile ? (
          <a
            href={`/api/download/${resourceId}`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
          >
            <Download className="h-3.5 w-3.5" />
            Download instantly
          </a>
        ) : null}
      </div>
      <AutoScrollOnSuccess enabled />
    </>
  );
}

export function ResourceDetailSuccessSkeleton({
  hasFile,
}: {
  hasFile: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100/70 bg-emerald-50/70 px-5 py-4">
      <div className="flex items-start gap-3">
        <LoadingSkeleton className="mt-0.5 h-5 w-5 rounded-full bg-emerald-200" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-56 bg-emerald-200/80" />
          <LoadingSkeleton className="h-3.5 w-32 bg-emerald-200/70" />
        </div>
      </div>
      {hasFile ? (
        <LoadingSkeleton className="h-9 w-36 rounded-xl bg-emerald-200/80" />
      ) : null}
    </div>
  );
}

export function ResourceDetailPurchaseCard({
  resource,
  sessionPromise,
  purchaseMetaPromise,
  ownershipPromise,
  trustSummaryPromise,
  isReturningFromCheckout,
  hasFile,
  levelLabel,
  outcomeHint,
}: {
  resource: NonNullable<Awaited<ReturnType<typeof getResourceDetailPageResource>>>;
  sessionPromise: Promise<OptionalSession>;
  purchaseMetaPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPagePurchaseMeta>>>;
  ownershipPromise: Promise<{ isOwned: boolean }>;
  trustSummaryPromise: Promise<{ averageRating: number | null; totalReviews: number; totalSales: number }>;
  isReturningFromCheckout: boolean;
  hasFile: boolean;
  levelLabel: string | null;
  outcomeHint: string;
}) {
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
    levelLabel,
    outcomeHint,
  };

  return (
    <PurchaseCard
      resource={purchaseCardResource}
      sessionPromise={sessionPromise}
      purchaseMetaPromise={purchaseMetaPromise}
      hasFile={hasFile}
      isReturningFromCheckout={isReturningFromCheckout}
      ownershipPromise={ownershipPromise}
      trustSummaryPromise={trustSummaryPromise}
    />
  );
}
