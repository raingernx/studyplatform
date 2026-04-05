import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center">
        <Container className="py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            404
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            Page not found
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            The page you were looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={routes.marketplace}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Browse resources
            </Link>
            <Link
              href={routes.home}
              className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Go home
            </Link>
          </div>
        </Container>
      </main>
    </div>
  );
}
