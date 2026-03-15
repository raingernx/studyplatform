import Link from "next/link";
import { CheckCircle, Download, Lock, Sparkles } from "lucide-react";
import { PriceLabel } from "@/components/ui/PriceLabel";
import { BuyButton } from "@/components/resources/BuyButton";
import { formatNumber, formatFileSize } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  DOCUMENT: "Document",
};

function formatUpdated(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(d);
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
  /** File size in bytes; optional. */
  fileSize?: number | null;
  /** Last updated; optional. */
  updatedAt?: Date | string | null;
  /** Page count if available; optional. */
  pageCount?: number | null;
}

interface PurchaseCardProps {
  resource: PurchaseCardResource;
  isOwned: boolean;
  hasFile: boolean;
  session: { user?: { id?: string; subscriptionStatus?: string } } | null;
}

export function PurchaseCard({ resource, isOwned, hasFile, session }: PurchaseCardProps) {
  const isFree = resource.isFree || resource.price === 0;
  const isMember =
    session?.user?.subscriptionStatus === "ACTIVE" ||
    session?.user?.subscriptionStatus === "TRIALING";

  return (
    <div className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        {/* Creator */}
        {resource.author.name && (
          <p className="text-[13px] text-zinc-500">by {resource.author.name}</p>
        )}

        {/* Price */}
        <p className="text-2xl font-bold tracking-tight text-zinc-900">
          <PriceLabel price={resource.price} isFree={isFree} />
        </p>

        <div className="mt-4">
          {isOwned && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-[13px] font-medium text-emerald-700">You own this resource</p>
            </div>
            {hasFile ? (
              <a
                href={`/api/download/${resource.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-zinc-700"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : (
              <p className="text-center text-[12px] text-zinc-400">File not yet available.</p>
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
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <Lock className="h-3 w-3" />
            Secure, authenticated download
          </p>
        )}

        {/* Membership promotion */}
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-4 text-sm space-y-2">
          {isMember ? (
            <p className="font-medium text-emerald-700">Member discount applied</p>
          ) : (
            <>
              <p className="font-medium text-zinc-900">
                Save up to 25% with PaperDock Plus
              </p>
              <p className="text-muted-foreground">
                Unlimited downloads and premium resources
              </p>
              <Link
                href="/membership"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Become a member
              </Link>
            </>
          )}
        </div>
      </div>

      <div>
        <hr className="my-5 border-zinc-100" />

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
              <dd className="font-medium text-zinc-900">{formatNumber(resource.pageCount)}</dd>
            </div>
          )}
          {resource.fileSize != null && resource.fileSize > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">File size</dt>
              <dd className="font-medium text-zinc-900">{formatFileSize(resource.fileSize)}</dd>
            </div>
          )}
          {resource.category && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Category</dt>
              <dd className="font-medium text-zinc-900">{resource.category.name}</dd>
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
              <dd className="font-medium text-zinc-900">{formatUpdated(resource.updatedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
