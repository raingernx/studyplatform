"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = { children: ReactNode };

/**
 * Renders the website footer only on public routes. Admin pages (/…/admin/…)
 * and dashboard pages (/…/dashboard/…) do not show the footer so app shells
 * stay focused on their own navigation chrome.
 */
export function PublicSiteFooter({ children }: Props) {
  const pathname = usePathname();

  if (pathname?.includes("/admin") || pathname?.includes("/dashboard")) {
    return null;
  }

  return <>{children}</>;
}
