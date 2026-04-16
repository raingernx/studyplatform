import { Navbar } from "@/components/layout/Navbar";
import { MarketplaceNavbarSearch } from "@/components/marketplace/MarketplaceNavbarSearch";
import { MembershipPageClient } from "@/components/membership/MembershipPageClient";
import { PageContainer } from "@/design-system";

export default function MembershipPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar headerSearch={<MarketplaceNavbarSearch />} />
      <main className="flex-1">
        <PageContainer className="py-12 sm:py-14 lg:py-16">
          <MembershipPageClient />
        </PageContainer>
      </main>
    </div>
  );
}
