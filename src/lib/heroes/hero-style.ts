export const HERO_TEXT_ALIGN_VALUES = ["left", "center"] as const;
export type HeroTextAlign = (typeof HERO_TEXT_ALIGN_VALUES)[number];

export const HERO_CONTENT_WIDTH_VALUES = [
  "narrow",
  "normal",
  "wide",
] as const;
export type HeroContentWidth = (typeof HERO_CONTENT_WIDTH_VALUES)[number];

export const HERO_HEIGHT_VALUES = ["compact", "default", "tall"] as const;
export type HeroHeight = (typeof HERO_HEIGHT_VALUES)[number];

export const HERO_SPACING_VALUES = ["tight", "normal", "relaxed"] as const;
export type HeroSpacingPreset = (typeof HERO_SPACING_VALUES)[number];

export const HERO_HEADING_FONT_VALUES = ["display", "sans"] as const;
export type HeroHeadingFont = (typeof HERO_HEADING_FONT_VALUES)[number];

export const HERO_BODY_FONT_VALUES = ["body", "sans"] as const;
export type HeroBodyFont = (typeof HERO_BODY_FONT_VALUES)[number];

export const HERO_TITLE_SIZE_VALUES = [
  "md",
  "lg",
  "xl",
  "display",
] as const;
export type HeroTitleSize = (typeof HERO_TITLE_SIZE_VALUES)[number];

export const HERO_SUBTITLE_SIZE_VALUES = ["sm", "md", "lg"] as const;
export type HeroSubtitleSize = (typeof HERO_SUBTITLE_SIZE_VALUES)[number];

export const HERO_TITLE_WEIGHT_VALUES = ["semibold", "bold"] as const;
export type HeroTitleWeight = (typeof HERO_TITLE_WEIGHT_VALUES)[number];

export const HERO_SUBTITLE_WEIGHT_VALUES = ["normal", "medium"] as const;
export type HeroSubtitleWeight =
  (typeof HERO_SUBTITLE_WEIGHT_VALUES)[number];

export const HERO_MOBILE_TITLE_SIZE_VALUES = [
  "inherit",
  "sm",
  "md",
  "lg",
] as const;
export type HeroMobileTitleSize =
  (typeof HERO_MOBILE_TITLE_SIZE_VALUES)[number];

export const HERO_MOBILE_SUBTITLE_SIZE_VALUES = [
  "inherit",
  "sm",
  "md",
] as const;
export type HeroMobileSubtitleSize =
  (typeof HERO_MOBILE_SUBTITLE_SIZE_VALUES)[number];

export const HERO_TITLE_COLOR_VALUES = [
  "pure-white",
  "soft-white",
  "muted-light",
  "slate",
  "charcoal",
  "black",
] as const;
export type HeroTitleColor = (typeof HERO_TITLE_COLOR_VALUES)[number];

export const HERO_SUBTITLE_COLOR_VALUES = [
  "soft-white",
  "muted-light",
  "slate",
  "charcoal",
] as const;
export type HeroSubtitleColor = (typeof HERO_SUBTITLE_COLOR_VALUES)[number];

export const HERO_BADGE_TEXT_COLOR_VALUES = [
  "pure-white",
  "soft-white",
  "charcoal",
  "brand-blue",
  "brand-purple",
] as const;
export type HeroBadgeTextColor =
  (typeof HERO_BADGE_TEXT_COLOR_VALUES)[number];

export const HERO_BADGE_BG_COLOR_VALUES = [
  "transparent",
  "frosted-white",
  "soft-surface",
  "brand-blue",
  "brand-purple",
] as const;
export type HeroBadgeBgColor = (typeof HERO_BADGE_BG_COLOR_VALUES)[number];

export const HERO_PRIMARY_CTA_VARIANT_VALUES = [
  "primary",
  "secondary",
  "dark",
  "accent",
] as const;
export type HeroPrimaryCtaVariant =
  (typeof HERO_PRIMARY_CTA_VARIANT_VALUES)[number];

export const HERO_SECONDARY_CTA_VARIANT_VALUES = [
  "secondary",
  "ghost",
  "outline",
] as const;
export type HeroSecondaryCtaVariant =
  (typeof HERO_SECONDARY_CTA_VARIANT_VALUES)[number];

export const HERO_PRIMARY_CTA_COLOR_VALUES = [
  "brand-blue",
  "brand-purple",
  "dark",
] as const;
export type HeroPrimaryCtaColor =
  (typeof HERO_PRIMARY_CTA_COLOR_VALUES)[number];

