import type { Config } from "tailwindcss";
import {
  colorScales,
  fontFamilyScale,
  fontSizeScale,
  letterSpacingScale,
  radius,
  semanticColors,
} from "./src/design-system/tokens";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/design-system/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],

  safelist: [
    "[data-state=checked]:bg-primary-500",
    "[data-state=checked]:translate-x-5",
  ],
  
  theme: {
    extend: {
      // Consume the canonical DS token contract from src/design-system/tokens.
      colors: {
        // shadcn/ui design tokens
        border: {
          DEFAULT: "hsl(var(--border))",
          subtle: "hsl(var(--border))",
        },
        input: {
          DEFAULT: "hsl(var(--input))",
        },
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          ...colorScales.primary,
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          50: colorScales.surface[50],
          100: colorScales.surface[100],
          200: colorScales.surface[200],
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          ...colorScales.accent,
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Existing design tokens (kept for compatibility)
        neutral: colorScales.neutral,
        surface: colorScales.surface,
        // Primary-action aliases kept for compatibility
        brand: colorScales.brand,
        highlight: colorScales.highlight,
        success: colorScales.success,
        warning: colorScales.warning,
        info: colorScales.info,
        danger: colorScales.danger,
        bg: {
          default: semanticColors.background,
          soft: semanticColors.surface,
          dark: colorScales.surface[900],
        },
        text: {
          primary: semanticColors.textPrimary,
          secondary: semanticColors.textSecondary,
          muted: semanticColors.textMuted,
          onDark: colorScales.surface[50],
        },
      },
      fontFamily: fontFamilyScale,
      fontSize: fontSizeScale,
      letterSpacing: letterSpacingScale,
      boxShadow: {
        "card":               "0 1px 2px rgba(15,23,42,0.04)",
        "card-md":            "0 8px 20px -12px rgba(15,23,42,0.12)",
        "card-lg":            "0 18px 40px -24px rgba(15,23,42,0.18)",
        "glow-blue":          "0 0 0 1px rgba(37,99,235,0.08), 0 10px 24px -18px rgba(37,99,235,0.22)",
        "glow-violet":        "0 0 0 1px rgba(79,70,229,0.08), 0 10px 24px -18px rgba(79,70,229,0.22)",
        "glow-orange":        "0 0 0 1px rgba(245,158,11,0.10), 0 10px 24px -18px rgba(245,158,11,0.24)",
        "pricing-featured":   "0 0 0 1px rgba(79,70,229,0.10), 0 18px 40px -24px rgba(79,70,229,0.22)",
        "inner-sm":           "inset 0 1px 2px rgba(15,23,42,0.05)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        shimmer:   "shimmer 2.2s linear infinite",
      },
      borderRadius: {
        "3xl": radius["3xl"],
        "4xl": radius["4xl"],
      },
      backgroundImage: {
        "dot-grid-dark": "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
        "dot-grid":      "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot": "22px 22px",
      },
    },
  },
  plugins: [],
};

export default config;
