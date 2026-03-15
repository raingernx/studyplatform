"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = { children: ReactNode };

/**
 * Renders the website footer only on public routes. Admin pages (/…/admin/…)
 * do not show the footer so the admin panel stays Sidebar + Topbar + Content.
 */
export function PublicSiteFooter({ children }: Props) {
  const pathname = usePathname();

  if (pathname?.includes("/admin")) {
    return null;
  }

  return <>{children}</>;
}
