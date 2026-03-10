import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { EditResourceForm } from "./EditResourceForm";
import { FileUploadWidget } from "@/components/admin/FileUploadWidget";
import {
  Calendar,
  Download,
  Eye,
  HardDrive,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = { params: { id: string } };

// ── Metadata (dynamic) ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return {
    title: resource ? `Edit "${resource.title}" – Admin` : "Edit Resource – Admin",
  };
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getEditData(id: string) {
  const [resource, categories, tags] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { purchases: true, reviews: true } },
        tags: { select: { tagId: true } },
        previews: { select: { imageUrl: true }, orderBy: { order: "asc" } },
      },
      // scalar fields (fileKey, fileName, fileSize, fileUrl …) are always selected
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { resource, categories, tags };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "usd",
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EditResourcePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  // ── 1. Require login ───────────────────────────────────────────────────────
  if (!session?.user) {
    redirect(`/auth/login?next=/admin/resources/${params.id}`);
  }

  // ── 2. Require ADMIN role ──────────────────────────────────────────────────
  const role = session.user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { resource, categories, tags } = await getEditData(params.id);

  // ── 3. 404 if resource doesn't exist ──────────────────────────────────────
  if (!resource) {
    notFound();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* ── Breadcrumb + header ── */}
          <div className="mb-8">
            <nav className="mb-3 flex items-center gap-2 text-[13px] text-zinc-400">
              <Link href="/admin" className="transition hover:text-zinc-600">
                Admin
              </Link>
              <span>/</span>
              <Link
                href="/admin/resources"
                className="transition hover:text-zinc-600"
              >
                Resources
              </Link>
              <span>/</span>
              <span className="text-zinc-600">Edit</span>
            </nav>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 line-clamp-1">
              {resource.title}
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              ID:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
                {resource.id}
              </code>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ── Left: Edit form (takes 2 columns) ── */}
            <div className="lg:col-span-2">
              <EditResourceForm
                resource={{
                  id: resource.id,
                  title: resource.title,
                  description: resource.description,
                  type: resource.type,
                  status: resource.status,
                  isFree: resource.isFree,
                  price: resource.price,
                  fileUrl: resource.fileUrl,
                  categoryId: resource.categoryId,
                  featured: resource.featured,
                }}
                categories={categories}
                tags={tags}
                initialTagIds={resource.tags.map((rt) => rt.tagId)}
                initialPreviewUrls={resource.previews.map((p) => p.imageUrl)}
              />
            </div>

            {/* ── Right: Resource metadata sidebar ── */}
            <div className="space-y-4 lg:col-span-1">

              {/* ── File upload card ── */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
                <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-zinc-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  File
                </h3>
                <p className="mb-4 text-[11px] text-zinc-400">
                  Upload the downloadable file for this resource. Stored securely
                  and served through the authenticated download endpoint.
                </p>
                <FileUploadWidget
                  resourceId={resource.id}
                  initialFileName={resource.fileName}
                  initialFileSize={resource.fileSize}
                />
              </div>

              {/* Stats card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
                <h3 className="mb-4 text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Stats
                </h3>
                <div className="space-y-3">
                  <StatRow
                    icon={<ShoppingBag className="h-4 w-4 text-blue-500" />}
                    label="Purchases"
                    value={resource._count.purchases}
                  />
                  <StatRow
                    icon={<Eye className="h-4 w-4 text-violet-500" />}
                    label="Views"
                    value={resource.viewCount}
                  />
                  <StatRow
                    icon={<Download className="h-4 w-4 text-emerald-500" />}
                    label="Downloads"
                    value={resource.downloadCount}
                  />
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
                <h3 className="mb-4 text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Details
                </h3>
                <dl className="space-y-3 text-[13px]">
                  <Detail label="Price">
                    <span className="font-semibold text-zinc-900">
                      {formatPrice(resource.price)}
                    </span>
                  </Detail>
                  <Detail label="Category">
                    {resource.category?.name ?? (
                      <span className="text-zinc-400">Uncategorised</span>
                    )}
                  </Detail>
                  <Detail label="Author">
                    {resource.author.name ?? resource.author.email}
                  </Detail>
                  <Detail label="Created">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      {formatDate(resource.createdAt)}
                    </span>
                  </Detail>
                  <Detail label="Updated">
                    {formatDate(resource.updatedAt)}
                  </Detail>
                  {/* Show file name when a local file is uploaded */}
                  {resource.fileKey && (
                    <Detail label="File">
                      <span className="text-zinc-700">
                        {resource.fileName ?? resource.fileKey}
                      </span>
                    </Detail>
                  )}
                  {/* Fall back to external URL link when no local file */}
                  {!resource.fileKey && resource.fileUrl && (
                    <Detail label="File">
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline-offset-2 hover:underline"
                      >
                        View file ↗
                      </a>
                    </Detail>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[13px] text-zinc-500">
        {icon}
        {label}
      </span>
      <span className="text-[14px] font-semibold tabular-nums text-zinc-900">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-zinc-400">{label}</dt>
      <dd className="text-right text-zinc-700">{children}</dd>
    </div>
  );
}
