"use client";

import type { MouseEvent, ReactNode } from "react";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";

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
    <IntentPrefetchLink
      href={href}
      className={className}
      onClick={handleClick}
      prefetchMode="viewport"
      prefetchScope="hero-cta"
      prefetchLimit={2}
      resourcesNavigationMode="auto"
    >
      {children}
    </IntentPrefetchLink>
  );
}
