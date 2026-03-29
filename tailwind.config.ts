import type { Config } from "tailwindcss";

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
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#2D28BB",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#2D28BB",

          // KruCraft logo accent system
          blue: "#2563EB",
          "blue-light": "#DBEAFE",
          "blue-soft": "#EFF6FF",

          orange: "#F97316",
          "orange-light": "#FED7AA",
          "orange-soft": "#FFF7ED",

          yellow: "#FACC15",
          "yellow-light": "#FEF3C7",
          "yellow-soft": "#FFFBEB",
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
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          700: "#334155",
          900: "#0F172A",
        },
        surface: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        // Primary-action aliases kept for compatibility
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#2D28BB",
        },
        highlight: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        info: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
        },
        bg: {
          default: "#FFFFFF",
          soft: "#F8FAFC",
          dark: "#0F172A",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          onDark: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
        display: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
        ui: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "2xs":     ["0.65rem",                    { lineHeight: "1rem"  }],
        "display": ["clamp(2.75rem, 5vw, 4.5rem)", { lineHeight: "1.05" }],
        "hero":    ["clamp(2.75rem, 5vw, 4rem)",   { lineHeight: "1.08" }],
        "h1":      ["2.5rem",                      { lineHeight: "1.1"  }],
        "h2":      ["2rem",                        { lineHeight: "1.15" }],
        "h3":      ["1.5rem",                      { lineHeight: "1.25" }],
        "body-lg": ["1.125rem",                    { lineHeight: "1.7"  }],
        "body":    ["1rem",                        { lineHeight: "1.65" }],
        "small":   ["0.875rem",                    { lineHeight: "1.5"  }],
        "caption": ["0.75rem",                     { lineHeight: "1.45" }],
        "meta":    ["0.875rem",                    { lineHeight: "1.5"  }],
        "micro":   ["0.75rem",                     { lineHeight: "1.45" }],
      },
      letterSpacing: {
        tightest: "-0.05em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
      },
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
