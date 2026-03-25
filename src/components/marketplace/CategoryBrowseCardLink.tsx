"use client";

import type { MouseEvent, ReactNode } from "react";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";

interface CategoryBrowseCardLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function CategoryBrowseCardLink({
  href,
  className,
  children,
}: CategoryBrowseCardLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    beginResourcesNavigation("listing", href);
  }

  return (
    <IntentPrefetchLink
      href={href}
      onClick={handleClick}
      className={className}
      prefetchMode="viewport"
      prefetchScope="category-browse-card"
      prefetchLimit={4}
    >
      {children}
    </IntentPrefetchLink>
  );
}
