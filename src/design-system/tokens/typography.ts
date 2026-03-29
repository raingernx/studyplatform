export const fontFamilies = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
  ui: "var(--font-ui)",
  mono: "var(--font-mono)",
} as const;

export const fontFamilyScale: Record<string, string[]> = {
  sans: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
  display: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
  ui: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)"],
};

export const fontSizeScale: Record<
  string,
  [string, { lineHeight: string }]
> = {
  "2xs": ["0.65rem", { lineHeight: "1rem" }],
  display: ["clamp(2.75rem, 5vw, 4.5rem)", { lineHeight: "1.05" }],
  hero: ["clamp(2.75rem, 5vw, 4rem)", { lineHeight: "1.08" }],
  h1: ["2.5rem", { lineHeight: "1.1" }],
  h2: ["2rem", { lineHeight: "1.15" }],
  h3: ["1.5rem", { lineHeight: "1.25" }],
  "body-lg": ["1.125rem", { lineHeight: "1.7" }],
  body: ["1rem", { lineHeight: "1.65" }],
  small: ["0.875rem", { lineHeight: "1.5" }],
  caption: ["0.75rem", { lineHeight: "1.45" }],
  meta: ["0.875rem", { lineHeight: "1.5" }],
  micro: ["0.75rem", { lineHeight: "1.45" }],
};

export const lineHeights = {
  body: "1.65",
  heading: "1.1",
  display: "1.05",
  hero: "1.08",
  h2: "1.2",
  h3: "1.3",
  small: "1.5",
  caption: "1.45",
} as const;

export const letterSpacingScale = {
  heading: "-0.02em",
  body: "0",
  label: "0.12em",
  tightest: "-0.05em",
  tighter: "-0.03em",
  tight: "-0.02em",
} as const;

export const fontWeights = {
  heading: 600,
  body: 400,
  small: 400,
  caption: 500,
} as const;

export const typography = {
  ...fontFamilies,
  fontFamily: fontFamilyScale,
  fontSize: fontSizeScale,
  lineHeight: lineHeights,
  letterSpacing: letterSpacingScale,
  fontWeight: fontWeights,
  scale: {
    display: {
      className: "text-display",
      weight: "font-semibold",
      fontSize: fontSizeScale.display[0],
      lineHeight: fontSizeScale.display[1].lineHeight,
      letterSpacing: letterSpacingScale.heading,
      fontWeight: fontWeights.heading,
    },
    hero: {
      className: "text-hero",
      weight: "font-semibold",
      fontSize: fontSizeScale.hero[0],
      lineHeight: fontSizeScale.hero[1].lineHeight,
      letterSpacing: letterSpacingScale.heading,
      fontWeight: fontWeights.heading,
    },
    h1: {
      className: "text-h1",
      weight: "font-semibold",
      fontSize: fontSizeScale.h1[0],
      lineHeight: fontSizeScale.h1[1].lineHeight,
      letterSpacing: letterSpacingScale.heading,
      fontWeight: fontWeights.heading,
    },
    h2: {
      className: "text-h2",
      weight: "font-semibold",
      fontSize: fontSizeScale.h2[0],
      lineHeight: fontSizeScale.h2[1].lineHeight,
      letterSpacing: letterSpacingScale.heading,
      fontWeight: fontWeights.heading,
    },
    h3: {
      className: "text-h3",
      weight: "font-semibold",
      fontSize: fontSizeScale.h3[0],
      lineHeight: fontSizeScale.h3[1].lineHeight,
      letterSpacing: letterSpacingScale.heading,
      fontWeight: fontWeights.heading,
    },
    bodyLg: {
      className: "text-body-lg",
      weight: "font-normal",
      fontSize: fontSizeScale["body-lg"][0],
      lineHeight: fontSizeScale["body-lg"][1].lineHeight,
      letterSpacing: letterSpacingScale.body,
      fontWeight: fontWeights.body,
    },
    body: {
      className: "text-body",
      weight: "font-normal",
      fontSize: fontSizeScale.body[0],
      lineHeight: fontSizeScale.body[1].lineHeight,
      letterSpacing: letterSpacingScale.body,
      fontWeight: fontWeights.body,
    },
    small: {
      className: "text-small",
      weight: "font-normal",
      fontSize: fontSizeScale.small[0],
      lineHeight: fontSizeScale.small[1].lineHeight,
      letterSpacing: letterSpacingScale.body,
      fontWeight: fontWeights.small,
    },
    caption: {
      className: "text-caption",
      weight: "font-medium",
      fontSize: fontSizeScale.caption[0],
      lineHeight: fontSizeScale.caption[1].lineHeight,
      letterSpacing: letterSpacingScale.body,
      fontWeight: fontWeights.caption,
    },
    meta: {
      className: "text-meta",
      weight: "font-normal",
      fontSize: fontSizeScale.meta[0],
      lineHeight: fontSizeScale.meta[1].lineHeight,
      letterSpacing: letterSpacingScale.body,
      fontWeight: fontWeights.body,
    },
    micro: {
      className: "text-micro",
      weight: "font-medium",
      fontSize: fontSizeScale.micro[0],
      lineHeight: fontSizeScale.micro[1].lineHeight,
      letterSpacing: letterSpacingScale.label,
      fontWeight: fontWeights.caption,
    },
  },
  utility: {
    heading: "font-heading",
    body: "font-sans",
    ui: "font-ui",
    mono: "font-mono",
  },
} as const;

export type DesignSystemTypographyScaleToken = keyof typeof typography.scale;
