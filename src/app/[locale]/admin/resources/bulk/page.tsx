import { Navbar } from "@/components/layout/Navbar";
import { PageContainer, PageContent } from "@/design-system";
import { BulkUploadClient } from "./BulkUploadClient";
import Link from "next/link";
import { Layers } from "lucide-react";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Bulk Upload – Admin",
  description: "Upload multiple resources at once using JSON.",
};

export default async function BulkUploadPage() {
  await requireAdminSession(routes.adminBulkUpload);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <PageContainer className="py-10">
          <PageContent>

          {/* ── Page header ── */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="eyebrow mb-1">Admin · Resources</p>
              <h1 className="flex items-center gap-2.5 font-display text-h2 font-semibold tracking-tight text-text-primary">
                <Layers className="h-6 w-6 text-blue-500" />
                Bulk Upload
              </h1>
              <p className="mt-1 text-meta text-zinc-500">
                Paste a JSON array to create up to 100 resources in one operation.
              </p>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-2">
              <Link
                href={routes.adminResources}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2
                           text-[13px] font-medium text-zinc-600 shadow-sm transition
                           hover:bg-zinc-50 hover:text-zinc-900"
              >
                ← Resources
              </Link>
              <Link
                href={routes.admin}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2
                           text-[13px] font-medium text-zinc-600 shadow-sm transition
                           hover:bg-zinc-50 hover:text-zinc-900"
              >
                Admin home
              </Link>
            </div>
          </div>

          {/* ── Client component with all interactive logic ── */}
          <BulkUploadClient />
          </PageContent>
        </PageContainer>
      </main>
    </div>
  );
}
