import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { getCreatorResources } from "@/services/creator.service";
import { formatDate, formatPrice } from "@/lib/format";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Star,
  Package,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "My Resources – PaperDock",
};

export const dynamic = "force-dynamic";

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    DRAFT:     "bg-neutral-50  text-neutral-500 ring-neutral-200",
    ARCHIVED:  "bg-amber-50    text-amber-700   ring-amber-200",
  };

  const labels: Record<string, string> = {
    PUBLISHED: "Published",
    DRAFT:     "Draft",
    ARCHIVED:  "Archived",
  };

  const style = styles[status] ?? styles.DRAFT;
  const label = labels[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CreatorResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/dashboard/resources");

  const resources = await getCreatorResources(session.user.id);

  const published = resources.filter((r) => r.status === "PUBLISHED" && !r.deletedAt);
  const drafts    = resources.filter((r) => r.status === "DRAFT"     && !r.deletedAt);
  const archived  = resources.filter((r) => r.status === "ARCHIVED"  && !r.deletedAt);
  const trashed   = resources.filter((r) => !!r.deletedAt);

  const totalDownloads = resources.reduce((s, r) => s + r.downloadCount, 0);
  const totalSales     = resources.reduce((s, r) => s + r._count.purchases, 0);

  const STATS = [
    {
      label: "Published",
      value: published.length,
      icon:  Eye,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Drafts",
      value: drafts.length,
      icon:  FileText,
      color: "bg-neutral-50 text-neutral-500",
    },
    {
      label: "Total Downloads",
      value: totalDownloads,
      icon:  Download,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Sales",
      value: totalSales,
      icon:  TrendingUp,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-h2 font-semibold tracking-tight text-neutral-900">
              My Resources
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              Resources you&apos;ve uploaded to the marketplace.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-neutral-500">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Resource list */}
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
              <Package className="h-7 w-7 text-neutral-300" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-neutral-700">
              No resources yet
            </p>
            <p className="mt-1 text-[13px] text-neutral-400">
              Contact an admin to upload your first resource to the marketplace.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-[14px] font-semibold text-neutral-900">
                All resources
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                  {resources.filter((r) => !r.deletedAt).length}
                </span>
              </h2>
            </div>

            <ul className="divide-y divide-neutral-50">
              {resources
                .filter((r) => !r.deletedAt)
                .map((resource) => {
                  const previewUrl = resource.previews?.[0]?.imageUrl ?? null;

                  return (
                    <li key={resource.id}>
                      <div className="flex items-center gap-4 px-6 py-4">
                        {/* Thumbnail */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-violet-50">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt={resource.title}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-neutral-900">
                              {resource.title}
                            </p>
                            {resource.featured && (
                              <Star className="h-3 w-3 flex-shrink-0 text-amber-400" />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-neutral-400">
                            <span>{resource.category?.name ?? "Uncategorised"}</span>
                            <span>·</span>
                            <span>{formatDate(resource.createdAt)}</span>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="hidden items-center gap-6 sm:flex">
                          <div className="text-center">
                            <p className="text-[13px] font-semibold text-neutral-900">
                              {resource.downloadCount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-neutral-400">Downloads</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-semibold text-neutral-900">
                              {resource._count.purchases.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-neutral-400">Sales</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-semibold text-neutral-900">
                              {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                            </p>
                            <p className="text-[10px] text-neutral-400">Price</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          <StatusBadge status={resource.status} />
                        </div>

                        {/* View link */}
                        <Link
                          href={`/resources/${resource.slug}`}
                          className="flex-shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-100"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  );
                })}
            </ul>

            {/* Trashed resources (collapsed) */}
            {trashed.length > 0 && (
              <div className="border-t border-neutral-100 px-6 py-3">
                <p className="text-[12px] text-neutral-400">
                  {trashed.length} resource{trashed.length !== 1 ? "s" : ""} in trash (not shown)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
