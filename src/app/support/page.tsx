import type { Metadata } from "next";
import Link from "next/link";
import { Mail, LifeBuoy, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { getPlatform } from "@/services/platform.service";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with purchases, downloads, and your account.",
};

export default async function SupportPage() {
  const platform = await getPlatform();

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-3xl space-y-8">
            <Link
              href={routes.marketplace}
              className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to marketplace
            </Link>

            <section className="rounded-[32px] border border-surface-200 bg-white p-8 shadow-card sm:p-10">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  <LifeBuoy className="h-4 w-4" />
                  Support
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                  Need help with your purchase or account?
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
                  Contact the support team if your library has not updated, a download is missing,
                  or you need help with billing and account access.
                </p>
              </div>

              <div className="mt-8 rounded-3xl border border-surface-200 bg-surface-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Email support
                </p>
                <a
                  href={`mailto:${platform.supportEmail}`}
                  className="mt-3 inline-flex items-center gap-3 text-base font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  <Mail className="h-5 w-5" />
                  {platform.supportEmail}
                </a>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
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