export const HERO_SECONDARY_CTA_COLOR_VALUES = [
  "white",
  "neutral",
  "dark",
] as const;
export type HeroSecondaryCtaColor =
  (typeof HERO_SECONDARY_CTA_COLOR_VALUES)[number];

export const HERO_OVERLAY_COLOR_VALUES = [
  "transparent",
  "black",
  "dark-slate",
  "navy",
  "purple",
] as const;
export type HeroOverlayColor = (typeof HERO_OVERLAY_COLOR_VALUES)[number];

export type HeroStyleFields = {
  textAlign?: HeroTextAlign | null;
  contentWidth?: HeroContentWidth | null;
  heroHeight?: HeroHeight | null;
  spacingPreset?: HeroSpacingPreset | null;
  headingFont?: HeroHeadingFont | null;
  bodyFont?: HeroBodyFont | null;
  titleSize?: HeroTitleSize | null;
  subtitleSize?: HeroSubtitleSize | null;
  titleWeight?: HeroTitleWeight | null;
  subtitleWeight?: HeroSubtitleWeight | null;
  mobileTitleSize?: HeroMobileTitleSize | null;
  mobileSubtitleSize?: HeroMobileSubtitleSize | null;
  titleColor?: HeroTitleColor | null;
  subtitleColor?: HeroSubtitleColor | null;
  badgeTextColor?: HeroBadgeTextColor | null;
  badgeBgColor?: HeroBadgeBgColor | null;
  primaryCtaVariant?: HeroPrimaryCtaVariant | null;
  secondaryCtaVariant?: HeroSecondaryCtaVariant | null;
  primaryCtaColor?: HeroPrimaryCtaColor | null;
  secondaryCtaColor?: HeroSecondaryCtaColor | null;
  overlayColor?: HeroOverlayColor | null;
  overlayOpacity?: number | null;
};

export type HeroStyleInput = {
  textAlign?: string | null;
  contentWidth?: string | null;
  heroHeight?: string | null;
  spacingPreset?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  titleSize?: string | null;
  subtitleSize?: string | null;
  titleWeight?: string | null;
  subtitleWeight?: string | null;
  mobileTitleSize?: string | null;
  mobileSubtitleSize?: string | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  badgeTextColor?: string | null;
  badgeBgColor?: string | null;
  primaryCtaVariant?: string | null;
  secondaryCtaVariant?: string | null;
  primaryCtaColor?: string | null;
  secondaryCtaColor?: string | null;
  overlayColor?: string | null;
  overlayOpacity?: number | null;
};

export type ResolvedHeroStyleConfig = {
  textAlign: HeroTextAlign;
  contentWidth: HeroContentWidth;
  heroHeight: HeroHeight;
  spacingPreset: HeroSpacingPreset;
  headingFont: HeroHeadingFont;
  bodyFont: HeroBodyFont;
  titleSize: HeroTitleSize;
  subtitleSize: HeroSubtitleSize;
  titleWeight: HeroTitleWeight;
  subtitleWeight: HeroSubtitleWeight;
  mobileTitleSize: HeroMobileTitleSize;
  mobileSubtitleSize: HeroMobileSubtitleSize;
  titleColor: HeroTitleColor;
  subtitleColor: HeroSubtitleColor;
  badgeTextColor: HeroBadgeTextColor;
  badgeBgColor: HeroBadgeBgColor;
  primaryCtaVariant: HeroPrimaryCtaVariant;
  secondaryCtaVariant: HeroSecondaryCtaVariant;
  primaryCtaColor: HeroPrimaryCtaColor;
  secondaryCtaColor: HeroSecondaryCtaColor;
  overlayColor: HeroOverlayColor;
  overlayOpacity: number;
};

export const HERO_STYLE_DEFAULTS: ResolvedHeroStyleConfig = {
  textAlign: "center",
  contentWidth: "normal",
  heroHeight: "default",
  spacingPreset: "normal",
  headingFont: "display",
  bodyFont: "body",
  titleSize: "lg",
  subtitleSize: "md",
  titleWeight: "semibold",
  subtitleWeight: "normal",
  mobileTitleSize: "inherit",
  mobileSubtitleSize: "inherit",
  titleColor: "pure-white",
  subtitleColor: "soft-white",
  badgeTextColor: "soft-white",
  badgeBgColor: "transparent",
  primaryCtaVariant: "primary",
  secondaryCtaVariant: "outline",
  primaryCtaColor: "brand-blue",
  secondaryCtaColor: "white",
  overlayColor: "black",
  overlayOpacity: 50,
};

