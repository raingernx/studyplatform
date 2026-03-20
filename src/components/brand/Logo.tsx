"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";

export type LogoVariant = "full" | "icon" | "email";

export type LogoSize = "sm" | "md" | "lg" | "xl" | "sidebar";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  dark?: boolean;
  className?: string;
}

const FULL_IMAGE_CLASS: Record<LogoSize, string> = {
  sm: "h-8 max-w-[170px]",
  sidebar: "h-8 max-w-[180px]",
  md: "h-10 max-w-[220px]",
  lg: "h-10 max-w-[240px]",
  xl: "h-14 max-w-[320px]",
};

const ICON_IMAGE_CLASS: Record<LogoSize, string> = {
  sm: "h-8 max-w-8",
  sidebar: "h-8 max-w-8",
  md: "h-10 max-w-10",
  lg: "h-10 max-w-10",
  xl: "h-14 max-w-14",
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

function renderLogoAsset(src: string, alt: string, className: string) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={320}
        height={96}
        priority
        className={cn("w-auto object-contain flex-shrink-0", className)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={320}
      height={96}
      className={cn("w-auto object-contain flex-shrink-0", className)}
    />
  );
}

export function Logo({
  variant = "full",
  size = "sm",
  dark = false,
  className,
}: LogoProps) {
  const platform = usePlatformConfig();
  const platformName = platform.platformShortName;
  const textColor = dark ? "text-white" : "text-zinc-900";
  const fullLogoUrl = platform.logoFullUrl;
  const iconLogoUrl = platform.logoIconUrl;
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
        return renderLogoAsset(iconLogoUrl, imageAlt, ICON_IMAGE_CLASS[size]);
      }

      if (fullLogoUrl) {
        return renderLogoAsset(
          fullLogoUrl,
          imageAlt,
          cn(FULL_IMAGE_CLASS[size], "max-w-[132px]"),
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
      return renderLogoAsset(fullLogoUrl, imageAlt, FULL_IMAGE_CLASS[size]);
    }

    if (iconLogoUrl) {
      return (
        <span className="inline-flex items-center justify-start gap-2.5">
          {renderLogoAsset(iconLogoUrl, imageAlt, ICON_IMAGE_CLASS[size])}
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

  return (
    <Link
      href="/resources"
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
