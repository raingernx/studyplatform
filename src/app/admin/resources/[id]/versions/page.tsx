import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/design-system";
import { getAdminResourceVersionsPageData } from "@/services/admin";
import { ResourceVersionsClient } from "./ResourceVersionsClient";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: "Resource Versions – Admin",
};

export default async function ResourceVersionsPage({ params }: Props) {
  const { id } = await params;
  await requireAdminSession(routes.adminResourceVersions(id));

  const { resource, versions } = await getAdminResourceVersionsPageData(id);

  if (!resource) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
          Versions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage file versions for this resource.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{resource.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Slug: {resource.slug}</span>
            <span className="text-border">•</span>
            <span>Status: {resource.status}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <ResourceVersionsClient
            resourceId={resource.id}
            initialVersions={versions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