type Option<T extends string> = { value: T; label: string };

export const HERO_STYLE_OPTIONS = {
  textAlign: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
  ] satisfies Option<HeroTextAlign>[],
  contentWidth: [
    { value: "narrow", label: "Narrow" },
    { value: "normal", label: "Normal" },
    { value: "wide", label: "Wide" },
  ] satisfies Option<HeroContentWidth>[],
  heroHeight: [
    { value: "compact", label: "Compact" },
    { value: "default", label: "Default" },
    { value: "tall", label: "Tall" },
  ] satisfies Option<HeroHeight>[],
  spacingPreset: [
    { value: "tight", label: "Tight" },
    { value: "normal", label: "Normal" },
    { value: "relaxed", label: "Relaxed" },
  ] satisfies Option<HeroSpacingPreset>[],
  headingFont: [
    { value: "display", label: "Display" },
    { value: "sans", label: "Sans" },
  ] satisfies Option<HeroHeadingFont>[],
  bodyFont: [
    { value: "body", label: "Body" },
    { value: "sans", label: "Sans" },
  ] satisfies Option<HeroBodyFont>[],
  titleSize: [
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "Extra large" },
    { value: "display", label: "Display" },
  ] satisfies Option<HeroTitleSize>[],
  subtitleSize: [
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
  ] satisfies Option<HeroSubtitleSize>[],
  titleWeight: [
    { value: "semibold", label: "Semibold" },
    { value: "bold", label: "Bold" },
  ] satisfies Option<HeroTitleWeight>[],
  subtitleWeight: [
    { value: "normal", label: "Normal" },
    { value: "medium", label: "Medium" },
  ] satisfies Option<HeroSubtitleWeight>[],
  mobileTitleSize: [
    { value: "inherit", label: "Inherit desktop preset" },
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
  ] satisfies Option<HeroMobileTitleSize>[],
  mobileSubtitleSize: [
    { value: "inherit", label: "Inherit desktop preset" },
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
  ] satisfies Option<HeroMobileSubtitleSize>[],
  titleColor: [
    { value: "pure-white", label: "Pure White" },
    { value: "soft-white", label: "Soft White" },
    { value: "muted-light", label: "Muted Light" },
    { value: "slate", label: "Slate" },
    { value: "charcoal", label: "Charcoal" },
    { value: "black", label: "Black" },
  ] satisfies Option<HeroTitleColor>[],
  subtitleColor: [
    { value: "soft-white", label: "Soft White" },
    { value: "muted-light", label: "Muted Light" },
    { value: "slate", label: "Slate" },
    { value: "charcoal", label: "Charcoal" },
  ] satisfies Option<HeroSubtitleColor>[],
  badgeTextColor: [
    { value: "pure-white", label: "Pure White" },
    { value: "soft-white", label: "Soft White" },
    { value: "charcoal", label: "Charcoal" },
    { value: "brand-blue", label: "Brand Blue" },
    { value: "brand-purple", label: "Brand Purple" },
  ] satisfies Option<HeroBadgeTextColor>[],
  badgeBgColor: [
    { value: "transparent", label: "Transparent" },
    { value: "frosted-white", label: "Frosted White" },
    { value: "soft-surface", label: "Soft Surface" },
    { value: "brand-blue", label: "Brand Blue" },
    { value: "brand-purple", label: "Brand Purple" },
  ] satisfies Option<HeroBadgeBgColor>[],
  primaryCtaVariant: [
    { value: "primary", label: "Primary" },
    { value: "secondary", label: "Secondary" },
    { value: "dark", label: "Dark" },
    { value: "accent", label: "Accent" },
  ] satisfies Option<HeroPrimaryCtaVariant>[],
  secondaryCtaVariant: [
    { value: "secondary", label: "Secondary" },
    { value: "ghost", label: "Ghost" },
    { value: "outline", label: "Outline" },
  ] satisfies Option<HeroSecondaryCtaVariant>[],
  primaryCtaColor: [
    { value: "brand-blue", label: "Brand Blue" },
    { value: "brand-purple", label: "Brand Purple" },
    { value: "dark", label: "Dark" },
  ] satisfies Option<HeroPrimaryCtaColor>[],
  secondaryCtaColor: [
    { value: "white", label: "White" },
    { value: "neutral", label: "Neutral" },
    { value: "dark", label: "Dark" },
  ] satisfies Option<HeroSecondaryCtaColor>[],
  overlayColor: [
    { value: "transparent", label: "Transparent" },
    { value: "black", label: "Black" },
    { value: "dark-slate", label: "Dark Slate" },
    { value: "navy", label: "Navy" },
    { value: "purple", label: "Purple" },
  ] satisfies Option<HeroOverlayColor>[],
};

