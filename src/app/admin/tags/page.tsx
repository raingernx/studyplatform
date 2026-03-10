import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { TagsClient, type TagRow } from "./TagsClient";

export const metadata = {
  title: "Tag Management – Admin",
  description: "Create, edit, and delete tags in the StudyPlatform library.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getTags(): Promise<TagRow[]> {
  return prisma.tag.findMany({
    orderBy: [
      // Most-used tags first so commonly managed tags appear at the top.
      { resources: { _count: "desc" } },
      { name: "asc" },
    ],
    select: {
      id:     true,
      name:   true,
      slug:   true,
      _count: { select: { resources: true } },
    },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminTagsPage() {
  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/tags");
  }

  const role = session.user.role;

  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  // ── 2. Data ──────────────────────────────────────────────────────────────────
  const tags = await getTags();

  // ── 3. Render ────────────────────────────────────────────────────────────────
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
                Tag Management
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Create, rename, and delete tags used across the resource library.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2
                         text-[13px] font-medium text-zinc-600 shadow-sm transition
                         hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Admin home
            </Link>
          </div>

          {/* ── Interactive section (client component) ── */}
          <TagsClient tags={tags} />

        </div>
      </main>
    </div>
  );
}
