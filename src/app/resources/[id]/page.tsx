import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { BuyButton } from "@/components/resources/BuyButton";
import { getBaseUrl } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  FileText,
  Download,
  Star,
  User,
  Calendar,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ResourceDetail {
  id: string;
  title: string;
  description: string;
  isFree: boolean;
  price: number;
  fileUrl?: string | null;
  previewUrl?: string | null;
  downloadCount: number;
  viewCount: number;
  fileSize?: number | null;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
  category?: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } }[];
  reviews: {
    id: string;
    rating: number;
    body?: string | null;
    createdAt: string;
    user: { name?: string | null; image?: string | null };
  }[];
  _count: { purchases: number; reviews: number };
}

async function getResource(id: string): Promise<ResourceDetail | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/resources/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getOwnedIds(userId: string): Promise<string[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/purchases`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((p: { resource: { id: string } }) => p.resource.id);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const resource = await getResource(params.id);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.description.slice(0, 160),
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`}
        />
      ))}
    </span>
  );
}

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const resource = await getResource(params.id);
  if (!resource) notFound();

  const session = await getServerSession(authOptions);
  const ownedIds = session?.user ? await getOwnedIds(session.user.id) : [];
  const owned = ownedIds.includes(resource.id);

  const avgRating =
    resource.reviews.length > 0
      ? Math.round(
          resource.reviews.reduce((sum, r) => sum + r.rating, 0) /
            resource.reviews.length
        )
      : 0;

  const fileSizeFormatted = resource.fileSize
    ? resource.fileSize > 1_000_000
      ? `${(resource.fileSize / 1_000_000).toFixed(1)} MB`
      : `${Math.round(resource.fileSize / 1000)} KB`
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/resources" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Library
            </Link>
            {resource.category && (
              <>
                <span>/</span>
                <Link
                  href={`/categories/${resource.category.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {resource.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="truncate text-gray-700">{resource.title}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ── Left: main content ──────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                {/* Preview banner */}
                <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                  {resource.previewUrl ? (
                    <img
                      src={resource.previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-16 w-16 text-white/30" />
                  )}
                  <div className="absolute right-4 top-4">
                    {resource.isFree || resource.price === 0 ? (
                      <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white shadow">
                        Free
                      </span>
                    ) : owned ? (
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white shadow">
                        Owned
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gray-900 shadow">
                        {formatPrice(resource.price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {/* Category + tags */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {resource.category && (
                      <Badge variant="blue">{resource.category.name}</Badge>
                    )}
                    {resource.tags.map(({ tag }) => (
                      <Badge key={tag.slug} variant="gray">
                        <Tag className="mr-1 h-2.5 w-2.5" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {resource.title}
                  </h1>

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-gray-400" />
                      {resource.author.name ?? "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(resource.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-gray-400" />
                      {resource.downloadCount.toLocaleString()} downloads
                    </span>
                    {avgRating > 0 && (
                      <span className="flex items-center gap-1.5">
                        <StarRating rating={avgRating} />
                        <span className="font-medium text-gray-700">{avgRating}/5</span>
                        <span>({resource._count.reviews} reviews)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">About this resource</h2>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {resource.description}
                </p>
              </div>

              {/* Reviews */}
              {resource.reviews.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <h2 className="mb-5 text-lg font-semibold text-gray-900">
                    Reviews ({resource._count.reviews})
                  </h2>
                  <div className="space-y-5">
                    {resource.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {review.user.image ? (
                            <img
                              src={review.user.image}
                              alt={review.user.name ?? ""}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {review.user.name?.[0]?.toUpperCase() ?? "?"}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {review.user.name ?? "Anonymous"}
                            </p>
                            <StarRating rating={review.rating} />
                          </div>
                          <span className="ml-auto text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.body && (
                          <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">
                            {review.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: purchase sidebar ─────────────────────────────────── */}
            <div className="space-y-4">
              {/* Purchase card */}
              <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 text-center">
                  {resource.isFree || resource.price === 0 ? (
                    <p className="text-4xl font-bold text-emerald-600">Free</p>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-gray-900">
                        {formatPrice(resource.price)}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-400">one-time purchase</p>
                    </>
                  )}
                </div>

                <BuyButton
                  resourceId={resource.id}
                  price={resource.price}
                  isFree={resource.isFree}
                  owned={owned}
                  fileUrl={resource.fileUrl}
                />

                {/* File details */}
                <ul className="mt-5 space-y-2.5 text-sm text-gray-500">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400">
                      <FileText className="h-4 w-4" /> Format
                    </span>
                    <span className="font-medium text-gray-700">PDF</span>
                  </li>
                  {fileSizeFormatted && (
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Download className="h-4 w-4" /> File size
                      </span>
                      <span className="font-medium text-gray-700">{fileSizeFormatted}</span>
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Download className="h-4 w-4" /> Downloads
                    </span>
                    <span className="font-medium text-gray-700">
                      {resource.downloadCount.toLocaleString()}
                    </span>
                  </li>
                </ul>

                {/* Membership upsell */}
                {!resource.isFree && !owned && (
                  <div className="mt-5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 ring-1 ring-blue-100">
                    <p className="text-xs font-semibold text-blue-800">
                      Pro members get this free
                    </p>
                    <p className="mt-0.5 text-xs text-blue-600">
                      Unlock unlimited resources with a Pro subscription.
                    </p>
                    <Link
                      href="/membership"
                      className="mt-2 inline-block text-xs font-semibold text-purple-700 hover:text-purple-900 underline"
                    >
                      View plans →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
