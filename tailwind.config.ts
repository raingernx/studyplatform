import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],

  safelist: [
    "[data-state=checked]:bg-blue-500",
    "[data-state=checked]:translate-x-5",
  ],
  
  theme: {
    extend: {
      colors: {
        // shadcn/ui design tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#4c1d95",
          900: "#2e1065",

          // PaperDock logo accent system
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
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          700: "#374151",
          900: "#111827",
        },
        surface: {
          50: "#fafafa",
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
        // Gumroad-style brand / PaperDock brand system
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        highlight: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          50: "#fff0f0",
          100: "#fee2e2",
          200: "#ffc7c7",
          500: "#ef4444",
          600: "#dc2626",
        },
        bg: {
          default: "#f4f4f5",
          soft: "#fafafa",
          dark: "#09090b",
        },
        text: {
          primary: "#18181b",
          secondary: "#52525b",
          muted: "#a1a1aa",
          onDark: "#f9fafb",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "var(--font-thai)", "system-ui", "sans-serif"],
        display: ["var(--font-geist)", "var(--font-thai)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs":     ["0.65rem",                    { lineHeight: "1rem"  }],
        "hero":    ["clamp(2.5rem, 5vw, 3.5rem)", { lineHeight: "1.1"  }],
        "h1":      ["2.25rem",                    { lineHeight: "1.2"  }],
        "h2":      ["1.75rem",                    { lineHeight: "1.25" }],
        "h3":      ["1.25rem",                    { lineHeight: "1.35" }],
        "body-lg": ["1.125rem",                   { lineHeight: "1.7"  }],
        "body":    ["1rem",                       { lineHeight: "1.7"  }],
        "meta":    ["0.875rem",                   { lineHeight: "1.4"  }],
        "micro":   ["0.75rem",                    { lineHeight: "1.4"  }],
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
