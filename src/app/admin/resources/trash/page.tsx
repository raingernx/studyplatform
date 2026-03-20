import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/design-system";
import { AdminResourcesTrashTable } from "@/components/admin/AdminResourcesTrashTable";

export const metadata = {
  title: "Trash – Admin",
  description: "View and restore resources that have been moved to trash.",
};

const PAGE_SIZE = 50;

export default async function AdminResourcesTrashPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/resources/trash");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const trashedResources = await prisma.resource.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: PAGE_SIZE,
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  const rows = trashedResources.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    deletedAt: r.deletedAt!,
    author: r.author,
  }));

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Trash
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            View resources that have been moved to trash. Restored items will
            reappear in the main resources list.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="inline-flex items-center gap-2"
        >
          <Link href="/admin/resources">
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
            <span>Back to Resources</span>
          </Link>
        </Button>
      </div>

      <AdminResourcesTrashTable resources={rows} />
    </>
  );
}
