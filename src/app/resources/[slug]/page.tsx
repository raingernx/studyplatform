import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { BuyButton } from "@/components/resources/BuyButton";
import { PreviewGallery } from "@/components/resources/PreviewGallery";
import {
  FileText,
  Download,
  Tag,
  User,
  Calendar,
  CheckCircle,
  Lock,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  params: { slug: string };
  searchParams: { payment?: string };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "usd",
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const TYPE_LABELS: Record<string, string> = {
  PDF: "PDF",
  DOCUMENT: "Document",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getResourceData(slug: string, userId?: string) {
  const resource = await prisma.resource.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
      previews: { orderBy: { order: "asc" } },
    },
  });

  const purchase =
    resource && userId
      ? await prisma.purchase.findFirst({
          where: { userId, resourceId: resource.id, status: "COMPLETED" },
        })
      : null;

  return { resource, purchase };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const resource = await prisma.resource.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true },
  });

  return {
    title: resource ? `${resource.title} | PaperDock` : "Resource | PaperDock",
    description: resource?.description?.slice(0, 155) ?? "",
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { resource, purchase } = await getResourceData(params.slug, userId);

  if (!resource || resource.status !== "PUBLISHED") {
    notFound();
  }

  // purchase query already filters status = COMPLETED, so any result means owned
  const isOwned = Boolean(purchase);
  const isFree = resource.isFree || resource.price === 0;
  // hasFile is true when there is either a locally stored file (fileKey)
  // or an external URL — both are served through /api/download/[id]
  const hasFile = Boolean(resource.fileUrl ?? resource.fileKey);

  // Payment feedback from Stripe redirect
  const paymentStatus = searchParams.payment; // "success" | "cancelled" | undefined

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* ── Breadcrumb ── */}
          <nav className="mb-6 flex items-center gap-2 text-[13px] text-zinc-400">
            <Link href="/" className="transition hover:text-zinc-600">
              Home
            </Link>
            <span>/</span>
            {resource.category ? (
              <>
                <Link
                  href={`/categories/${resource.category.slug}`}
                  className="transition hover:text-zinc-600"
                >
                  {resource.category.name}
                </Link>
                <span>/</span>
              </>
            ) : null}
            <span className="truncate text-zinc-600">{resource.title}</span>
          </nav>

          {/* ── Payment feedback banners ── */}
          {paymentStatus === "success" && (
            <div
              className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-100
                             bg-emerald-50 px-5 py-4"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-[14px] font-semibold text-emerald-800">
                  Payment successful!
                </p>
                <p className="mt-0.5 text-[13px] text-emerald-700">
                  Your purchase is being confirmed. Head to{" "}
                  <Link href="/library" className="underline underline-offset-2">
                    My Library
                  </Link>{" "}
                  to access your download once it appears.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "cancelled" && (
            <div
              className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100
                             bg-amber-50 px-5 py-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-[13px] text-amber-700">
                Payment was cancelled. You have not been charged.
              </p>
            </div>
          )}

          {/* ── Main layout ── */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
            {/* ── Left: Gallery + tabs content ── */}
            <div>
              {/* Badges row */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100
                                  px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
                                  text-zinc-500"
                >
                  <FileText className="h-3 w-3" />
                  {TYPE_LABELS[resource.type] ?? resource.type}
                </span>

                {resource.category && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50
                                    px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
                                    text-blue-600"
                  >
                    <Tag className="h-3 w-3" />
                    {resource.category.name}
                  </span>
                )}

                {resource.featured && (
                  <span
                    className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1
                                    text-[11px] font-semibold uppercase tracking-wide text-amber-600"
                  >
                    ★ Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[30px] font-bold leading-tight tracking-tight text-zinc-900">
                {resource.title}
              </h1>

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-zinc-500">
                {resource.author.name && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {resource.author.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(resource.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {resource.downloadCount.toLocaleString()} download
                  {resource.downloadCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Preview gallery */}
              <div className="mt-6">
                <PreviewGallery
                  previews={resource.previews}
                  resourceTitle={resource.title}
                />
              </div>

              {/* Tabs nav */}
              <div className="mt-8 border-b border-zinc-200">
                <nav className="-mb-px flex gap-6 text-sm">
                  <a
                    href="#description"
                    className="border-b-2 border-zinc-900 pb-3 font-medium text-zinc-900"
                  >
                    Description
                  </a>
                  <a
                    href="#included"
                    className="pb-3 text-zinc-500 transition hover:text-zinc-800"
                  >
                    What&apos;s included
                  </a>
                  <a
                    href="#reviews"
                    className="pb-3 text-zinc-500 transition hover:text-zinc-800"
                  >
                    Reviews
                  </a>
                </nav>
              </div>

              {/* Tabs content */}
              <div className="mt-8 space-y-10">
                {/* Description tab */}
                <section id="description" className="prose prose-zinc max-w-none">
                  <h2 className="text-[16px] font-semibold text-zinc-800">
                    Description
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
                    {resource.description}
                  </p>
                </section>

                {/* What’s included tab */}
                <section id="included">
                  <h2 className="text-[16px] font-semibold text-zinc-800">
                    What&apos;s included
                  </h2>
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 text-[13px] text-zinc-600">
                    {(resource.fileName || resource.fileSize) ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
                          File details
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {resource.fileName && <span>{resource.fileName}</span>}
                          {resource.fileSize && (
                            <span>
                              {resource.fileSize > 1_048_576
                                ? `${(resource.fileSize / 1_048_576).toFixed(1)} MB`
                                : `${Math.round(resource.fileSize / 1024)} KB`}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500">
                        File details for this resource will appear here once the
                        creator uploads the final asset.
                      </p>
                    )}
                  </div>
                </section>

                {/* Reviews placeholder tab */}
                <section id="reviews">
                  <h2 className="text-[16px] font-semibold text-zinc-800">
                    Reviews
                  </h2>
                  <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-[13px] text-zinc-500">
                    <p>Reviews for this resource will appear here.</p>
                  </div>
                </section>
              </div>
            </div>

            {/* ── Right: Purchase card ── */}
            <div>
              <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-card-md">
                {/* Price */}
                <p className="text-[28px] font-bold tracking-tight text-zinc-900">
                  {isFree ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    <span>
                      ฿{resource.price.toLocaleString("th-TH")}
                    </span>
                  )}
                </p>

                <div className="mt-4">
                  {/* ── Already owned ── */}
                  {isOwned && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-[13px] font-medium text-emerald-700">
                          You own this resource
                        </p>
                      </div>
                      {hasFile ? (
                        <a
                          href={`/api/download/${resource.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl
                                     bg-zinc-900 px-5 py-3 text-[14px] font-semibold text-white
                                     transition hover:bg-zinc-700"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : (
                        <p className="text-center text-[12px] text-zinc-400">
                          File not yet available.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Free and not owned → Add to Library ── */}
                  {!isOwned && isFree && (
                    session?.user ? (
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl
                                   bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white
                                   shadow-sm transition hover:bg-blue-700"
                      >
                        Sign in to Download
                      </Link>
                    )
                  )}

                  {/* ── Paid and not owned ── */}
                  {!isOwned && !isFree && (
                    session?.user ? (
                      <BuyButton
                        resourceId={resource.id}
                        price={resource.price}
                        isFree={false}
                        owned={false}
                        hasFile={hasFile}
                      />
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href={`/auth/login?next=/resources/${resource.slug}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl
                                     bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white
                                     shadow-sm transition hover:bg-blue-700"
                        >
                          Sign in to Buy
                        </Link>
                        <p className="text-center text-[12px] text-zinc-400">
                          Create a free account to purchase.
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* Secure-download note — only shown when the user already owns it */}
                {isOwned && hasFile && (
                  <p
                    className="mt-4 flex items-center justify-center gap-1.5
                                 text-[11px] text-zinc-400"
                  >
                    <Lock className="h-3 w-3" />
                    Secure, authenticated download
                  </p>
                )}

                {/* Divider */}
                <hr className="my-5 border-zinc-100" />

                {/* Resource stats summary */}
                <dl className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Type</dt>
                    <dd className="font-medium text-zinc-700">
                      {TYPE_LABELS[resource.type] ?? resource.type}
                    </dd>
                  </div>
                  {resource.category && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Category</dt>
                      <dd className="font-medium text-zinc-700">
                        {resource.category.name}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Downloads</dt>
                    <dd className="font-medium text-zinc-700">
                      {resource.downloadCount.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* ── Back link ── */}
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium
                         text-zinc-500 transition hover:text-zinc-800"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Browse all resources
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

