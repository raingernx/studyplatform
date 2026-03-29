import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
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
import { formatFileSize, formatNumber } from "@/lib/format";
import { getPlatform } from "@/services/platform.service";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";
import {
  PurchaseCardMembershipSkeleton,
  PurchaseCardMiddleSkeleton,
  PurchaseCardSkeleton,
} from "@/components/resource/PurchaseCardSkeleton";

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

const CARD_SHELL_CLASS =
  "flex h-full min-h-0 flex-col rounded-xl border border-surface-200 bg-white p-5 sm:p-6";
const SECTION_STACK_CLASS = "space-y-5";
const DIVIDED_SECTION_CLASS = "space-y-5 border-t border-surface-200 pt-5";
const PRIMARY_LINK_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
const SECONDARY_LINK_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2";
const HELPER_TEXT_CLASS = "text-center text-caption leading-5 text-zinc-400";

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

function PurchaseMetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium leading-5 text-zinc-900">{children}</dd>
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
    <div className={SECTION_STACK_CLASS}>
      <div className="space-y-3">
        <span className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-caption font-semibold text-zinc-600">
          {ctaCopy.kicker}
        </span>
        <p className="max-w-sm text-small leading-6 text-zinc-600">
          {ctaCopy.proof}
        </p>
        {summaryParts.length > 0 && (
          <p className="max-w-sm text-caption font-medium leading-5 text-zinc-600">
            {summaryParts.join(" · ")}
          </p>
        )}
      </div>

      {trustItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 border-y border-surface-200 py-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
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
        <div className="flex flex-wrap gap-2.5 text-caption text-zinc-600">
          {benefitItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-2.5 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{item}</span>
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
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3.5">
          <p className="text-caption font-semibold text-primary-700/90">
            {recentActivityHeading}
          </p>
          <p className="mt-1 text-small font-medium text-primary-900">{recentActivityLabel}</p>
        </div>
      )}

      <div className="space-y-3 border-t border-surface-200 pt-5">
        {isOwned && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-small font-medium leading-5 text-emerald-700">
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
                  `${PRIMARY_LINK_CLASS} ring-1 ring-primary-600/20 ring-offset-1`,
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
                  className={SECONDARY_LINK_CLASS}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </a>
              )}
              <p className={HELPER_TEXT_CLASS}>
                Secure, authenticated download
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3">
              <p className={HELPER_TEXT_CLASS}>
                File not yet available — check back soon.
              </p>
            </div>
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
              className={PRIMARY_LINK_CLASS}
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
                className={PRIMARY_LINK_CLASS}
              >
                Sign in to Buy
              </Link>
              <p className={HELPER_TEXT_CLASS}>
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
    <div className="space-y-2.5">
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
            className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-primary-50 px-4 py-2.5 text-small font-semibold text-primary-800 transition hover:border-primary-200 hover:bg-primary-100 active:bg-primary-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Explore membership</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" />
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
    <div className={CARD_SHELL_CLASS}>
      <div className="flex h-full min-h-0 flex-col">
        <div className={SECTION_STACK_CLASS}>
          {/* Author / category — always sync */}
          {(resource.author.name || resource.category) && (
            <p className="flex max-w-sm flex-wrap items-center gap-x-2 gap-y-1 text-caption leading-5 text-zinc-500">
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
        <div className={DIVIDED_SECTION_CLASS}>
          <dl className="space-y-3 text-small">
            <PurchaseMetaRow label="Format">
              {TYPE_LABELS[resource.type] ?? resource.type}
            </PurchaseMetaRow>
            {resource.pageCount != null && (
              <PurchaseMetaRow label="Pages">
                {formatNumber(resource.pageCount)}
              </PurchaseMetaRow>
            )}
            {resource.fileSize != null && resource.fileSize > 0 && (
              <PurchaseMetaRow label="File size">
                {formatFileSize(resource.fileSize)}
              </PurchaseMetaRow>
            )}
            {resource.category && (
              <PurchaseMetaRow label="Category">
                {resource.category.name}
              </PurchaseMetaRow>
            )}
            <PurchaseMetaRow label="Downloads">
              {formatNumber(resource.downloadCount)}
            </PurchaseMetaRow>
            {resource.updatedAt != null && (
              <PurchaseMetaRow label="Updated">
                {formatUpdated(resource.updatedAt)}
              </PurchaseMetaRow>
            )}
          </dl>

          {/* Membership upsell — streams in independently */}
          <Suspense fallback={<PurchaseCardMembershipSkeleton />}>
            <PurchaseCardMembershipSection session={session} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export { PurchaseCardSkeleton } from "@/components/resource/PurchaseCardSkeleton";
