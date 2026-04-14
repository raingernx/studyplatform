import Link from "next/link";
import { CheckCircle, BookOpen, Download, Library } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { CheckoutSuccessTracker } from "@/components/checkout/CheckoutSuccessTracker";
import { routes } from "@/lib/routes";

/**
 * /checkout/success
 *
 * Purely informational landing page shown after a provider redirects the buyer
 * back to the platform following a payment attempt.
 *
 * IMPORTANT: This page does NOT create, update, or complete any purchase
 * records. Purchase completion happens exclusively via the provider's webhook.
 * The buyer's library will reflect the purchase once the webhook is processed —
 * typically within a few seconds.
 */

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export const metadata = {
  title: "Payment received",
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { slug } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutSuccessTracker slug={slug} />
      <Navbar />

      <main className="flex flex-1 items-center bg-background">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-md">
            <div className="rounded-[28px] border border-emerald-200 bg-card p-8 shadow-card sm:p-10">
              {/* Icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>

              {/* Heading */}
              <h1 className="mt-5 text-center font-display text-xl font-semibold tracking-tight text-foreground">
                You&apos;re all set!
              </h1>

              {/* Body */}
              <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-muted-foreground">
                {slug
                  ? "Head back to the resource — your download will be ready in a few seconds."
                  : "Your purchase is confirmed. Head to your library — it's ready within a few seconds."}
              </p>

              {/* Urgency nudge */}
              <p className="mt-2 text-center text-[13px] font-medium text-emerald-600">
                Start using it now while it&apos;s fresh ✓
              </p>

              {/* Divider */}
              <div className="my-6 border-t border-border" />

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                {slug ? (
                  <>
                    {/*
                      Primary: send the buyer back to the resource page with
                      ?payment=success so the PendingPurchasePoller activates.
                      Once the webhook processes, the page automatically shows
                      the Download button — no library navigation required.
                    */}
                    <Link
                      href={routes.resourcePaymentSuccess(slug)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <Download className="h-4 w-4" />
                      Go back &amp; download
                    </Link>
                    <Link
                      href={routes.dashboardV2Library}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <Library className="h-4 w-4" />
                      View my library
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Fallback when no slug — e.g. Xendit flows that drop slug.
                        ?payment=success activates the recovery block on the
                        library page so the buyer can find their purchase. */}
                    <Link
                      href={routes.dashboardV2LibraryPaymentSuccess()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <Library className="h-4 w-4" />
                      Go to My Library
                    </Link>
                    <Link
                      href={routes.marketplace}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <BookOpen className="h-4 w-4" />
                      Browse more resources
                    </Link>
                  </>
                )}
              </div>

              {/* Reassurance */}
              <p className="mt-5 text-center text-[12px] text-muted-foreground">
                If your library doesn&apos;t update within a minute,{" "}
                <Link
                  href={routes.support}
                  className="underline underline-offset-2 transition hover:text-foreground"
                >
                  contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
