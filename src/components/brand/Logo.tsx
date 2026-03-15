"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "icon";

export type LogoSize = "sm" | "md" | "lg" | "xl" | "sidebar";

interface LogoProps {
  /** full = icon + stacked "paper" / "dock"; icon = mark only (e.g. collapsed sidebar) */
  variant?: LogoVariant;
  /**
   * sm: navbar/dashboard — 30px icon, text-xl
   * sidebar: dashboard sidebar — 28px icon, 21px text
   * md: landing hero — 40px icon, text-2xl
   * lg: 38×40px icon, 26px text; xl: text-4xl
   */
  size?: LogoSize;
  /** Dark background: use text-white; light: text-zinc-900 */
  dark?: boolean;
  className?: string;
}

const ICON_WIDTH: Record<LogoSize, number> = {
  sm: 30,
  sidebar: 28,
  md: 40,
  lg: 38,
  xl: 56,
};

const ICON_HEIGHT: Record<LogoSize, number> = {
  sm: 30,
  sidebar: 28,
  md: 40,
  lg: 40,
  xl: 56,
};

const TEXT_SIZE: Record<LogoSize, string> = {
  sm: "text-xl",
  sidebar: "text-[21px]",
  md: "text-2xl",
  lg: "text-[26px]",
  xl: "text-4xl",
};

export function Logo({
  variant = "full",
  size = "sm",
  dark = false,
  className,
}: LogoProps) {
  const iconWidth = ICON_WIDTH[size];
  const iconHeight = ICON_HEIGHT[size];
  const textSizeClass = TEXT_SIZE[size];
  const textColor = dark ? "text-white" : "text-zinc-900";

  return (
    <Link
      href="/resources"
      className={cn(
        "inline-flex items-center justify-start gap-2.5 align-bottom transition-opacity hover:opacity-90",
        className
      )}
      aria-label="PaperDock – Home"
    >
      <Image
        src="/brand/paperdock-mark.svg"
        alt="PaperDock"
        width={iconWidth}
        height={iconHeight}
        priority
        className="flex-shrink-0"
      />

      {variant === "full" && (
        <span
          className={cn(
            "flex flex-col leading-[0.72] tracking-[-0.02em] apotek-logo text-left pb-1",
            textSizeClass,
            textColor
          )}
        >
          <span className="block leading-[0.72] text-left">paper</span>
          <span className="block leading-[0.72] text-left">dock</span>
        </span>
      )}
    </Link>
  );
}
