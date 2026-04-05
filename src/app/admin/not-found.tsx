import Link from "next/link";
import { Button, Card } from "@/design-system";
import { routes } from "@/lib/routes";

export default function AdminRouteNotFound() {
  return (
    <Card className="mx-auto max-w-2xl rounded-2xl px-6 py-8 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
          Admin page missing
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          This admin page could not be found.
        </h1>
        <p className="text-body leading-7 text-muted-foreground">
          Return to the admin dashboard or open the resources workspace.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href={routes.admin}>Admin dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.adminResources}>Manage resources</Link>
        </Button>
      </div>
    </Card>
  );
}
