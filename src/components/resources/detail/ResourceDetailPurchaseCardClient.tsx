"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CheckCircle,
  ChevronRight,
  Download,
  Eye,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PriceLabel } from "@/design-system";
import { BuyButton } from "@/components/resources/BuyButton";
import { PendingPurchasePoller } from "@/components/checkout/PendingPurchasePoller";
import { formatFileSize, formatNumber } from "@/lib/format";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";
import { routes } from "@/lib/routes";
import { useResourceDetailViewerState } from "./ResourceDetailViewerStateProvider";

type TrustSummary = {
  averageRating: number | null;
  totalReviews: number;
  totalSales: number;
};

type PurchaseMeta = {
  mimeType: string | null;
  fileSize: number | null;
  updatedAt: Date | string | null;
  resourceStat: {
    last30dDownloads: number;
    last30dPurchases: number;
  } | null;
} | null;

interface PurchaseCardResource {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  type: string;
  downloadCount: number;
  author: { id: string; name: string | null };
  category: { id: string; name: string; slug: string } | null;
  levelLabel?: string | null;
}

function formatUpdated(date: Date | string): string {
  const value = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(value);
}

function getRecentActivityLabel(meta: PurchaseMeta) {
  const recentSales = meta?.resourceStat?.last30dPurchases ?? 0;
  const recentDownloads = meta?.resourceStat?.last30dDownloads ?? 0;

  if (recentSales > 0) {
    return `${formatNumber(recentSales)} ${recentSales === 1 ? "purchase" : "purchases"} in the last 30 days`;
  }

  if (recentDownloads > 0) {
    return `${formatNumber(recentDownloads)} downloads in the last 30 days`;
  }

  return null;
}

function PurchaseActionPlaceholder() {
  return (
    <div className="space-y-3">
      <div
        aria-hidden="true"
        className="h-12 w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
      />
      <p className="text-center text-caption leading-5 text-muted-foreground">
        Checking your library…
      </p>
    </div>
  );
}

