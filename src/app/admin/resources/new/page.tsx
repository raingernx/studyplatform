import { Suspense } from "react";
import { getAdminResourceCreatePageData } from "@/services/admin";
import { CreateResourceForm } from "./CreateResourceForm";
import { AdminResourcesCreateFormSkeleton } from "@/components/skeletons/AdminResourcesRouteSkeletons";

export const metadata = {
  title: "Create Resource – Admin",
  description: "Manually create a new marketplace resource.",
};

export default function AdminNewResourcePage() {
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

      <Suspense fallback={<AdminResourcesCreateFormSkeleton />}>
        <AdminNewResourceFormSection />
      </Suspense>
    </div>
  );
}

async function AdminNewResourceFormSection() {
  const { categories, tags } = await getAdminResourceCreatePageData();

  return <CreateResourceForm categories={categories} tags={tags} />;
}
