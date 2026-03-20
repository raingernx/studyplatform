import type { ResolvedTypographyTheme } from "./resolve-typography-theme";

type CssVarMap = Record<string, string>;

const DEFAULT_HEADING_SCALE: ResolvedTypographyTheme["headingScale"] = "balanced";
const DEFAULT_BASE_FONT_SIZE: ResolvedTypographyTheme["baseFontSize"] = "md";
const DEFAULT_LINE_HEIGHT_DENSITY: ResolvedTypographyTheme["lineHeightDensity"] = "balanced";
const DEFAULT_LETTER_SPACING_PRESET: ResolvedTypographyTheme["letterSpacingPreset"] = "tight";

const headingScaleMap: Record<
  ResolvedTypographyTheme["headingScale"],
  {
    display: string;
    h1: string;
    h2: string;
    h3: string;
  }
> = {
  balanced: {
    display: "clamp(2.5rem, 5vw, 3.5rem)",
    h1: "2.25rem",
    h2: "1.75rem",
    h3: "1.25rem",
  },
  expressive: {
    display: "clamp(2.75rem, 5.5vw, 3.85rem)",
    h1: "2.5rem",
    h2: "1.9rem",
    h3: "1.35rem",
  },
  compact: {
    display: "clamp(2.3rem, 4.6vw, 3.2rem)",
    h1: "2.1rem",
    h2: "1.65rem",
    h3: "1.2rem",
  },
};

const baseFontSizeMap: Record<ResolvedTypographyTheme["baseFontSize"], string> = {
  sm: "15px",
  md: "16px",
  lg: "17px",
};

const lineHeightMap: Record<
  ResolvedTypographyTheme["lineHeightDensity"],
  {
    body: string;
    heading: string;
  }
> = {
  comfortable: {
    body: "1.75",
    heading: "1.2",
  },
  balanced: {
    body: "1.7",
    heading: "1.15",
  },
  tight: {
    body: "1.6",
    heading: "1.08",
  },
};

const letterSpacingMap: Record<
  ResolvedTypographyTheme["letterSpacingPreset"],
  {
    heading: string;
    body: string;
  }
> = {
  default: {
    heading: "0",
    body: "0",
  },
  tight: {
    heading: "-0.02em",
    body: "0",
  },
  editorial: {
    heading: "-0.03em",
    body: "0.002em",
  },
};

export function typographyThemeToCssVars(
  theme: ResolvedTypographyTheme,
): CssVarMap {
  const headingScale =
    headingScaleMap[theme.headingScale] ?? headingScaleMap[DEFAULT_HEADING_SCALE];
  const lineHeight =
    lineHeightMap[theme.lineHeightDensity] ??
    lineHeightMap[DEFAULT_LINE_HEIGHT_DENSITY];
  const letterSpacing =
    letterSpacingMap[theme.letterSpacingPreset] ??
    letterSpacingMap[DEFAULT_LETTER_SPACING_PRESET];
  const baseFontSize =
    baseFontSizeMap[theme.baseFontSize] ?? baseFontSizeMap[DEFAULT_BASE_FONT_SIZE];

  return Object.freeze({
    "--font-heading": theme.fontHeading || "",
    "--font-body": theme.fontBody || "",
    "--font-ui": theme.fontUi || "",
    "--font-mono": theme.fontMono || "",
    "--font-size-base": baseFontSize,
    "--font-size-display": headingScale.display,
    "--font-size-h1": headingScale.h1,
    "--font-size-h2": headingScale.h2,
    "--font-size-h3": headingScale.h3,
    "--line-height-body": lineHeight.body,
    "--line-height-heading": lineHeight.heading,
    "--letter-spacing-heading": letterSpacing.heading,
    "--letter-spacing-body": letterSpacing.body,
  });
}
