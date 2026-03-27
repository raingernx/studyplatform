import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Download,
  Eye,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PriceLabel } from "@/components/ui/PriceLabel";
import { BuyButton } from "@/components/resources/BuyButton";
import { PendingPurchasePoller } from "@/components/checkout/PendingPurchasePoller";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatFileSize, formatNumber } from "@/lib/format";
import { getPlatform } from "@/services/platform.service";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  DOCUMENT: "Document",
};

const CTA_COPY = {
  free: {
    kicker: "Free to keep",
    proof: "No card needed. Add it to your library and download any time.",
  },
  paid: {
    kicker: "One-time purchase",
    proof: "Pay once. Yours forever — re-download any time, no subscription needed.",
  },
  owned: {
    kicker: "In your library",
    proof: "Your download is ready whenever you need it.",
  },
} as const;

function formatUpdated(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(d);
}

function getRecentActivityLabel(resource: PurchaseCardResource) {
  if ((resource.recentSales ?? 0) > 0) {
    return `${formatNumber(resource.recentSales ?? 0)} ${
      resource.recentSales === 1 ? "purchase" : "purchases"
    } in the last 30 days`;
  }

  if ((resource.recentDownloads ?? 0) > 0) {
    return `${formatNumber(resource.recentDownloads ?? 0)} downloads in the last 30 days`;
  }

  return null;
}

function getRecentActivityHeading(resource: PurchaseCardResource) {
  if ((resource.recentSales ?? 0) >= 5) {
    return "High demand this week";
  }

  if ((resource.recentDownloads ?? 0) >= 25) {
    return "Trending fast";
  }

  return "Recent activity";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PurchaseCardResource {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  type: string;
  downloadCount: number;
  author: { id: string; name: string | null };
  category: { id: string; name: string; slug: string } | null;
  /** MIME type of the primary file — used to decide whether to show a Preview CTA. */
  mimeType?: string | null;
  fileSize?: number | null;
  updatedAt?: Date | string | null;
  pageCount?: number | null;
  recentDownloads?: number;
  recentSales?: number;
  levelLabel?: string | null;
  outcomeHint?: string | null;
  comparisonAnchor?: {
    label: string;
  } | null;
}

type TrustSummary = {
  averageRating: number | null;
  totalReviews: number;
  totalSales: number;
};

interface PurchaseCardProps {
  resource: PurchaseCardResource;
  session: { user?: { id?: string; subscriptionStatus?: string } } | null;
  hasFile: boolean;
  isReturningFromCheckout?: boolean;
  ownershipPromise: Promise<{ isOwned: boolean }>;
  trustSummaryPromise: Promise<TrustSummary>;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

/** Full-card skeleton for the outer Suspense in page.tsx. */
export function PurchaseCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 sm:p-6">
      <div className="space-y-5">
        {/* author/category */}
        <LoadingSkeleton className="h-3.5 w-2/3" />
        {/* price */}
        <LoadingSkeleton className="h-9 w-20" />
        {/* middle skeleton */}
        <PurchaseCardMiddleSkeleton />
      </div>
      <div className="mt-4 space-y-4 border-t border-surface-200 pt-4">
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between gap-3">
              <LoadingSkeleton className="h-3.5 w-16" />
              <LoadingSkeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
        <PurchaseCardMembershipSkeleton />
      </div>
    </div>
  );
}

