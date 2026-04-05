import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";

export const metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of our platform.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                1. Acceptance of terms
              </h2>
              <p>
                By accessing or using our platform you agree to be bound by these Terms of
                Service. If you do not agree, please do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                2. Use of the platform
              </h2>
              <p>
                You may use the platform only for lawful purposes and in accordance with these
                terms. You must not use the platform in any way that violates applicable laws
                or regulations, or that infringes on the rights of others.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                3. Purchased content
              </h2>
              <p>
                Resources purchased on the platform are licensed for your personal, non-commercial
                use only. Redistribution or resale of downloaded content is prohibited unless
                explicitly permitted by the creator.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                4. Creator responsibilities
              </h2>
              <p>
                Creators are responsible for ensuring that content they upload does not infringe
                third-party intellectual property rights and complies with all applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                5. Limitation of liability
              </h2>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect,
                incidental, or consequential damages arising out of your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                6. Changes to these terms
              </h2>
              <p>
                We may update these terms from time to time. Continued use of the platform after
                changes are posted constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
