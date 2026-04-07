"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import {
  beginResourcesNavigation,
  isResourcesSubtreePath,
} from "@/components/marketplace/resourcesNavigationState";
import { routes } from "@/lib/routes";

const DESKTOP_LOGO_WIDTH = 121;
const DESKTOP_LOGO_HEIGHT = 40;
const MOBILE_LOGO_SIZE = 40;

function ThemeAwareNavbarAsset({
  lightSrc,
  darkSrc,
  alt,
  className,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className: string;
}) {
  return (
    <span className={`theme-logo-stack theme-logo-stack--auto ${className}`} aria-hidden="true">
      <span className="theme-logo-layer theme-logo-layer--light">
        <img
          src={lightSrc}
          alt=""
          width={DESKTOP_LOGO_WIDTH}
          height={DESKTOP_LOGO_HEIGHT}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="block h-full w-full shrink-0"
        />
      </span>
      <span className="theme-logo-layer theme-logo-layer--dark">
        <img
          src={darkSrc}
          alt={alt}
          width={DESKTOP_LOGO_WIDTH}
          height={DESKTOP_LOGO_HEIGHT}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="block h-full w-full shrink-0"
        />
      </span>
    </span>
  );
}

export function NavbarBrand() {
  const pathname = usePathname();

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    beginResourcesNavigation("discover", routes.marketplace, {
      overlay: !isResourcesSubtreePath(pathname),
    });

    const isAlreadyDiscoverRoute =
      pathname === routes.marketplace &&
      typeof window !== "undefined" &&
      window.location.search.length === 0;

    if (isAlreadyDiscoverRoute) {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }

  return (
    <Link
      href={routes.marketplace}
      scroll
      onClick={handleLogoClick}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-start sm:w-[220px]"
      aria-label="Krukraft – Home"
    >
      <ThemeAwareNavbarAsset
        lightSrc="/brand/krukraft-logo.svg"
        darkSrc="/brand/krukraft-logo-dark.svg"
        alt="Krukraft logo"
        className="hidden h-10 w-[121px] shrink-0 sm:flex"
      />
      <ThemeAwareNavbarAsset
        lightSrc="/brand/krukraft-mark.svg"
        darkSrc="/brand/krukraft-mark-dark.svg"
        alt="Krukraft icon"
        className="flex h-10 w-10 shrink-0 sm:hidden"
      />
    </Link>
  );
}