function PurchaseCardMiddleSkeleton() {
  return (
    <div className="space-y-5">
      {/* kicker pill + proof text */}
      <div className="space-y-2.5">
        <LoadingSkeleton className="h-6 w-32 rounded-full" />
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-4/5" />
        </div>
        <LoadingSkeleton className="h-3.5 w-1/2" />
      </div>
      {/* trust grid */}
      <div className="grid grid-cols-3 gap-4 border-y border-surface-200 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <LoadingSkeleton className="h-3 w-14" />
            <LoadingSkeleton className="h-5 w-10" />
            <LoadingSkeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      {/* benefit items */}
      <div className="flex gap-3">
        {[88, 72, 108].map((w) => (
          <LoadingSkeleton key={w} className="h-3.5" style={{ width: w }} />
        ))}
      </div>
      {/* CTA button */}
      <div className="space-y-3 border-t border-surface-200 pt-4">
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function PurchaseCardMembershipSkeleton() {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className="h-4 w-40" />
      <LoadingSkeleton className="h-3.5 w-full" />
      <LoadingSkeleton className="h-3.5 w-3/4" />
      <LoadingSkeleton className="h-4 w-24" />
    </div>
  );
}

// ── Async subcomponents ───────────────────────────────────────────────────────

/**
 * Renders the card's interactive middle section: kicker, proof, trust grid,
 * benefit items, recent activity, and the primary CTA button.
 *
 * Awaits ownershipPromise + trustSummaryPromise together so that isOwned and
 * trust data are available at the same time. This prevents a partial render
 * where the CTA would appear before trust items or vice versa.
 */
async function PurchaseCardMiddle({
  ownershipPromise,
  trustSummaryPromise,
  resource,
  session,
  hasFile,
  isReturningFromCheckout,
  isFree,
}: {
  ownershipPromise: Promise<{ isOwned: boolean }>;
  trustSummaryPromise: Promise<TrustSummary>;
  resource: PurchaseCardResource;
  session: { user?: { id?: string; subscriptionStatus?: string } } | null;
  hasFile: boolean;
  isReturningFromCheckout: boolean;
  isFree: boolean;
}) {
  const [{ isOwned }, trustSummary] = await Promise.all([
    ownershipPromise,
    trustSummaryPromise,
  ]);

  const userId = session?.user?.id;
  const isPendingPurchase = isReturningFromCheckout && !isOwned && !!userId;

  if (isPendingPurchase) {
    return <PendingPurchasePoller resourceTitle={resource.title} />;
  }

  const ctaCopy = isOwned ? CTA_COPY.owned : isFree ? CTA_COPY.free : CTA_COPY.paid;
  const hasReviews =
    typeof trustSummary.averageRating === "number" && trustSummary.totalReviews > 0;
  const recentActivityLabel = getRecentActivityLabel(resource);
  const recentActivityHeading = getRecentActivityHeading(resource);

  const trustItems: Array<{
    label: string;
    value: string;
    meta: string;
    icon: ReactNode;
  }> = [
    hasReviews
      ? {
          label: "Rating",
          value: trustSummary.averageRating!.toFixed(1),
          meta: `${formatNumber(trustSummary.totalReviews)} reviews`,
          icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />,
        }
      : null,
    trustSummary.totalSales > 0
      ? {
          label: "Sales",
          value: formatNumber(trustSummary.totalSales),
          meta:
            trustSummary.totalSales === 1
              ? "verified purchase"
              : "verified purchases",
          icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />,
        }
      : null,
    resource.downloadCount > 0
      ? {
          label: "Downloads",
          value: formatNumber(resource.downloadCount),
          meta: "library unlocks",
          icon: <Download className="h-3.5 w-3.5 text-zinc-500" />,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const summaryParts = [
    hasReviews ? `${trustSummary.averageRating!.toFixed(1)}★` : null,
    resource.levelLabel ?? null,
    TYPE_LABELS[resource.type] ?? resource.type,
  ].filter(Boolean) as string[];

  const benefitItems = isOwned
    ? []
    : isFree
      ? ["No card needed", "Instant download", "Keep forever"]
      : ["Instant access", "One-time purchase", "Re-download any time"];

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <span className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-caption font-semibold text-zinc-600">
          {ctaCopy.kicker}
        </span>
        <div className="space-y-1.5">
          <p className="max-w-sm text-small leading-6 text-zinc-600">
            {ctaCopy.proof}
          </p>
        </div>
        {summaryParts.length > 0 && (
          <p className="text-caption font-medium text-zinc-600">
            {summaryParts.join(" · ")}
          </p>
        )}
      </div>

      {trustItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 border-y border-surface-200 py-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center gap-2 text-caption font-medium text-zinc-500">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <p className="text-lg font-semibold tracking-tight text-zinc-900">
                {item.value}
              </p>
              <p className="text-caption text-zinc-500">{item.meta}</p>
            </div>
          ))}
        </div>
      )}

      {benefitItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-zinc-600">
          {benefitItems.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{item}</span>
              {index < benefitItems.length - 1 ? (
                <span aria-hidden className="ml-1 text-zinc-300">
                  ·
                </span>
              ) : null}
            </span>
          ))}
        </div>
      )}

      {!isOwned && (trustSummary.totalSales >= 10 || resource.downloadCount >= 50) && (
        <p className="text-caption font-medium text-zinc-500">
          {trustSummary.totalSales >= 10
            ? `Used by ${formatNumber(trustSummary.totalSales)}+ teachers`
            : resource.category
              ? `Popular in ${resource.category.name}`
              : `${formatNumber(resource.downloadCount)}+ learners have this`}
        </p>
      )}

      {recentActivityLabel && !isOwned && (
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <p className="text-caption font-semibold text-primary-700/90">
            {recentActivityHeading}
          </p>
          <p className="mt-1 text-small font-medium text-primary-900">{recentActivityLabel}</p>
        </div>
      )}

      <div className="space-y-3 border-t border-surface-200 pt-4">
        {isOwned && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-small font-medium text-emerald-700">
              Added to your library
            </p>
          </div>
        )}

        {isOwned &&
          (hasFile ? (
            <div className="flex flex-col gap-2">
              <a
                href={`/api/download/${resource.id}`}
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-700 ring-1 ring-primary-600/20 ring-offset-1",
                  isReturningFromCheckout
                    ? "ring-2 ring-emerald-400/60 ring-offset-2"
                    : "",
                ].join(" ")}
              >
                <Download className="h-4 w-4" />
                Download instantly
              </a>
              {isPreviewSupported(resource.mimeType) && (
                <a
                  href={`/api/preview/${resource.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-surface-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </a>
              )}
              <p className="text-center text-caption text-zinc-400">
                Secure, authenticated download
              </p>
            </div>
          ) : (
            <p className="text-center text-caption text-zinc-400">
              File not yet available — check back soon.
            </p>
          ))}

        {!isOwned && isFree &&
          (session?.user ? (
            <BuyButton
              resourceId={resource.id}
              resourceHref={`/resources/${resource.slug}`}
              price={0}
              isFree={true}
              owned={false}
              hasFile={hasFile}
            />
          ) : (
            <Link
              href={`/auth/login?next=/resources/${resource.slug}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-700"
            >
              Sign in to Download
            </Link>
          ))}

        {!isOwned && !isFree &&
          (session?.user ? (
            <BuyButton
              resourceId={resource.id}
              resourceHref={`/resources/${resource.slug}`}
              price={resource.price / 100}
              isFree={false}
              owned={false}
              hasFile={hasFile}
            />
          ) : (
            <div className="space-y-3">
              <Link
                href={`/auth/login?next=/resources/${resource.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-700"
              >
                Sign in to Buy
              </Link>
              <p className="text-center text-caption text-zinc-400">
                Create a free account to purchase.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Renders the membership upsell section. Isolated so getPlatform() does not
 * block the price or CTA from appearing.
 */
async function PurchaseCardMembershipSection({
  session,
}: {
  session: { user?: { id?: string; subscriptionStatus?: string } } | null;
}) {
  const platform = await getPlatform();
  const isMember =
    session?.user?.subscriptionStatus === "ACTIVE" ||
    session?.user?.subscriptionStatus === "TRIALING";

  return (
    <div className="space-y-2">
      {isMember ? (
        <p className="text-small font-medium text-emerald-700">
          Member pricing is already active on your account
        </p>
      ) : (
        <>
          <p className="text-small font-medium text-zinc-900">
            Save more with {platform.platformShortName} Plus
          </p>
          <p className="text-small leading-6 text-zinc-500">
            Members unlock discounted pricing and a faster path to repeat
            downloads.
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 text-small font-medium text-primary-700 transition hover:text-primary-800"
          >
            <Sparkles className="h-4 w-4" />
            Explore membership
          </Link>
        </>
      )}
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

/**
 * Synchronous shell that renders price and file meta immediately on first paint.
 * Async content (ownership state, trust data, membership upsell) streams in via
 * inner Suspense boundaries, each showing a matching skeleton while resolving.
 */
export function PurchaseCard({
  resource,
  session,
  hasFile,
  isReturningFromCheckout = false,
  ownershipPromise,
  trustSummaryPromise,
}: PurchaseCardProps) {
  const isFree = resource.isFree || resource.price === 0;

  return (
    <div className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 sm:p-6">
      <div className="space-y-5">
        {/* Author / category — always sync */}
        {(resource.author.name || resource.category) && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-zinc-500">
            {resource.author.name ? `by ${resource.author.name}` : null}
            {resource.author.name && resource.category ? (
              <span aria-hidden className="text-zinc-300">·</span>
            ) : null}
            {resource.category ? (
              <span className="font-medium text-primary-700">
                {resource.category.name}
              </span>
            ) : null}
          </p>
        )}

        {/* Price — always sync, appears on first paint */}
        <p className="text-3xl font-bold tracking-tight text-zinc-900">
          <PriceLabel price={resource.price} isFree={isFree} />
        </p>

        {/* Middle section: kicker, trust, CTA — streams in */}
        <Suspense fallback={<PurchaseCardMiddleSkeleton />}>
          <PurchaseCardMiddle
            ownershipPromise={ownershipPromise}
            trustSummaryPromise={trustSummaryPromise}
            resource={resource}
            session={session}
            hasFile={hasFile}
            isReturningFromCheckout={isReturningFromCheckout}
            isFree={isFree}
          />
        </Suspense>
      </div>

      {/* Bottom section: static file meta + streaming membership upsell */}
      <div className="space-y-4 border-t border-surface-200 pt-4">
        <dl className="space-y-2.5 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Format</dt>
            <dd className="font-medium text-zinc-900">
              {TYPE_LABELS[resource.type] ?? resource.type}
            </dd>
          </div>
          {resource.pageCount != null && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Pages</dt>
              <dd className="font-medium text-zinc-900">
                {formatNumber(resource.pageCount)}
              </dd>
            </div>
          )}
          {resource.fileSize != null && resource.fileSize > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">File size</dt>
              <dd className="font-medium text-zinc-900">
                {formatFileSize(resource.fileSize)}
              </dd>
            </div>
          )}
          {resource.category && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Category</dt>
              <dd className="font-medium text-zinc-900">
                {resource.category.name}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Downloads</dt>
            <dd className="font-medium text-zinc-900">
              {formatNumber(resource.downloadCount)}
            </dd>
          </div>
          {resource.updatedAt != null && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Updated</dt>
              <dd className="font-medium text-zinc-900">
                {formatUpdated(resource.updatedAt)}
              </dd>
            </div>
          )}
        </dl>

        {/* Membership upsell — streams in independently */}
        <Suspense fallback={<PurchaseCardMembershipSkeleton />}>
          <PurchaseCardMembershipSection session={session} />
        </Suspense>
      </div>
    </div>
  );
}
