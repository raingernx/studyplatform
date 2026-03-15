"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";

interface HeroTrackedLinkProps {
  heroId?: string | null;
  experimentId?: string | null;
  variant?: string | null;
  href: string;
  className: string;
  children: ReactNode;
}

export function HeroTrackedLink({
  heroId,
  experimentId,
  variant,
  href,
  className,
  children,
}: HeroTrackedLinkProps) {
  function handleClick(_event: MouseEvent<HTMLAnchorElement>) {
    if (!heroId) {
      return;
    }

    void fetch("/api/hero/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroId,
        experimentId: experimentId ?? null,
        variant: variant ?? null,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
