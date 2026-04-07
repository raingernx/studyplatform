"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import {
  beginResourcesNavigation,
  isResourcesSubtreePath,
} from "@/components/marketplace/resourcesNavigationState";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import { routes } from "@/lib/routes";

export type LogoVariant = "full" | "icon" | "email";

export type LogoSize = "sm" | "md" | "lg" | "xl" | "sidebar";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  dark?: boolean;
  className?: string;
  preferRepoAsset?: boolean;
}

const FULL_IMAGE_CLASS: Record<LogoSize, string> = {
  sm: "h-8 w-[170px]",
  sidebar: "h-8 w-[180px]",
  md: "h-10 w-[220px]",
  lg: "h-10 w-[240px]",
  xl: "h-14 w-[320px]",
};

const ICON_IMAGE_CLASS: Record<LogoSize, string> = {
  sm: "h-8 w-8",
  sidebar: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
};

const ICON_FALLBACK_CLASS: Record<LogoSize, string> = {
  sm: "h-8 w-8 text-sm",
  sidebar: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-10 w-10 text-base",
  xl: "h-14 w-14 text-xl",
};

const TEXT_SIZE_CLASS: Record<LogoSize, string> = {
  sm: "text-xl",
  sidebar: "text-[21px]",
  md: "text-2xl",
  lg: "text-[26px]",
  xl: "text-4xl",
};

