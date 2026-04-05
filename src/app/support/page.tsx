import type { Metadata } from "next";
import Link from "next/link";
import { Mail, LifeBuoy, ArrowLeft } from "lucide-react";
import { Container } from "@/design-system";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { getBuildSafePlatformConfig } from "@/services/platform";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with purchases, downloads, and your account.",
};

export default async function SupportPage() {
  const platform = getBuildSafePlatformConfig();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-3xl space-y-8">
            <Link
              href={routes.marketplace}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to marketplace
            </Link>

            <section className="rounded-[32px] border border-border bg-card p-8 shadow-card sm:p-10">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <LifeBuoy className="h-4 w-4" />
                  Support
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Need help with your purchase or account?
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Contact the support team if your library has not updated, a download is missing,
                  or you need help with billing and account access.
                </p>
              </div>

              <div className="mt-8 rounded-3xl border border-border bg-muted p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Email support
                </p>
                <a
                  href={`mailto:${platform.supportEmail}`}
                  className="mt-3 inline-flex items-center gap-3 text-base font-semibold text-primary transition hover:text-foreground"
                >
                  <Mail className="h-5 w-5" />
                  {platform.supportEmail}
                </a>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Include the email address used for your account and, if relevant, the resource
                  title or order details so support can resolve the issue faster.
                </p>
              </div>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
