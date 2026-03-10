import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { NewResourceForm } from "./NewResourceForm";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Layers,
  Pencil,
  ShoppingBag,
  Tag,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Manage Resources – Admin",
  description: "Create and manage resources in the StudyPlatform library.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "usd",
  }).format(cents / 100);
}

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-zinc-100 text-zinc-500",
  ARCHIVED: "bg-amber-50 text-amber-700",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getAdminData() {
  const [resources, categories, tags] = await Promise.all([
    prisma.resource.findMany({
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { resources, categories, tags };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminResourcesPage() {
  const session = await getServerSession(authOptions);

  // ── 1. Require login ───────────────────────────────────────────────────────
  if (!session?.user) {
    redirect("/auth/login?next=/admin/resources");
  }

  // ── 2. Require ADMIN role ──────────────────────────────────────────────────
  const role = session.user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { resources, categories, tags } = await getAdminData();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* ── Page header ── */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="eyebrow mb-1">Admin</p>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Resource Library
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {resources.length} resource{resources.length !== 1 ? "s" : ""}{" "}
                in the library
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/resources/bulk"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200
                           bg-white px-4 py-2 text-[13px] font-medium text-zinc-600 shadow-sm
                           transition hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Layers className="h-3.5 w-3.5" />
                Bulk upload
              </Link>

              <Link
                href="/admin"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2
                           text-[13px] font-medium text-zinc-600 shadow-sm transition
                           hover:bg-zinc-50 hover:text-zinc-900"
              >
                ← Admin home
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* ── Left: Upload form ── */}
            <div className="lg:col-span-1">
              <NewResourceForm categories={categories} tags={tags} />
            </div>

            {/* ── Right: Resources table ── */}
            <div className="lg:col-span-2">
              {resources.length === 0 ? (
                <EmptyState />
              ) : (
                <ResourceTable resources={resources} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <BookOpen className="h-7 w-7 text-blue-500" />
      </span>
      <p className="mt-4 font-semibold text-zinc-800">No resources yet.</p>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
        Use the form to create your first resource.
      </p>
    </div>
  );
}

type ResourceRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  isFree: boolean;
  price: number;
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  category: { id: string; name: string } | null;
  _count: { purchases: number };
};

function ResourceTable({ resources }: { resources: ResourceRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
      {/* Table header */}
      <div className="border-b border-zinc-100 px-5 py-3.5">
        <h2 className="text-[14px] font-semibold text-zinc-900">
          All Resources
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-5 py-3 font-semibold text-zinc-500">Title</th>
              <th className="px-3 py-3 font-semibold text-zinc-500">Type</th>
              <th className="px-3 py-3 font-semibold text-zinc-500">Status</th>
              <th className="px-3 py-3 font-semibold text-zinc-500">Price</th>
              <th className="px-3 py-3 text-right font-semibold text-zinc-500">
                Stats
              </th>
              <th className="px-3 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {resources.map((r) => (
              <tr
                key={r.id}
                className="transition hover:bg-zinc-50/60"
              >
                {/* Title + category */}
                <td className="px-5 py-3.5">
                  <p className="font-medium text-zinc-900 line-clamp-1">
                    {r.title}
                  </p>
                  {r.category && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <Tag className="h-2.5 w-2.5" />
                      {r.category.name}
                    </span>
                  )}
                </td>

                {/* Type badge */}
                <td className="px-3 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <FileText className="h-2.5 w-2.5" />
                    {r.type}
                  </span>
                </td>

                {/* Status badge */}
                <td className="px-3 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize
                                ${STATUS_STYLES[r.status] ?? "bg-zinc-100 text-zinc-500"}`}
                  >
                    {r.status.toLowerCase()}
                  </span>
                </td>

                {/* Price */}
                <td className="px-3 py-3.5 font-medium text-zinc-700">
                  {formatPrice(r.price)}
                </td>

                {/* Stats */}
                <td className="px-3 py-3.5">
                  <div className="flex items-center justify-end gap-3 text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {r.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {r.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      {r._count.purchases}
                    </span>
                  </div>
                </td>

                {/* Edit link */}
                <td className="px-3 py-3.5 text-right">
                  <Link
                    href={`/admin/resources/${r.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200
                               bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 shadow-sm
                               transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
