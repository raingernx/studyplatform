import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Download,
  Eye,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PriceLabel } from "@/components/ui/PriceLabel";
import { BuyButton } from "@/components/resources/BuyButton";
import { formatFileSize, formatNumber } from "@/lib/format";
import { getPlatform } from "@/services/platform.service";
import { isPreviewSupported } from "@/lib/preview/previewPolicy";

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  DOCUMENT: "Document",
};

const CTA_COPY = {
  free: {
    kicker: "Free resource",
    description: "Start with a ready-to-use resource instead of piecing study material together yourself.",
    proof: "No charge. Add it once and come back to it any time from your library.",
  },
  paid: {
    kicker: "One-time purchase",
    description:
      "Get straight to focused study with one complete resource instead of starting from a blank page.",
    proof: "Pay once. Keep it in your library and download it whenever you need a refresher.",
  },
  owned: {
    kicker: "Already in your library",
    description: "You already have what you need to pick this back up and keep moving.",
    proof: "Authenticated access protects creator files.",
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
  averageRating?: number | null;
  reviewCount?: number;
  salesCount?: number;
  recentDownloads?: number;
  recentSales?: number;
  levelLabel?: string | null;
  outcomeHint?: string | null;
  comparisonAnchor?: {
    label: string;
  } | null;
}

interface PurchaseCardProps {
  resource: PurchaseCardResource;
  isOwned: boolean;
  hasFile: boolean;
  session: { user?: { id?: string; subscriptionStatus?: string } } | null;
}

export async function PurchaseCard({
  resource,
  isOwned,
  hasFile,
  session,
}: PurchaseCardProps) {
  const platform = await getPlatform();
  const isFree = resource.isFree || resource.price === 0;
  const isMember =
    session?.user?.subscriptionStatus === "ACTIVE" ||
    session?.user?.subscriptionStatus === "TRIALING";
  const ctaCopy = isOwned ? CTA_COPY.owned : isFree ? CTA_COPY.free : CTA_COPY.paid;
  const hasReviews =
    typeof resource.averageRating === "number" && (resource.reviewCount ?? 0) > 0;
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
          value: resource.averageRating!.toFixed(1),
          meta: `${formatNumber(resource.reviewCount ?? 0)} reviews`,
          icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />,
        }
      : null,
    (resource.salesCount ?? 0) > 0
      ? {
          label: "Sales",
          value: formatNumber(resource.salesCount ?? 0),
          meta:
            resource.salesCount === 1
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
    hasReviews ? `${resource.averageRating!.toFixed(1)}★` : null,
    resource.levelLabel ?? null,
    TYPE_LABELS[resource.type] ?? resource.type,
    resource.outcomeHint ?? null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-full min-h-0 flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
      <div className="space-y-4">
        <div className="space-y-1">
          {resource.author.name && (
            <p className="text-[13px] text-zinc-500">by {resource.author.name}</p>
          )}
          {resource.category ? (
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-brand-600/80">
              {resource.category.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            {ctaCopy.kicker}
          </span>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">
            <PriceLabel price={resource.price} isFree={isFree} />
          </p>
          <p className="text-[13px] leading-6 text-zinc-500">
            {ctaCopy.description}
          </p>
          {summaryParts.length > 0 && (
            <p className="text-[12px] font-medium text-zinc-600">
              {summaryParts.join(" · ")}
            </p>
          )}
        </div>

        {trustItems.length > 0 && (
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-white px-3 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-500">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">
                  {item.value}
                </p>
                <p className="text-[12px] text-zinc-500">{item.meta}</p>
              </div>
            ))}
          </div>
        )}

        {recentActivityLabel && !isOwned && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 shadow-sm">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              {recentActivityHeading}
            </p>
            <p className="mt-1 text-[13px] font-medium text-brand-900">{recentActivityLabel}</p>
            <p className="mt-1 text-[12px] text-brand-700">
              Learners are actively using this resource right now.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-surface-50 p-4">
          <div className="mb-3 space-y-1">
            <p className="text-[13px] font-semibold text-zinc-900">
              Get instant access
            </p>
            <p className="text-[12px] leading-5 text-zinc-500">{ctaCopy.proof}</p>
            {!isOwned && (
              <p className="text-[12px] leading-5 text-zinc-500">
                Start now instead of figuring it out alone later.
              </p>
            )}
            {!isOwned && hasFile && (
              <p className="text-[12px] font-medium text-emerald-700">
                Instant access after purchase. No waiting for approval.
              </p>
            )}
            {!isOwned && resource.comparisonAnchor && (
              <p className="text-[12px] leading-5 text-zinc-500">
                {resource.comparisonAnchor.label}
              </p>
            )}
          </div>

          {isOwned && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-[13px] font-medium text-emerald-700">
                  You own this resource
                </p>
              </div>
              {hasFile ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/download/${resource.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-zinc-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  {isPreviewSupported(resource.mimeType) && (
                    <a
                      href={`/api/preview/${resource.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-center text-[12px] text-zinc-400">
                  File not yet available.
                </p>
              )}
            </div>
          )}

          {!isOwned && isFree &&
            (session?.user ? (
              <BuyButton
                resourceId={resource.id}
                price={0}
                isFree={true}
                owned={false}
                hasFile={hasFile}
              />
            ) : (
              <Link
                href={`/auth/login?next=/resources/${resource.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Sign in to Download
              </Link>
            ))}

          {!isOwned && !isFree &&
            (session?.user ? (
              <BuyButton
                resourceId={resource.id}
                price={resource.price / 100}
                isFree={false}
                owned={false}
                hasFile={hasFile}
              />
            ) : (
              <div className="space-y-3">
                <Link
                  href={`/auth/login?next=/resources/${resource.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Sign in to Buy
                </Link>
                <p className="text-center text-[12px] text-zinc-400">
                  Create a free account to purchase.
                </p>
              </div>
            ))}
        </div>

        {isOwned && hasFile && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <Lock className="h-3 w-3" />
            Secure, authenticated download
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
          <dl className="space-y-2 text-[13px]">
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
            {hasReviews && (
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Rating</dt>
                <dd className="font-medium text-zinc-900">
                  {resource.averageRating!.toFixed(1)} / 5 (
                  {formatNumber(resource.reviewCount ?? 0)})
                </dd>
              </div>
            )}
            {(resource.salesCount ?? 0) > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Sales</dt>
                <dd className="font-medium text-zinc-900">
                  {formatNumber(resource.salesCount ?? 0)}
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
        </div>

        <div className="space-y-2 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-50/30 p-4 text-sm">
          {isMember ? (
            <p className="font-medium text-emerald-700">
              Member pricing is already active on your account
            </p>
          ) : (
            <>
              <p className="font-medium text-zinc-900">
                Save more with {platform.platformShortName} Plus
              </p>
              <p className="text-muted-foreground">
                Members unlock discounted pricing and a faster path to repeat
                downloads.
              </p>
              <Link
                href="/membership"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
              >
                <Sparkles className="h-4 w-4" />
                Explore membership
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