export function ResourceDetailPurchaseCardClient({
  resource,
  purchaseMeta,
  trustSummary,
  hasFile,
  isReturningFromCheckout,
  platformShortName,
}: {
  resource: PurchaseCardResource;
  purchaseMeta: PurchaseMeta;
  trustSummary: TrustSummary;
  hasFile: boolean;
  isReturningFromCheckout: boolean;
  platformShortName: string;
}) {
  const viewer = useResourceDetailViewerState();
  const isFree = resource.isFree || resource.price === 0;
  const isOwned = viewer.isOwned;
  const isPendingPurchase =
    isReturningFromCheckout && (!viewer.isReady || (viewer.authenticated && !isOwned));
  const hasReviews =
    typeof trustSummary.averageRating === "number" && trustSummary.totalReviews > 0;
  const recentActivityLabel = useMemo(
    () => getRecentActivityLabel(purchaseMeta),
    [purchaseMeta],
  );
  const isMember =
    viewer.subscriptionStatus === "ACTIVE" ||
    viewer.subscriptionStatus === "TRIALING";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="space-y-5">
        {(resource.author.name || resource.category) && (
          <p className="flex max-w-sm flex-wrap items-center gap-x-2 gap-y-1 text-caption leading-5 text-muted-foreground">
            {resource.author.name ? `by ${resource.author.name}` : null}
            {resource.author.name && resource.category ? (
              <span aria-hidden className="text-muted-foreground/50">·</span>
            ) : null}
            {resource.category ? (
              <span className="font-medium text-primary-700">
                {resource.category.name}
              </span>
            ) : null}
          </p>
        )}

        <p className="text-3xl font-bold tracking-tight text-foreground">
          <PriceLabel price={resource.price} isFree={isFree} />
        </p>

        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-caption font-semibold text-secondary-foreground">
            {isOwned ? "In your library" : isFree ? "Free to keep" : "One-time purchase"}
          </span>
          <p className="max-w-sm text-small leading-6 text-muted-foreground">
            {isOwned
              ? "Your download is ready whenever you need it."
              : isFree
                ? "No card needed. Add it to your library and download any time."
                : "Pay once. Yours forever — re-download any time, no subscription needed."}
          </p>
          {(resource.levelLabel || resource.type) && (
            <p className="max-w-sm text-caption font-medium leading-5 text-muted-foreground">
              {[resource.levelLabel ?? null, resource.type].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-border py-5">
          {isPendingPurchase ? (
            <PendingPurchasePoller
              resourceTitle={resource.title}
              onRefresh={viewer.refresh}
            />
          ) : !viewer.isReady ? (
            <PurchaseActionPlaceholder />
          ) : isOwned ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-small font-medium leading-5 text-emerald-700">
                  Added to your library
                </p>
              </div>
              {hasFile ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/download/${resource.id}`}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-700"
                  >
                    <Download className="h-4 w-4" />
                    Download instantly
                  </a>
                  {isPreviewSupported(purchaseMeta?.mimeType) ? (
                    <a
                      href={`/api/preview/${resource.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-[13px] font-medium text-foreground transition hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </a>
                  ) : null}
                  <p className="text-center text-caption leading-5 text-muted-foreground">
                    Secure, authenticated download
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted px-4 py-3">
                  <p className="text-center text-caption leading-5 text-muted-foreground">
                    File not yet available — check back soon.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <BuyButton
              resourceId={resource.id}
              resourceHref={routes.resource(resource.slug)}
              price={isFree ? 0 : resource.price / 100}
              isFree={isFree}
              owned={false}
              hasFile={hasFile}
            />
          )}
        </div>

        {!isPendingPurchase && (hasReviews || trustSummary.totalSales > 0 || recentActivityLabel) ? (
          <div className="space-y-5 border-t border-border pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {hasReviews ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>Rating</span>
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {trustSummary.averageRating!.toFixed(1)}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {formatNumber(trustSummary.totalReviews)} reviews
                  </p>
                </div>
              ) : null}
              {trustSummary.totalSales > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Sales</span>
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {formatNumber(trustSummary.totalSales)}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {trustSummary.totalSales === 1 ? "verified purchase" : "verified purchases"}
                  </p>
                </div>
              ) : null}
              {resource.downloadCount > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Downloads</span>
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {formatNumber(resource.downloadCount)}
                  </p>
                  <p className="text-caption text-muted-foreground">library unlocks</p>
                </div>
              ) : null}
            </div>

            {recentActivityLabel ? (
              <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3.5">
                <p className="text-caption font-semibold text-primary-700/90">
                  Recent activity
                </p>
                <p className="mt-1 text-small font-medium text-primary-900">
                  {recentActivityLabel}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-5 border-t border-border pt-5">
        <dl className="space-y-3 text-small">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Format</dt>
            <dd className="text-right font-medium leading-5 text-foreground">
              {resource.type}
            </dd>
          </div>
          {resource.category ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="text-right font-medium leading-5 text-foreground">
                {resource.category.name}
              </dd>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Downloads</dt>
            <dd className="text-right font-medium leading-5 text-foreground">
              {formatNumber(resource.downloadCount)}
            </dd>
          </div>
          {purchaseMeta?.fileSize ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">File size</dt>
              <dd className="text-right font-medium leading-5 text-foreground">
                {formatFileSize(purchaseMeta.fileSize)}
              </dd>
            </div>
          ) : null}
          {purchaseMeta?.updatedAt ? (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="text-right font-medium leading-5 text-foreground">
                {formatUpdated(purchaseMeta.updatedAt)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="space-y-2.5">
          {isMember ? (
            <p className="text-small font-medium text-emerald-700">
              Member pricing is already active on your account
            </p>
          ) : (
            <>
              <p className="text-small font-medium text-foreground">
                Save more with {platformShortName} Plus
              </p>
              <p className="text-small leading-6 text-muted-foreground">
                Members unlock discounted pricing and a faster path to repeat downloads.
              </p>
              <Link
                href={routes.membership}
                className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-small font-semibold text-primary-800 transition hover:border-primary-300 hover:bg-primary-100"
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
      </div>
    </div>
  );
}