export type HeroColorTokenOption<T extends string> = Option<T> & {
  swatchClassName: string;
  helper?: string;
};

export const HERO_COLOR_TOKEN_OPTIONS = {
  titleColor: [
    {
      value: "pure-white",
      label: "Pure White",
      swatchClassName: "bg-white border border-zinc-300",
    },
    {
      value: "soft-white",
      label: "Soft White",
      swatchClassName: "bg-zinc-100 border border-zinc-300",
    },
    {
      value: "muted-light",
      label: "Muted Light",
      swatchClassName: "bg-slate-300 border border-slate-400",
    },
    {
      value: "slate",
      label: "Slate",
      swatchClassName: "bg-slate-500 border border-slate-600",
    },
    {
      value: "charcoal",
      label: "Charcoal",
      swatchClassName: "bg-zinc-800 border border-zinc-900",
    },
    {
      value: "black",
      label: "Black",
      swatchClassName: "bg-black border border-black",
    },
  ] satisfies HeroColorTokenOption<HeroTitleColor>[],
  subtitleColor: [
    {
      value: "soft-white",
      label: "Soft White",
      swatchClassName: "bg-zinc-100 border border-zinc-300",
    },
    {
      value: "muted-light",
      label: "Muted Light",
      swatchClassName: "bg-slate-300 border border-slate-400",
    },
    {
      value: "slate",
      label: "Slate",
      swatchClassName: "bg-slate-500 border border-slate-600",
    },
    {
      value: "charcoal",
      label: "Charcoal",
      swatchClassName: "bg-zinc-800 border border-zinc-900",
    },
  ] satisfies HeroColorTokenOption<HeroSubtitleColor>[],
  badgeTextColor: [
    {
      value: "pure-white",
      label: "Pure White",
      swatchClassName: "bg-white border border-zinc-300",
    },
    {
      value: "soft-white",
      label: "Soft White",
      swatchClassName: "bg-zinc-100 border border-zinc-300",
    },
    {
      value: "charcoal",
      label: "Charcoal",
      swatchClassName: "bg-zinc-800 border border-zinc-900",
    },
    {
      value: "brand-blue",
      label: "Brand Blue",
      swatchClassName: "bg-brand-600 border border-brand-700",
    },
    {
      value: "brand-purple",
      label: "Brand Purple",
      swatchClassName: "bg-accent-600 border border-accent-700",
    },
  ] satisfies HeroColorTokenOption<HeroBadgeTextColor>[],
  badgeBgColor: [
    {
      value: "transparent",
      label: "Transparent",
      swatchClassName:
        "bg-[linear-gradient(45deg,#ffffff_25%,#e4e4e7_25%,#e4e4e7_50%,#ffffff_50%,#ffffff_75%,#e4e4e7_75%,#e4e4e7_100%)] bg-[length:8px_8px] border border-zinc-300",
    },
    {
      value: "frosted-white",
      label: "Frosted White",
      swatchClassName: "bg-white/80 border border-zinc-300",
    },
    {
      value: "soft-surface",
      label: "Soft Surface",
      swatchClassName: "bg-surface-100 border border-surface-300",
    },
    {
      value: "brand-blue",
      label: "Brand Blue",
      swatchClassName: "bg-brand-100 border border-brand-300",
    },
    {
      value: "brand-purple",
      label: "Brand Purple",
      swatchClassName: "bg-accent-100 border border-accent-300",
    },
  ] satisfies HeroColorTokenOption<HeroBadgeBgColor>[],
  overlayColor: [
    {
      value: "transparent",
      label: "Transparent",
      swatchClassName:
        "bg-[linear-gradient(45deg,#ffffff_25%,#e4e4e7_25%,#e4e4e7_50%,#ffffff_50%,#ffffff_75%,#e4e4e7_75%,#e4e4e7_100%)] bg-[length:8px_8px] border border-zinc-300",
    },
    {
      value: "black",
      label: "Black",
      swatchClassName: "bg-black border border-black",
    },
    {
      value: "dark-slate",
      label: "Dark Slate",
      swatchClassName: "bg-slate-800 border border-slate-900",
    },
    {
      value: "navy",
      label: "Navy",
      swatchClassName: "bg-brand-900 border border-brand-950",
    },
    {
      value: "purple",
      label: "Purple",
      swatchClassName: "bg-accent-800 border border-accent-900",
    },
  ] satisfies HeroColorTokenOption<HeroOverlayColor>[],
  primaryCtaColor: [
    {
      value: "brand-blue",
      label: "Brand Blue",
      swatchClassName: "bg-brand-600 border border-brand-700",
      helper: "Strong filled brand CTA with white text.",
    },
    {
      value: "brand-purple",
      label: "Brand Purple",
      swatchClassName: "bg-accent-600 border border-accent-700",
      helper: "Vivid accent CTA with white text.",
    },
    {
      value: "dark",
      label: "Dark",
      swatchClassName: "bg-zinc-900 border border-zinc-950",
      helper: "High-contrast dark CTA with white text.",
    },
  ] satisfies HeroColorTokenOption<HeroPrimaryCtaColor>[],
  secondaryCtaColor: [
    {
      value: "white",
      label: "White",
      swatchClassName: "bg-white border border-zinc-300",
      helper: "Light secondary action with dark text.",
    },
    {
      value: "neutral",
      label: "Neutral",
      swatchClassName: "bg-surface-100 border border-surface-300",
      helper: "Soft neutral action with dark text.",
    },
    {
      value: "dark",
      label: "Dark",
      swatchClassName: "bg-zinc-900 border border-zinc-950",
      helper: "Dark secondary action with white text.",
    },
  ] satisfies HeroColorTokenOption<HeroSecondaryCtaColor>[],
} as const;

