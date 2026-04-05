import Link from "next/link";
import { Button, Card } from "@/design-system";
import { routes } from "@/lib/routes";

export default function AdminResourcesNotFound() {
  return (
    <Card className="rounded-2xl px-6 py-8 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
          Resource page missing
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          This admin resource page could not be found.
        </h1>
        <p className="text-body leading-7 text-muted-foreground">
          Go back to the resource index to continue managing the library.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <Button asChild>
          <Link href={routes.adminResources}>Open resources</Link>
        </Button>
      </div>
    </Card>
  );
}
