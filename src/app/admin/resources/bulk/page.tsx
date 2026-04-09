import { Navbar } from "@/components/layout/Navbar";
import { Button, PageContainer, PageContent } from "@/design-system";
import { BulkUploadClient } from "./BulkUploadClient";
import Link from "next/link";
import { Layers } from "lucide-react";
import { routes } from "@/lib/routes";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Bulk Upload – Admin",
  description: "Upload multiple resources at once using JSON.",
};

export default async function BulkUploadPage() {
  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <PageContainer className="py-10">
          <PageContent className="space-y-8">
            <AdminPageHeader
              title="Bulk Upload"
              description="Paste a JSON array to create up to 100 resources in one operation."
              actions={
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href={routes.adminResources}>← Resources</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={routes.admin}>Admin home</Link>
                  </Button>
                </>
              }
            />

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-caption text-muted-foreground shadow-sm">
              <Layers className="h-4 w-4 text-brand-600" />
              Admin · Resources
            </div>

            <BulkUploadClient />
          </PageContent>
        </PageContainer>
      </main>
    </div>
  );
}
