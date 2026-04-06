import Link from "next/link";
import { ResourceDescription } from "./ResourceDescription";
import { ResourceFiles } from "./ResourceFiles";
import { TagList } from "./TagList";
import { CreatorCard } from "./CreatorCard";
import { RelatedResources } from "./RelatedResources";
import { ResourceReviews } from "./ResourceReviews";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { getBuildSafePlatformConfig } from "@/services/platform";
import {
  getResourceDetailPageBodyContent,
  getResourceDetailPageFooterContent,
  getResourceDetailPagePurchaseMeta,
  getResourceDetailPageRelatedSection,
  getResourceDetailPageResource,
  getResourceDetailPageReviewList,
} from "@/services/resources";
import { runNonCriticalResourceDetailTask } from "@/services/resources";
import {
  ResourceDetailOwnerReviewClient,
  ResourceDetailOwnerReviewSlotSkeleton,
} from "./ResourceDetailOwnerReviewClient";
import { ResourceDetailPurchaseCardClient } from "./ResourceDetailPurchaseCardClient";
import { ResourceDetailSuccessClient } from "./ResourceDetailSuccessClient";

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
    <div className="space-y-3 border-t border-border pt-6">
      <div className="space-y-1">
        <LoadingSkeleton className="h-5 w-24 rounded-lg" />
        <LoadingSkeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card px-4 py-4">
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
  return <ResourceDetailOwnerReviewSlotSkeleton />;
}

export function ResourceDetailFooterFallback() {
  return (
    <>
      <div className="space-y-4 border-t border-border pt-6">
        <LoadingSkeleton className="h-5 w-16 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {[72, 96, 64, 88, 80].map((w) => (
            <LoadingSkeleton key={w} className="h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="space-y-4 border-t border-border pt-6">
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
    <div className="space-y-4 border-t border-border pt-7">
      <div className="space-y-1.5">
        <LoadingSkeleton className="h-5 w-28 rounded-lg" />
        <LoadingSkeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
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
    <section className="space-y-4 border-t border-border pt-7">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-foreground">More like this</h2>
        <p className="text-small leading-6 text-muted-foreground">
          Keep exploring nearby resources while we load tailored suggestions.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/categories/${categorySlug}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:border-primary-200 hover:bg-primary-50"
        >
          Browse {categoryName}
        </Link>
        <Link
          href="/resources?sort=newest"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:border-primary-200 hover:bg-primary-50"
        >
          See newest picks
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-3 w-3/4" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
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
}: {
  resourceId: string;
  resourceTitle: string;
}) {
  return (
    <ResourceDetailOwnerReviewClient
      resourceId={resourceId}
      resourceTitle={resourceTitle}
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
  hasFile,
  resourceId,
  resourceTitle,
}: {
  hasFile: boolean;
  resourceId: string;
  resourceTitle: string;
}) {
  return (
    <ResourceDetailSuccessClient
      resourceId={resourceId}
      hasFile={hasFile}
      resourceTitle={resourceTitle}
    />
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
  purchaseMetaPromise,
  trustSummaryPromise,
  isReturningFromCheckout,
  hasFile,
  levelLabel,
  outcomeHint,
}: {
  resource: NonNullable<Awaited<ReturnType<typeof getResourceDetailPageResource>>>;
  purchaseMetaPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPagePurchaseMeta>>>;
  trustSummaryPromise: Promise<{ averageRating: number | null; totalReviews: number; totalSales: number }>;
  isReturningFromCheckout: boolean;
  hasFile: boolean;
  levelLabel: string | null;
  outcomeHint: string;
}) {
  const platform = getBuildSafePlatformConfig();
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
    <ResourceDetailPurchaseCardAsync
      resource={purchaseCardResource}
      purchaseMetaPromise={purchaseMetaPromise}
      trustSummaryPromise={trustSummaryPromise}
      hasFile={hasFile}
      isReturningFromCheckout={isReturningFromCheckout}
      platformShortName={platform.platformShortName}
    />
  );
}

async function ResourceDetailPurchaseCardAsync({
  resource,
  purchaseMetaPromise,
  trustSummaryPromise,
  hasFile,
  isReturningFromCheckout,
  platformShortName,
}: {
  resource: {
    id: string;
    title: string;
    slug: string;
    price: number;
    isFree: boolean;
    type: string;
    downloadCount: number;
    author: { id: string; name: string | null };
    category: { id: string; name: string; slug: string } | null;
    levelLabel: string | null;
    outcomeHint: string;
  };
  purchaseMetaPromise: Promise<Awaited<ReturnType<typeof getResourceDetailPagePurchaseMeta>>>;
  trustSummaryPromise: Promise<{ averageRating: number | null; totalReviews: number; totalSales: number }>;
  hasFile: boolean;
  isReturningFromCheckout: boolean;
  platformShortName: string;
}) {
  const [purchaseMeta, trustSummary] = await Promise.all([
    purchaseMetaPromise,
    trustSummaryPromise,
  ]);
  const purchaseCardResource = {
    ...resource,
  };

  return (
    <ResourceDetailPurchaseCardClient
      resource={purchaseCardResource}
      purchaseMeta={purchaseMeta}
      trustSummary={trustSummary}
      hasFile={hasFile}
      isReturningFromCheckout={isReturningFromCheckout}
      platformShortName={platformShortName}
    />
  );
}
