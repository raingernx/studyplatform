export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<Theme, "system">;

export const THEME_STORAGE_KEY = "user_theme";
const SYSTEM_DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : null;
}

export function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? resolveSystemTheme() : theme;
}

export function applyTheme(theme: Theme) {
  const resolvedTheme = resolveTheme(theme);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolvedTheme;
  }
  return resolvedTheme;
}

export function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  const prefersDark = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches;
  return prefersDark ? "dark" : "light";
}

export function watchSystemTheme(onChange: (theme: ResolvedTheme) => void) {
  if (typeof window === "undefined") return () => undefined;

  const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY);
  const handleChange = () => onChange(mediaQuery.matches ? "dark" : "light");

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }

  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}
