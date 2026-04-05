import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/design-system";
import { routes } from "@/lib/routes";

const CREATORS_LINKS = [
  { href: routes.marketplace, label: "Sell resources" },
  { href: routes.membership, label: "Membership" },
];

const RESOURCES_LINKS = [
  { href: routes.marketplace, label: "Browse all" },
  { href: routes.marketplacePrice("free"), label: "Free resources" },
  { href: routes.category("mathematics"), label: "Mathematics" },
  { href: routes.category("science"), label: "Science" },
];

const LEGAL_LINKS = [
  { href: routes.privacy, label: "Privacy Policy" },
  { href: routes.terms, label: "Terms" },
  { href: routes.cookies, label: "Cookie Policy" },
];

interface FooterProps {
  platformName: string;
}

export function Footer({ platformName }: FooterProps) {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Logo variant="full" size="sm" />
            <p className="mt-3 max-w-[200px] text-[13px] leading-relaxed text-muted-foreground font-thai">
              มาร์เก็ตเพลสสำหรับสื่อการเรียนรู้แบบดาวน์โหลด
            </p>
          </div>

          {/* Creators */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Creators
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CREATORS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-[12px] text-muted-foreground font-thai">
            © {new Date().getFullYear()} {platformName}. สงวนลิขสิทธิ์ทั้งหมด
          </p>
          <div className="flex items-center gap-4">
            <Link
              href={routes.privacy}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href={routes.terms}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href={routes.cookies}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
