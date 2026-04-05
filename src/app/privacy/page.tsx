import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                1. Information we collect
              </h2>
              <p>
                We collect information you provide directly (such as your name, email address,
                and payment details) as well as usage data (pages visited, resources downloaded)
                to provide and improve our services.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                2. How we use your information
              </h2>
              <p>
                We use your information to operate the platform, process transactions, send
                service-related communications, and personalise your experience. We do not sell
                your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                3. Data retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as needed to
                provide our services. You may request deletion of your account at any time by
                contacting us.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                4. Cookies
              </h2>
              <p>
                We use cookies and similar technologies to keep you signed in and to understand
                how you use our platform. See our{" "}
                <a
                  href={routes.cookies}
                  className="text-primary underline hover:text-primary/80"
                >
                  Cookie Policy
                </a>{" "}
                for details.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                5. Contact
              </h2>
              <p>
                If you have questions about this policy, please contact us at{" "}
                <a
                  href="mailto:privacy@example.com"
                  className="text-primary underline hover:text-primary/80"
                >
                  privacy@example.com
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
