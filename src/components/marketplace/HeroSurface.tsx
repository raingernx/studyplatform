import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { buttonVariants } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  normalizeHeroStyle,
  type HeroPrimaryCtaColor,
  type HeroStyleFields,
  type HeroSecondaryCtaColor,
  type HeroPrimaryCtaVariant,
  type HeroSecondaryCtaVariant,
} from "@/lib/heroes/hero-style";

export type HeroSurfaceConfig = HeroStyleFields & {
  heroId?: string | null;
  source?: "cms" | "fallback";
  experimentId?: string | null;
  variant?: string | null;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
};

export type HeroCtaRenderProps = {
  href: string;
  label: string;
  className: string;
  kind: "primary" | "secondary";
};

const DEFAULT_HERO: HeroSurfaceConfig = {
  title: "Discover beautiful study resources",
  subtitle:
    "Worksheets, flashcards, and study guides from educators and creators.",
  primaryCtaText: "Browse resources",
  primaryCtaLink: routes.marketplaceCategory("all"),
  secondaryCtaText: "Start selling",
  secondaryCtaLink: routes.membership,
  badgeText: "Trusted by 12,000+ educators",
  imageUrl: null,
  mediaUrl: null,
  mediaType: null,
};

const HERO_HEIGHT_CLASS = {
  compact: "min-h-[420px] sm:min-h-[460px]",
  default: "min-h-[520px]",
  tall: "min-h-[580px] sm:min-h-[640px]",
} as const;

const HERO_CONTENT_WIDTH_CLASS = {
  narrow: "max-w-[560px]",
  normal: "max-w-[700px]",
  wide: "max-w-[840px]",
} as const;

const HERO_STACK_GAP_CLASS = {
  tight: "gap-4 sm:gap-5",
  normal: "gap-6",
  relaxed: "gap-7 sm:gap-8",
} as const;

const HERO_ALIGNMENT_CLASS = {
  left: {
    outer: "items-start text-left",
    actions: "justify-start",
  },
  center: {
    outer: "items-center text-center",
    actions: "justify-center",
  },
} as const;

const HERO_HEADING_FONT_CLASS = {
  display: "font-display",
  sans: "font-sans",
} as const;

const HERO_BODY_FONT_CLASS = {
  body: "font-body",
  sans: "font-sans",
} as const;

const HERO_TITLE_RESPONSIVE_CLASS = {
  md: {
    mobile: "text-3xl",
    desktop: "sm:text-4xl md:text-5xl",
  },
  lg: {
    mobile: "text-4xl",
    desktop: "sm:text-5xl md:text-6xl",
  },
  xl: {
    mobile: "text-4xl",
    desktop: "sm:text-5xl md:text-[4rem]",
  },
  display: {
    mobile: "text-5xl",
    desktop: "sm:text-6xl md:text-[4.5rem]",
  },
} as const;

const HERO_MOBILE_TITLE_CLASS = {
  sm: "text-3xl",
  md: "text-4xl",
  lg: "text-5xl",
} as const;

const HERO_SUBTITLE_RESPONSIVE_CLASS = {
  sm: {
    mobile: "text-sm",
    desktop: "sm:text-[15px] md:text-base",
  },
  md: {
    mobile: "text-base",
    desktop: "sm:text-lg md:text-xl",
  },
  lg: {
    mobile: "text-lg",
    desktop: "sm:text-xl md:text-2xl",
  },
} as const;

const HERO_MOBILE_SUBTITLE_CLASS = {
  sm: "text-sm",
  md: "text-base",
} as const;

