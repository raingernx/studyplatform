import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateResourceForm } from "./CreateResourceForm";

export const metadata = {
  title: "Create Resource – Admin",
  description: "Manually create a new marketplace resource.",
};

export default async function AdminNewResourcePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/resources/new");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Create Resource
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Fill in the details below to add a new resource to the marketplace.
          </p>
        </div>
      </div>

      <CreateResourceForm categories={categories} tags={tags} />
    </div>
  );
}

