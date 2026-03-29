export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "16px",
  "3xl": "20px",
  "4xl": "24px",
  full: "9999px",
} as const;

export type DesignSystemRadiusToken = keyof typeof radius;