const HERO_TITLE_WEIGHT_CLASS = {
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

const HERO_SUBTITLE_WEIGHT_CLASS = {
  normal: "font-normal",
  medium: "font-medium",
} as const;

const HERO_TITLE_COLOR_CLASS = {
  "pure-white": "text-white",
  "soft-white": "text-white/90",
  "muted-light": "text-slate-200",
  slate: "text-slate-500",
  charcoal: "text-zinc-900",
  black: "text-black",
} as const;

const HERO_SUBTITLE_COLOR_CLASS = {
  "soft-white": "text-white/90",
  "muted-light": "text-slate-200",
  slate: "text-slate-500",
  charcoal: "text-zinc-800",
} as const;

const HERO_BADGE_TEXT_COLOR_CLASS = {
  "pure-white": "text-white",
  "soft-white": "text-white/85",
  charcoal: "text-zinc-900",
  "brand-blue": "text-brand-700",
  "brand-purple": "text-accent-700",
} as const;

const HERO_BADGE_BG_CLASS = {
  transparent: "bg-transparent px-0 py-0",
  "frosted-white": "border border-white/20 bg-white/14 px-3 py-1.5",
  "soft-surface": "border border-surface-200/80 bg-surface-100/95 px-3 py-1.5",
  "brand-blue": "border border-brand-200 bg-brand-50 px-3 py-1.5",
  "brand-purple": "border border-accent-200 bg-accent-50 px-3 py-1.5",
} as const;

const HERO_OVERLAY_RGB = {
  transparent: "0, 0, 0",
  black: "0, 0, 0",
  "dark-slate": "15, 23, 42",
  navy: "30, 58, 138",
  purple: "76, 29, 149",
} as const;

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const HERO_PRIMARY_CTA_COLOR_CLASS = {
  "brand-blue": {
    filled: "border-brand-600 bg-brand-600 text-white hover:border-brand-700 hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500/50",
    soft: "border-brand-200 bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 focus-visible:ring-brand-500/30",
    vivid: "border-brand-500 bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-500/40",
    dark: "border-brand-700 bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 focus-visible:ring-brand-600/40",
  },
  "brand-purple": {
    filled: "border-accent-600 bg-accent-600 text-white hover:border-accent-700 hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-500/50",
    soft: "border-accent-200 bg-white text-accent-700 hover:bg-accent-50 hover:text-accent-800 focus-visible:ring-accent-400/30",
    vivid: "border-accent-500 bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus-visible:ring-accent-500/40",
    dark: "border-accent-800 bg-accent-800 text-white hover:bg-accent-900 active:bg-accent-900 focus-visible:ring-accent-700/40",
  },
  dark: {
    filled: "border-zinc-900 bg-zinc-900 text-white hover:border-zinc-800 hover:bg-zinc-800 active:bg-zinc-950 focus-visible:ring-zinc-700/50",
    soft: "border-surface-200 bg-white text-text-primary hover:bg-surface-50 hover:text-text-primary focus-visible:ring-surface-400/30",
    vivid: "border-zinc-800 bg-zinc-800 text-white hover:bg-zinc-900 active:bg-black focus-visible:ring-zinc-700/40",
    dark: "border-black bg-black text-white hover:bg-zinc-900 active:bg-black focus-visible:ring-zinc-700/40",
  },
} as const;

const HERO_SECONDARY_CTA_COLOR_CLASS = {
  white: {
    filled: "border-white/50 bg-white text-zinc-900 hover:bg-white/90 hover:text-zinc-950 focus-visible:ring-white/40",
    outline: "border-white/55 bg-transparent text-white hover:bg-white/12 hover:text-white focus-visible:ring-white/40",
    ghost: "border-transparent bg-transparent text-white hover:bg-white/12 hover:text-white focus-visible:ring-white/30",
  },
  neutral: {
    filled: "border-surface-200 bg-surface-100 text-text-primary hover:bg-surface-200 hover:text-text-primary focus-visible:ring-surface-400/30",
    outline: "border-surface-300 bg-white/90 text-text-primary hover:bg-white hover:text-text-primary focus-visible:ring-surface-400/30",
    ghost: "border-transparent bg-transparent text-text-primary hover:bg-surface-100/80 hover:text-text-primary focus-visible:ring-surface-400/25",
  },
  dark: {
    filled: "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white focus-visible:ring-zinc-700/40",
    outline: "border-zinc-900/25 bg-transparent text-zinc-900 hover:bg-zinc-900/5 hover:text-black focus-visible:ring-zinc-700/30",
    ghost: "border-transparent bg-transparent text-zinc-900 hover:bg-zinc-900/5 hover:text-black focus-visible:ring-zinc-700/20",
  },
} as const;

function resolveSecondaryCtaColor(
  variant: HeroSecondaryCtaVariant,
  color: HeroSecondaryCtaColor,
) {
  if ((variant === "outline" || variant === "ghost") && color === "dark") {
    return "white" as const;
  }

  return color;
}

function getHeroCtaClassName(
  variant: HeroPrimaryCtaVariant | HeroSecondaryCtaVariant,
  color: HeroPrimaryCtaColor | HeroSecondaryCtaColor,
  kind: "primary" | "secondary",
) {
  const resolvedSecondaryColor =
    kind === "secondary"
      ? resolveSecondaryCtaColor(
          variant as HeroSecondaryCtaVariant,
          color as HeroSecondaryCtaColor,
        )
      : null;
  const baseVariant = buttonVariants({
    variant:
      kind === "primary"
        ? variant === "secondary"
          ? "secondary"
          : "primary"
        : variant === "ghost"
          ? "ghost"
          : variant === "outline"
            ? "outline"
            : "secondary",
    size: "lg",
  });

  const toneClassName =
    kind === "primary"
      ? variant === "secondary"
        ? HERO_PRIMARY_CTA_COLOR_CLASS[color as HeroPrimaryCtaColor].soft
        : variant === "accent"
          ? HERO_PRIMARY_CTA_COLOR_CLASS[color as HeroPrimaryCtaColor].vivid
          : variant === "dark"
            ? HERO_PRIMARY_CTA_COLOR_CLASS[color as HeroPrimaryCtaColor].dark
            : HERO_PRIMARY_CTA_COLOR_CLASS[color as HeroPrimaryCtaColor].filled
      : variant === "outline"
        ? HERO_SECONDARY_CTA_COLOR_CLASS[resolvedSecondaryColor!].outline
        : variant === "ghost"
          ? HERO_SECONDARY_CTA_COLOR_CLASS[resolvedSecondaryColor!].ghost
          : HERO_SECONDARY_CTA_COLOR_CLASS[resolvedSecondaryColor!].filled;

  return cn(
    baseVariant,
    "rounded-lg px-5 text-sm",
    toneClassName,
  );
}

function getOverlayStyle(
  overlayColor: keyof typeof HERO_OVERLAY_RGB,
  overlayOpacity: number,
): CSSProperties {
  if (overlayColor === "transparent" || overlayOpacity <= 0) {
    return {
      background: "linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)",
    };
  }

  const alpha = overlayOpacity / 100;
  const midAlpha = Math.min(alpha, Math.max(0.18, alpha * 0.58));
  const rgb = HERO_OVERLAY_RGB[overlayColor];

  return {
    background: `linear-gradient(to top, rgba(${rgb}, ${alpha}) 0%, rgba(${rgb}, ${midAlpha}) 46%, rgba(${rgb}, 0) 100%)`,
  };
}

function HeroCta({
  render,
  href,
  label,
  className,
  kind,
}: {
  render?: (props: HeroCtaRenderProps) => ReactNode;
  href: string;
  label: string;
  className: string;
  kind: "primary" | "secondary";
}) {
  if (render) {
    return render({ href, label, className, kind });
  }

  return <Link href={href} className={className}>{label}</Link>;
}

export function HeroSurface({
  config,
  renderPrimaryCta,
  renderSecondaryCta,
  className,
}: {
  config?: HeroSurfaceConfig | null;
  renderPrimaryCta?: (props: HeroCtaRenderProps) => ReactNode;
  renderSecondaryCta?: (props: HeroCtaRenderProps) => ReactNode;
  className?: string;
}) {
  const hero = config ?? DEFAULT_HERO;
  const style = normalizeHeroStyle(hero);
  const title = hero.title || DEFAULT_HERO.title;
  const subtitle = hero.subtitle || DEFAULT_HERO.subtitle;
  const primaryCtaText = hero.primaryCtaText || DEFAULT_HERO.primaryCtaText;
  const primaryCtaLink = hero.primaryCtaLink || DEFAULT_HERO.primaryCtaLink;
  const secondaryCtaText =
    hero.secondaryCtaText ?? DEFAULT_HERO.secondaryCtaText;
  const secondaryCtaLink =
    hero.secondaryCtaLink ?? DEFAULT_HERO.secondaryCtaLink;
  const badgeText = hero.badgeText ?? DEFAULT_HERO.badgeText;
  const mediaUrl = normalizeOptionalString(hero.mediaUrl);
  const imageUrl = normalizeOptionalString(hero.imageUrl);
  const bgSrc = mediaUrl || imageUrl;
  const hasHeroMedia = Boolean(bgSrc);
  const heroMediaSrc = bgSrc ?? "";
  const isGif = hero.mediaType === "gif";
  const bypassHeroOptimizer = shouldBypassImageOptimizer(heroMediaSrc);
  const useOptimizedImage =
    hasHeroMedia &&
    !isGif &&
    !bypassHeroOptimizer;
  const alignment = HERO_ALIGNMENT_CLASS[style.textAlign];
  const titleSize = HERO_TITLE_RESPONSIVE_CLASS[style.titleSize];
  const subtitleSize = HERO_SUBTITLE_RESPONSIVE_CLASS[style.subtitleSize];
  const titleMobileOverride =
    style.mobileTitleSize === "inherit"
      ? null
      : HERO_MOBILE_TITLE_CLASS[style.mobileTitleSize];
  const subtitleMobileOverride =
    style.mobileSubtitleSize === "inherit"
      ? null
      : HERO_MOBILE_SUBTITLE_CLASS[style.mobileSubtitleSize];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[32px] border border-surface-200/70 bg-surface-200",
        HERO_HEIGHT_CLASS[style.heroHeight],
        className,
      )}
    >
      {hasHeroMedia && useOptimizedImage ? (
        <Image
          src={heroMediaSrc}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          unoptimized={bypassHeroOptimizer}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      ) : hasHeroMedia ? (
        <img
          src={heroMediaSrc}
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(255,255,255,0.82)_26%,rgba(240,244,255,0.6)_42%,rgba(224,232,255,0.3)_56%,rgba(219,234,254,0.12)_72%,rgba(219,234,254,0)_100%),linear-gradient(135deg,#eef3ff_0%,#ffffff_34%,#e5edff_100%)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(92,106,196,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(180deg,rgba(70,48,217,0.22),rgba(49,46,129,0.1))]" />
          <div className="absolute -left-20 top-12 h-72 w-72 rounded-[48px] bg-[linear-gradient(180deg,rgba(67,56,202,0.92),rgba(49,46,129,0.86))] opacity-95 shadow-[0_18px_60px_rgba(67,56,202,0.18)]" />
          <div className="absolute left-[28%] top-6 h-48 w-48 rounded-[36px] border border-white/45 bg-white/78 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm" />
          <div className="absolute left-[42%] top-0 h-24 w-24 rounded-[28px] bg-[linear-gradient(180deg,rgba(67,56,202,0.92),rgba(79,70,229,0.82))]" />
          <div className="absolute right-[19%] top-6 h-56 w-24 rounded-[28px] bg-[linear-gradient(180deg,rgba(67,56,202,0.92),rgba(79,70,229,0.82))]" />
          <div className="absolute right-0 top-8 h-[calc(100%-2rem)] w-40 rounded-l-[40px] bg-[linear-gradient(180deg,rgba(67,56,202,0.96),rgba(49,46,129,0.92))] shadow-[-16px_0_48px_rgba(67,56,202,0.16)]" />
          <div className="absolute left-[37%] top-[18%] h-72 w-80 rounded-[42px] border border-white/30 bg-white/8 backdrop-blur-[2px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[54%] bg-[linear-gradient(180deg,rgba(55,48,163,0.9),rgba(30,27,75,0.96))]" />
          <div className="absolute bottom-0 left-[38%] h-56 w-56 rounded-t-[48px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(255,255,255,0.38)_44%,rgba(255,255,255,0)_72%)]" />
          <div className="absolute bottom-0 right-[10%] h-72 w-[22rem] rounded-t-[72px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.74),rgba(255,255,255,0.42)_38%,rgba(255,255,255,0)_72%)]" />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={getOverlayStyle(style.overlayColor, style.overlayOpacity)}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-16 translate-y-10 rounded-full bg-brand-500/15 blur-3xl" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-center px-6 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-18">
        <div
          className={cn(
            "relative z-10 mx-auto flex w-full flex-col text-balance",
            HERO_CONTENT_WIDTH_CLASS[style.contentWidth],
            HERO_STACK_GAP_CLASS[style.spacingPreset],
            alignment.outer,
          )}
        >
          {badgeText ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full text-xs font-medium tracking-wide",
                HERO_BADGE_TEXT_COLOR_CLASS[style.badgeTextColor],
                HERO_BADGE_BG_CLASS[style.badgeBgColor],
              )}
            >
              {badgeText}
            </span>
          ) : null}

          <h1
            className={cn(
              "leading-[1.05] tracking-tight text-balance",
              HERO_HEADING_FONT_CLASS[style.headingFont],
              HERO_TITLE_WEIGHT_CLASS[style.titleWeight],
              HERO_TITLE_COLOR_CLASS[style.titleColor],
              titleMobileOverride ?? titleSize.mobile,
              titleSize.desktop,
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "max-w-[720px] text-balance",
              HERO_BODY_FONT_CLASS[style.bodyFont],
              HERO_SUBTITLE_WEIGHT_CLASS[style.subtitleWeight],
              HERO_SUBTITLE_COLOR_CLASS[style.subtitleColor],
              subtitleMobileOverride ?? subtitleSize.mobile,
              subtitleSize.desktop,
            )}
          >
            {subtitle}
          </p>

          <div
            className={cn(
              "flex flex-wrap items-center gap-3 pt-2 sm:pt-3",
              alignment.actions,
            )}
          >
            <HeroCta
              render={renderPrimaryCta}
              href={primaryCtaLink}
              label={primaryCtaText}
              className={getHeroCtaClassName(
                style.primaryCtaVariant,
                style.primaryCtaColor,
                "primary",
              )}
              kind="primary"
            />
            {secondaryCtaText && secondaryCtaLink ? (
              <HeroCta
                render={renderSecondaryCta}
                href={secondaryCtaLink}
                label={secondaryCtaText}
                className={getHeroCtaClassName(
                  style.secondaryCtaVariant,
                  style.secondaryCtaColor,
                  "secondary",
                )}
                kind="secondary"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSurfaceSkeleton({
  config,
  className,
}: {
  config?: HeroSurfaceConfig | null;
  className?: string;
}) {
  const style = normalizeHeroStyle(config ?? DEFAULT_HERO);
  const alignment = HERO_ALIGNMENT_CLASS[style.textAlign];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[32px] border border-surface-200/70 bg-surface-200",
        HERO_HEIGHT_CLASS[style.heroHeight],
        className,
      )}
    >
      <div className="absolute inset-0 flex flex-col justify-center px-6 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-18">
        <div
          className={cn(
            "relative z-10 mx-auto flex w-full flex-col text-balance",
            HERO_CONTENT_WIDTH_CLASS[style.contentWidth],
            HERO_STACK_GAP_CLASS[style.spacingPreset],
            alignment.outer,
          )}
        >
          <LoadingSkeleton className="h-7 w-52 rounded-full border border-surface-200/80 bg-white/75" />
          <div className="space-y-3">
            <LoadingSkeleton className="h-12 w-full max-w-[720px] rounded-2xl bg-white/80 sm:h-16" />
            <LoadingSkeleton className="h-12 w-4/5 max-w-[620px] rounded-2xl bg-white/70 sm:h-16" />
          </div>
          <div className="space-y-2">
            <LoadingSkeleton className="h-5 w-full max-w-[680px] bg-white/70" />
            <LoadingSkeleton className="h-5 w-3/4 max-w-[540px] bg-white/60" />
          </div>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 pt-2 sm:pt-3",
              alignment.actions,
            )}
          >
            <LoadingSkeleton className="h-12 w-40 rounded-lg bg-white/90" />
            <LoadingSkeleton className="h-12 w-36 rounded-lg border border-white/60 bg-white/35" />
          </div>
        </div>
      </div>
    </div>
  );
}
