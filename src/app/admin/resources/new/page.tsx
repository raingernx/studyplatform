import { getAdminResourceCreatePageData } from "@/services/admin";
import { CreateResourceForm } from "./CreateResourceForm";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Create Resource – Admin",
  description: "Manually create a new marketplace resource.",
};

export default async function AdminNewResourcePage() {
  const session = await requireAdminSession(routes.adminNewResource);

  const { categories, tags } = await getAdminResourceCreatePageData();

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
            Create Resource
          </h1>
          <p className="mt-1 text-meta text-muted-foreground">
            Fill in the details below to add a new resource to the marketplace.
          </p>
        </div>
      </div>

      <CreateResourceForm
        categories={categories}
        tags={tags}
        currentUser={
          session.user?.id
            ? { id: session.user.id, name: session.user.name ?? null }
            : undefined
        }
      />
    </div>
  );
}