function renderLogoAsset(
  src: string,
  alt: string,
  className: string,
  options?: {
    onError?: () => void;
    priority?: boolean;
    fetchPriority?: "high" | "low" | "auto";
  },
) {
  return (
    <img
      src={src}
      alt={alt}
      width={320}
      height={96}
      loading={options?.priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={options?.fetchPriority}
      onError={options?.onError}
      className={cn(
        "block h-full w-full flex-shrink-0 object-contain object-left",
        className,
      )}
    />
  );
}

function ThemeAwareLogoAsset({
  alt,
  lightSrc,
  darkSrc,
  fallbackLightSrc,
  fallbackDarkSrc,
  wrapperClassName,
  forceDark = false,
}: {
  alt: string;
  lightSrc: string;
  darkSrc: string;
  fallbackLightSrc: string;
  fallbackDarkSrc: string;
  wrapperClassName: string;
  forceDark?: boolean;
}) {
  const [lightFailed, setLightFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const resolvedLightSrc = lightFailed ? fallbackLightSrc : lightSrc;
  const resolvedDarkSrc = darkFailed ? fallbackDarkSrc : darkSrc;

  return (
    <span
      className={cn(
        "theme-logo-stack",
        forceDark ? "theme-logo-stack--force-dark" : "theme-logo-stack--auto",
        wrapperClassName,
      )}
      aria-hidden="true"
    >
      <span className="theme-logo-layer theme-logo-layer--light">
        {renderLogoAsset(resolvedLightSrc, "", "", {
          onError: () => {
            if (!lightFailed && lightSrc !== fallbackLightSrc) {
              setLightFailed(true);
            }
          },
          fetchPriority: "high",
          priority: true,
        })}
      </span>
      <span className="theme-logo-layer theme-logo-layer--dark">
        {renderLogoAsset(resolvedDarkSrc, alt, "", {
          onError: () => {
            if (!darkFailed && darkSrc !== fallbackDarkSrc) {
              setDarkFailed(true);
            }
          },
          fetchPriority: "high",
          priority: true,
        })}
      </span>
    </span>
  );
}

export function Logo({
  variant = "full",
  size = "sm",
  dark = false,
  className,
  preferRepoAsset = false,
}: LogoProps) {
  const pathname = usePathname();
  const platform = usePlatformConfig();
  const platformName = platform.platformShortName;
  const textColor = dark ? "text-white" : "text-foreground";
  const fullLogoUrl = preferRepoAsset
    ? PLATFORM_DEFAULTS.logoFullUrl
    : platform.logoFullUrl;
  const fullLogoDarkUrl = preferRepoAsset
    ? PLATFORM_DEFAULTS.logoFullDarkUrl
    : platform.logoFullDarkUrl;
  const iconLogoUrl = preferRepoAsset
    ? PLATFORM_DEFAULTS.logoIconUrl
    : platform.logoIconUrl;
  const iconLogoDarkUrl = preferRepoAsset
    ? PLATFORM_DEFAULTS.logoIconDarkUrl
    : platform.logoIconDarkUrl;
  const emailLogoUrl = platform.logoEmailUrl;
  const brandInitial = platformName.trim().charAt(0).toUpperCase() || "K";
  const imageAlt = `${platformName} logo`;

  const content = (() => {
    if (variant === "email") {
      if (emailLogoUrl) {
        return renderLogoAsset(emailLogoUrl, imageAlt, FULL_IMAGE_CLASS[size]);
      }

      return (
        <span
          className={cn(
            "block font-heading font-semibold leading-none tracking-tight",
            TEXT_SIZE_CLASS[size],
            textColor,
          )}
        >
          {platformName}
        </span>
      );
    }

    if (variant === "icon") {
      if (iconLogoUrl) {
        return (
          <ThemeAwareLogoAsset
            alt={imageAlt}
            lightSrc={iconLogoUrl}
            darkSrc={iconLogoDarkUrl || iconLogoUrl}
            fallbackLightSrc={PLATFORM_DEFAULTS.logoIconUrl}
            fallbackDarkSrc={PLATFORM_DEFAULTS.logoIconDarkUrl}
            wrapperClassName={ICON_IMAGE_CLASS[size]}
            forceDark={dark}
          />
        );
      }

      if (fullLogoUrl) {
        return (
          <ThemeAwareLogoAsset
            alt={imageAlt}
            lightSrc={fullLogoUrl}
            darkSrc={fullLogoDarkUrl || fullLogoUrl}
            fallbackLightSrc={PLATFORM_DEFAULTS.logoFullUrl}
            fallbackDarkSrc={PLATFORM_DEFAULTS.logoFullDarkUrl}
            wrapperClassName={cn(FULL_IMAGE_CLASS[size], "w-[132px]")
            }
            forceDark={dark}
          />
        );
      }

      return (
        <span
          className={cn(
            "flex items-center justify-center rounded-lg bg-brand-600 font-semibold text-white",
            ICON_FALLBACK_CLASS[size],
          )}
          aria-hidden="true"
        >
          {brandInitial}
        </span>
      );
    }

    if (fullLogoUrl) {
      return (
        <ThemeAwareLogoAsset
          alt={imageAlt}
          lightSrc={fullLogoUrl}
          darkSrc={fullLogoDarkUrl || fullLogoUrl}
          fallbackLightSrc={PLATFORM_DEFAULTS.logoFullUrl}
          fallbackDarkSrc={PLATFORM_DEFAULTS.logoFullDarkUrl}
          wrapperClassName={FULL_IMAGE_CLASS[size]}
          forceDark={dark}
        />
      );
    }

    if (iconLogoUrl) {
      return (
        <span className="inline-flex items-center justify-start gap-2.5">
          <ThemeAwareLogoAsset
            alt={imageAlt}
            lightSrc={iconLogoUrl}
            darkSrc={iconLogoDarkUrl || iconLogoUrl}
            fallbackLightSrc={PLATFORM_DEFAULTS.logoIconUrl}
            fallbackDarkSrc={PLATFORM_DEFAULTS.logoIconDarkUrl}
            wrapperClassName={ICON_IMAGE_CLASS[size]}
            forceDark={dark}
          />
          <span
            className={cn(
              "flex items-center pb-0.5 font-heading font-semibold tracking-tight leading-none",
              TEXT_SIZE_CLASS[size],
              textColor,
            )}
          >
            {platformName}
          </span>
        </span>
      );
    }

    return (
      <span
        className={cn(
          "block font-heading font-semibold leading-none tracking-tight",
          TEXT_SIZE_CLASS[size],
          textColor,
        )}
      >
        {platformName}
      </span>
    );
  })();

  if (variant === "email") {
    return (
      <div
        className={cn("inline-flex items-center justify-start gap-2.5", className)}
        aria-label={`${platformName} logo`}
      >
        {content}
      </div>
    );
  }

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
      className={cn(
        "inline-flex items-center justify-start gap-2.5 align-bottom transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={`${platformName} – Home`}
    >
      {content}
    </Link>
  );
}
