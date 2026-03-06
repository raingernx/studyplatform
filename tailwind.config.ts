import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50:  "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        tightest: "-0.05em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
      },
      boxShadow: {
        "card":               "0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.04)",
        "card-md":            "0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
        "card-lg":            "0 12px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04)",
        "glow-blue":          "0 0 0 1px rgba(37,99,235,0.08), 0 8px 32px rgba(37,99,235,0.14)",
        "glow-violet":        "0 0 0 1px rgba(124,58,237,0.08), 0 8px 32px rgba(124,58,237,0.14)",
        "glow-orange":        "0 0 0 1px rgba(249,115,22,0.10), 0 8px 24px rgba(249,115,22,0.20)",
        "pricing-featured":   "0 0 0 1px rgba(37,99,235,0.12), 0 24px 64px rgba(37,99,235,0.22), 0 8px 20px rgba(0,0,0,0.08)",
        "inner-sm":           "inset 0 1px 2px rgba(0,0,0,0.06)",
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
        "3xl": "1.25rem",
        "4xl": "1.5rem",
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