const HERO_TITLE_COLOR_ALIASES: Record<string, HeroTitleColor> = {
  white: "pure-white",
  "white-soft": "soft-white",
  "zinc-900": "charcoal",
  "text-primary": "charcoal",
};

const HERO_SUBTITLE_COLOR_ALIASES: Record<string, HeroSubtitleColor> = {
  "white-soft": "soft-white",
  "white-muted": "muted-light",
  "zinc-700": "slate",
  "text-secondary": "slate",
};

const HERO_BADGE_TEXT_COLOR_ALIASES: Record<string, HeroBadgeTextColor> = {
  white: "pure-white",
  "white-soft": "soft-white",
  "brand-700": "brand-blue",
  "zinc-900": "charcoal",
};

const HERO_BADGE_BG_COLOR_ALIASES: Record<string, HeroBadgeBgColor> = {
  "white-10": "frosted-white",
  "white-15": "frosted-white",
  "brand-50": "brand-blue",
  "surface-100": "soft-surface",
};

const HERO_OVERLAY_COLOR_ALIASES: Record<string, HeroOverlayColor> = {
  black: "black",
  "zinc-900": "dark-slate",
  "brand-900": "navy",
};

const HERO_PRIMARY_CTA_COLOR_ALIASES: Record<string, HeroPrimaryCtaColor> = {
  primary: "brand-blue",
  accent: "brand-purple",
  dark: "dark",
};

const HERO_SECONDARY_CTA_COLOR_ALIASES: Record<string, HeroSecondaryCtaColor> = {
  secondary: "white",
  outline: "white",
  ghost: "neutral",
  dark: "dark",
};

function includes<T extends string>(
  values: readonly T[],
  value: string | null | undefined,
): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function normalizeMappedValue<T extends string>(
  values: readonly T[],
  aliases: Record<string, T>,
  value: string | null | undefined,
  fallback: T,
) {
  const resolved = typeof value === "string" ? aliases[value] ?? value : value;
  return includes(values, resolved) ? resolved : fallback;
}

export function normalizeHeroOverlayOpacity(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return HERO_STYLE_DEFAULTS.overlayOpacity;
  }

  const stepped = Math.round(value / 5) * 5;
  return Math.min(80, Math.max(0, stepped));
}

