import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PageContainer, PageContentWide } from "@/design-system";

const CREATORS_LINKS = [
  { href: "/resources", label: "Sell resources" },
  { href: "/membership", label: "Membership" },
  { href: "#", label: "Creator guidelines" },
  { href: "#", label: "Help center" },
];

const RESOURCES_LINKS = [
  { href: "/resources", label: "Browse all" },
  { href: "/resources?price=free", label: "Free resources" },
  { href: "/categories/mathematics", label: "Mathematics" },
  { href: "/categories/science", label: "Science" },
];

const COMPANY_LINKS = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Contact" },
  { href: "#", label: "Careers" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookie Policy" },
];

interface FooterProps {
  platformName: string;
}

export function Footer({ platformName }: FooterProps) {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <PageContainer className="py-14">
        <PageContentWide>
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div>
            <Logo variant="full" size="sm" />
            <p className="mt-3 max-w-[200px] text-[13px] leading-relaxed text-zinc-500 font-thai">
              มาร์เก็ตเพลสสำหรับสื่อการเรียนรู้แบบดาวน์โหลด
            </p>
          </div>

          {/* Creators */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Creators
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CREATORS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-6 sm:flex-row">
          <p className="text-[12px] text-zinc-400 font-thai">
            © {new Date().getFullYear()} {platformName}. สงวนลิขสิทธิ์ทั้งหมด
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
        </PageContentWide>
      </PageContainer>
    </footer>
  );
}
