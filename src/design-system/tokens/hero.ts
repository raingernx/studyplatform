import { radius } from "./radius";
import { spacing } from "./spacing";
import { fontSizeScale } from "./typography";

export const hero = {
  spacing: {
    badgeY: "4px",
    badgeX: "10px",
    chipY: "8px",
    chipX: "12px",
    stackGap: spacing.xl,
    buttonY: "14px",
    buttonX: "20px",
    panelGap: spacing.lg,
    cardPadding: spacing.lg,
    sectionPaddingY: "32px",
    sectionPaddingX: "40px",
    mobilePaddingY: spacing.xl,
    mobilePaddingX: "20px",
  },
  radius: {
    pill: radius.full,
    chip: radius.full,
    card: radius.xl,
    panel: radius.xl,
  },
  typography: {
    titleDesktop: "56px",
    titleTablet: "36px",
    titleMobile: "36px",
    titleLineHeight: "60.5px",
    titleLineHeightTablet: "44px",
    titleLineHeightMobile: "44px",
    panelTitle: "24px",
    panelTitleLineHeight: "30px",
    badge: fontSizeScale.caption[0],
    eyebrow: fontSizeScale.caption[0],
    chip: fontSizeScale.small[0],
    chipLineHeight: "21px",
    cta: fontSizeScale.small[0],
    ctaLineHeight: "20px",
    eyebrowWeight: 600,
    titleWeightDesktop: 600,
    titleWeightMobile: 700,
    panelTitleWeight: 600,
  },
} as const;

export const heroTokens = hero;

export type DesignSystemHeroSpacingToken = keyof typeof hero.spacing;
export type DesignSystemHeroRadiusToken = keyof typeof hero.radius;
export type DesignSystemHeroTypographyToken = keyof typeof hero.typography;
