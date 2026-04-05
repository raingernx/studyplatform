import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Cookie Policy",
  description: "How we use cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <>
      <Suspense fallback={<div aria-hidden="true" className="h-16 border-b border-border bg-background" />}>
        <Navbar />
      </Suspense>
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                1. What are cookies?
              </h2>
              <p>
                Cookies are small text files placed on your device when you visit a website.
                They help us keep you signed in, remember your preferences, and understand
                how you use our platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                2. Cookies we use
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1.5">
                <li>
                  <span className="font-medium text-foreground">Essential cookies</span> —
                  Required for authentication and core platform functionality.
                </li>
                <li>
                  <span className="font-medium text-foreground">Analytics cookies</span> —
                  Help us understand how visitors interact with the platform so we can
                  improve it.
                </li>
                <li>
                  <span className="font-medium text-foreground">Preference cookies</span> —
                  Remember settings such as your display language.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                3. Third-party cookies
              </h2>
              <p>
                Some features (such as payment processing) are provided by third-party services
                that may set their own cookies. We do not control these cookies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                4. Managing cookies
              </h2>
              <p>
                You can control and delete cookies through your browser settings. Disabling
                essential cookies will affect your ability to sign in and use the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                5. More information
              </h2>
              <p>
                For more details about how we handle your data, see our{" "}
                <a
                  href={routes.privacy}
                  className="text-primary underline hover:text-primary"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
