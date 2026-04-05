import { Navbar } from "@/components/layout/Navbar";
import { PageContainer, PageContentWide } from "@/design-system";
import Link from "next/link";
import { getAdminTagsPageData } from "@/services/admin";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { TagsClient, type TagRow } from "./TagsClient";

export const metadata = {
  title: "Tag Management – Admin",
  description: "Create, edit, and delete tags in the library.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function getTags(): Promise<TagRow[]> {
  return getAdminTagsPageData();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminTagsPage() {
  await requireAdminSession(routes.adminTags);

  // ── 2. Data ──────────────────────────────────────────────────────────────────
  const tags = await getTags();

  // ── 3. Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <PageContainer className="py-10">
          <PageContentWide>

          {/* ── Page header ── */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="eyebrow mb-1">Admin</p>
              <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
                Tag Management
              </h1>
              <p className="mt-1 text-meta text-muted-foreground">
                Create, rename, and delete tags used across the resource library.
              </p>
            </div>

            <Link
              href={routes.admin}
              className="rounded-xl border border-border bg-card px-4 py-2
                         text-[13px] font-medium text-muted-foreground shadow-sm transition
                         hover:bg-muted hover:text-foreground"
            >
              ← Admin home
            </Link>
          </div>

          {/* ── Interactive section (client component) ── */}
          <TagsClient tags={tags} />
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}
