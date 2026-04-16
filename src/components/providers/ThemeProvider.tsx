"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import type { Theme } from "@/lib/theme";
import { applyTheme, persistTheme, readStoredTheme, watchSystemTheme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme, options?: { persist?: boolean }) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
  initialTheme?: Theme;
};

export function ThemeProvider({ children, initialTheme = "system" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? initialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    return watchSystemTheme(() => {
      applyTheme("system");
    });
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme, options?: { persist?: boolean }) => {
    setThemeState(nextTheme);
    if (options?.persist !== false) {
      persistTheme(nextTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