export function normalizeHeroStyle(
  input?: HeroStyleInput | null,
): ResolvedHeroStyleConfig {
  return {
    textAlign: includes(HERO_TEXT_ALIGN_VALUES, input?.textAlign)
      ? input.textAlign
      : HERO_STYLE_DEFAULTS.textAlign,
    contentWidth: includes(HERO_CONTENT_WIDTH_VALUES, input?.contentWidth)
      ? input.contentWidth
      : HERO_STYLE_DEFAULTS.contentWidth,
    heroHeight: includes(HERO_HEIGHT_VALUES, input?.heroHeight)
      ? input.heroHeight
      : HERO_STYLE_DEFAULTS.heroHeight,
    spacingPreset: includes(HERO_SPACING_VALUES, input?.spacingPreset)
      ? input.spacingPreset
      : HERO_STYLE_DEFAULTS.spacingPreset,
    headingFont: includes(HERO_HEADING_FONT_VALUES, input?.headingFont)
      ? input.headingFont
      : HERO_STYLE_DEFAULTS.headingFont,
    bodyFont: includes(HERO_BODY_FONT_VALUES, input?.bodyFont)
      ? input.bodyFont
      : HERO_STYLE_DEFAULTS.bodyFont,
    titleSize: includes(HERO_TITLE_SIZE_VALUES, input?.titleSize)
      ? input.titleSize
      : HERO_STYLE_DEFAULTS.titleSize,
    subtitleSize: includes(HERO_SUBTITLE_SIZE_VALUES, input?.subtitleSize)
      ? input.subtitleSize
      : HERO_STYLE_DEFAULTS.subtitleSize,
    titleWeight: includes(HERO_TITLE_WEIGHT_VALUES, input?.titleWeight)
      ? input.titleWeight
      : HERO_STYLE_DEFAULTS.titleWeight,
    subtitleWeight: includes(HERO_SUBTITLE_WEIGHT_VALUES, input?.subtitleWeight)
      ? input.subtitleWeight
      : HERO_STYLE_DEFAULTS.subtitleWeight,
    mobileTitleSize: includes(HERO_MOBILE_TITLE_SIZE_VALUES, input?.mobileTitleSize)
      ? input.mobileTitleSize
      : HERO_STYLE_DEFAULTS.mobileTitleSize,
    mobileSubtitleSize: includes(
      HERO_MOBILE_SUBTITLE_SIZE_VALUES,
      input?.mobileSubtitleSize,
    )
      ? input.mobileSubtitleSize
      : HERO_STYLE_DEFAULTS.mobileSubtitleSize,
    titleColor: normalizeMappedValue(
      HERO_TITLE_COLOR_VALUES,
      HERO_TITLE_COLOR_ALIASES,
      input?.titleColor,
      HERO_STYLE_DEFAULTS.titleColor,
    ),
    subtitleColor: normalizeMappedValue(
      HERO_SUBTITLE_COLOR_VALUES,
      HERO_SUBTITLE_COLOR_ALIASES,
      input?.subtitleColor,
      HERO_STYLE_DEFAULTS.subtitleColor,
    ),
    badgeTextColor: normalizeMappedValue(
      HERO_BADGE_TEXT_COLOR_VALUES,
      HERO_BADGE_TEXT_COLOR_ALIASES,
      input?.badgeTextColor,
      HERO_STYLE_DEFAULTS.badgeTextColor,
    ),
    badgeBgColor: normalizeMappedValue(
      HERO_BADGE_BG_COLOR_VALUES,
      HERO_BADGE_BG_COLOR_ALIASES,
      input?.badgeBgColor,
      HERO_STYLE_DEFAULTS.badgeBgColor,
    ),
    primaryCtaVariant: includes(
      HERO_PRIMARY_CTA_VARIANT_VALUES,
      input?.primaryCtaVariant,
    )
      ? input.primaryCtaVariant
      : HERO_STYLE_DEFAULTS.primaryCtaVariant,
    secondaryCtaVariant: includes(
      HERO_SECONDARY_CTA_VARIANT_VALUES,
      input?.secondaryCtaVariant,
    )
      ? input.secondaryCtaVariant
      : HERO_STYLE_DEFAULTS.secondaryCtaVariant,
    primaryCtaColor: normalizeMappedValue(
      HERO_PRIMARY_CTA_COLOR_VALUES,
      HERO_PRIMARY_CTA_COLOR_ALIASES,
      input?.primaryCtaColor,
      HERO_STYLE_DEFAULTS.primaryCtaColor,
    ),
    secondaryCtaColor: normalizeMappedValue(
      HERO_SECONDARY_CTA_COLOR_VALUES,
      HERO_SECONDARY_CTA_COLOR_ALIASES,
      input?.secondaryCtaColor,
      HERO_STYLE_DEFAULTS.secondaryCtaColor,
    ),
    overlayColor: normalizeMappedValue(
      HERO_OVERLAY_COLOR_VALUES,
      HERO_OVERLAY_COLOR_ALIASES,
      input?.overlayColor,
      HERO_STYLE_DEFAULTS.overlayColor,
    ),
    overlayOpacity: normalizeHeroOverlayOpacity(input?.overlayOpacity),
  };
}
