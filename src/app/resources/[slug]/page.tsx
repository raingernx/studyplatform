import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getCachedServerSession } from "@/lib/auth";
import { isMissingTableError } from "@/lib/prismaErrors";
import { logActivity } from "@/lib/activity";
import { AlertCircle, BookOpen, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import { ResourceHeader } from "@/components/resource/ResourceHeader";
import { ResourceGallery } from "@/components/resource/ResourceGallery";
import { PurchaseCardSkeleton } from "@/components/resource/PurchaseCardSkeleton";
import { ResourceDetailShell } from "@/components/resources/ResourceDetailShell";
import {
  ResourceDetailBodyFallback,
  ResourceDetailBodySection,
  ResourceDetailFooterFallback,
  ResourceDetailFooterSection,
  ResourceDetailPurchaseCard,
  ResourceDetailRelatedFallback,
  ResourceDetailRelatedSection,
  ResourceDetailReviewsFallback,
  ResourceDetailReviewSection,
  ResourceDetailSuccessShell,
  ResourceDetailSuccessSkeleton,
} from "@/components/resources/ResourceDetailSections";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import {
  getResourceDetailPageBodyContent,
  getResourceDetailPageExtras,
  getResourceDetailPageFooterContent,
  getResourceDetailPagePurchaseMeta,
  getResourceDetailPageRelatedSection,
  getResourceDetailPageResource,
  getResourceDetailPageReviewList,
  getResourceDetailPageReviewSection,
  getResourceDetailPageTrustSummary,
} from "@/services/resources/resource-detail-page.service";
import {
  logResourceDetailFailure,
  runNonCriticalResourceDetailTask,
} from "@/services/resources/resource-detail-resilience";
import { traceServerStep, updateRequestPerformanceDetails, withRequestPerformanceTrace } from "@/lib/performance/observability";
import { routes } from "@/lib/routes";

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
    return await getCachedServerSession();
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
  hasFile: boolean;
}) {
  const subject = resource.category?.name ?? "your subject";
  const formatLabel = resource.type === "PDF" ? "PDF" : "document";

  const points = [
    `Focus your ${subject.toLowerCase()} study sessions with one organized ${formatLabel} instead of collecting scattered material.`,
    `Work from a clearer starting point so you can spend more time reviewing and less time setting up.`,
  ];

  if (resource.hasFile) {
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

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const resource = await getResourceDetailPageResource(slug);

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
      const sessionPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.optional_session",
            () => getOptionalSession(),
            { slug },
          ),
        {
          fallback: null,
          context: {
            section: "optional-session",
            slug,
          },
        },
      );

      const resourceSettled = await Promise.allSettled([
        traceServerStep(
          "resource_detail.getResourceBySlug",
          () => getResourceDetailPageResource(slug),
          { slug },
        ),
      ]);
      const resourceResult = resourceSettled[0];

      if (resourceResult.status === "rejected") {
        const error = resourceResult.reason;
        logResourceDetailFailure(
          {
            critical: true,
            section: "resource",
            slug,
          },
          error,
          0,
        );
        if (!isMissingTableError(error)) throw error;
        // Resource table missing (local dev schema drift) — render 404.
        notFound();
      }

      const resource = resourceResult.value;

      if (!resource || resource.status !== "PUBLISHED") {
        notFound();
      }

      const trustSummaryPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.getResourceDetailTrustSummary",
            () =>
              getResourceDetailPageTrustSummary({
                resourceId: resource.id,
                resourceAverageRating: null,
                resourceSalesCount: resource.resourceStat?.purchases ?? null,
                resourceTotalReviews: 0,
              }),
            {
              slug,
            },
          ),
        {
          fallback: {
            averageRating: null,
            totalReviews: 0,
            totalSales: resource.resourceStat?.purchases ?? 0,
          },
          context: {
            resourceId: resource.id,
            section: "trust-summary",
            slug,
          },
        },
      );
      const ownershipPromise = sessionPromise.then((session) => {
        const userId = session?.user?.id;

        if (!userId) {
          return { isOwned: false };
        }

        return runNonCriticalResourceDetailTask(
          () =>
            traceServerStep(
              "resource_detail.getResourceDetailOwnership",
              () =>
                getResourceDetailPageExtras({
                  resourceId: resource.id,
                  userId,
                }),
              {
                personalized: true,
                slug,
              },
            ),
          {
            fallback: { isOwned: false },
            context: {
              resourceId: resource.id,
              section: "ownership",
              slug,
            },
          },
        );
      });
      const bodyContentPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.getResourceDetailBodyContent",
            () => getResourceDetailPageBodyContent(slug),
            { slug },
          ),
        {
          fallback: null,
          context: {
            resourceId: resource.id,
            section: "body-content",
            slug,
          },
        },
      );
      const footerContentPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.getResourceDetailFooterContent",
            () => getResourceDetailPageFooterContent(slug),
            { slug },
          ),
        {
          fallback: null,
          context: {
            resourceId: resource.id,
            section: "footer-content",
            slug,
          },
        },
      );
      const purchaseMetaPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.getResourceDetailPurchaseMeta",
            () => getResourceDetailPagePurchaseMeta(slug),
            { slug },
          ),
        {
          fallback: null,
          context: {
            resourceId: resource.id,
            section: "purchase-meta",
            slug,
          },
        },
      );
      // Fetch public reviews in parallel with ownership — reviews are public
      // content and do not depend on whether the user owns the resource.
      const reviewListPromise = runNonCriticalResourceDetailTask(
        () =>
          traceServerStep(
            "resource_detail.getReviewList",
            () => getResourceDetailPageReviewList(resource.id, 5),
            { slug },
          ),
        {
          fallback: [],
          context: {
            resourceId: resource.id,
            section: "review-list",
            slug,
          },
        },
      );

      const hasFile = Boolean(resource.fileUrl ?? resource.fileKey);
      const isReturningFromCheckout = paymentStatus === "success";

  const fallbackPreviewUrl = resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null;
  const identityTargets = buildIdentityTargets(resource);
  const outcomePoints = buildOutcomePoints({
    category: resource.category,
    type: resource.type,
    hasFile,
  });
  const levelLabel = formatLevel(resource.level);
  const outcomeHint = buildOutcomeHint(resource);

  sessionPromise
    .then((session) => {
      updateRequestPerformanceDetails({
        hasSession: Boolean(session?.user?.id),
      });

      return logActivity({
        userId: session?.user?.id,
        action: "RESOURCE_VIEW",
        entity: "Resource",
        entityId: resource.id,
        metadata: {
          slug: resource.slug,
          title: resource.title,
          categoryId: resource.categoryId,
          isFree: resource.isFree || resource.price === 0,
        },
      });
    })
    .catch((error) => {
      console.error("[RESOURCE_PAGE] Failed to resolve session or log resource detail view activity:", error);
    });

  return (
    <ResourceDetailShell>
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
              <Suspense fallback={<ResourceDetailSuccessSkeleton hasFile={hasFile} />}>
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

                {/* 4. About + 5. Included files */}
                <Suspense fallback={<ResourceDetailBodyFallback />}>
                  <ResourceDetailBodySection
                    bodyContentPromise={bodyContentPromise}
                  />
                </Suspense>

                {/* 6. Reviews */}
                <Suspense fallback={<ResourceDetailReviewsFallback />}>
                  <ResourceDetailReviewSection
                    sessionPromise={sessionPromise}
                    ownershipPromise={ownershipPromise}
                    reviewListPromise={reviewListPromise}
                    resourceId={resource.id}
                    resourceTitle={resource.title}
                  />
                </Suspense>

                {/* 8. Tags + 9. Creator */}
                <Suspense fallback={<ResourceDetailFooterFallback />}>
                  <ResourceDetailFooterSection
                    footerContentPromise={footerContentPromise}
                  />
                </Suspense>

              </div>

              {/* PURCHASE CARD — order-2 mobile, col-2 rows 1–2 desktop */}
              <aside id="purchase-card" className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
                <Suspense fallback={<PurchaseCardSkeleton />}>
                  <ResourceDetailPurchaseCard
                    resource={resource}
                    sessionPromise={sessionPromise}
                    purchaseMetaPromise={purchaseMetaPromise}
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
            <Suspense fallback={<ResourceDetailRelatedFallback />}>
              <ResourceDetailRelatedSection
                currentDownloads={resource.resourceStat?.downloads ?? resource.downloadCount ?? 0}
                currentIsFree={resource.isFree || resource.price === 0}
                currentPrice={resource.price ?? 0}
                currentRating={0}
                currentSales={resource.resourceStat?.purchases ?? 0}
                categoryId={resource.categoryId}
                resourceId={resource.id}
                sessionPromise={sessionPromise}
              />
            </Suspense>

            <section className="space-y-4 border-t border-surface-200 pt-6">
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

            {/* Back link */}
            <div className="border-t border-surface-200 pt-6">
              <IntentPrefetchLink
                href={routes.marketplace}
                prefetchMode="intent"
                prefetchScope="resource-detail-back-link"
                prefetchLimit={1}
                resourcesNavigationMode="discover"
                className="inline-flex items-center gap-1.5 text-small font-medium text-zinc-500 transition hover:text-zinc-800"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Discover more resources
              </IntentPrefetchLink>
            </div>

      </div>
    </ResourceDetailShell>
  );
    },
  );
}
