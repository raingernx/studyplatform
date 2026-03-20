export const typography = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
  ui: "var(--font-ui)",
  mono: "var(--font-mono)",
  scale: {
    display: "text-display",
    h1: "text-h1",
    h2: "text-h2",
    h3: "text-h3",
    body: "text-base",
    small: "text-sm",
  },
  utility: {
    heading: "font-heading",
    body: "font-sans",
    ui: "font-ui",
    mono: "font-mono",
  },
} as const;

export type DesignSystemTypographyScaleToken = keyof typeof typography.scale;
