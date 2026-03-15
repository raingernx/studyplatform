"use client";

import { useEffect, useState, useTransition } from "react";
import { Globe, Sun, Coins, Clock4 } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormSection } from "@/components/ui/form-section";

type LocaleValue = "th" | "en";
type ThemeValue = "light" | "dark" | "system";
type CurrencyValue = "THB" | "USD";
type TimezoneValue = "Asia/Bangkok" | "UTC";

const LANGUAGE_OPTIONS: { value: LocaleValue; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "English" },
];

const THEME_OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const CURRENCY_OPTIONS: { value: CurrencyValue; label: string }[] = [
  { value: "THB", label: "THB" },
  { value: "USD", label: "USD" },
];

const TIMEZONE_OPTIONS: { value: TimezoneValue; label: string }[] = [
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "UTC", label: "UTC" },
];

type PreferenceSettingsProps = {
  language: LocaleValue;
  theme: ThemeValue;
  currency: CurrencyValue;
  timezone: TimezoneValue;
};

export function PreferenceSettings({
  language: initialLanguage,
  theme: initialTheme,
  currency: initialCurrency,
  timezone: initialTimezone,
}: PreferenceSettingsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as LocaleValue;
  const [isSaving, startTransition] = useTransition();

  const [initialPreferences, setInitialPreferences] = useState<PreferenceSettingsProps>(() => ({
    language: initialLanguage ?? currentLocale,
    theme: initialTheme ?? "system",
    currency: initialCurrency ?? "THB",
    timezone: initialTimezone ?? "Asia/Bangkok",
  }));

  const [pendingPreferences, setPendingPreferences] = useState<PreferenceSettingsProps>(
    initialPreferences,
  );

  // Apply initial theme on mount
  useEffect(() => {
    if (typeof document === "undefined") return;
    const applied =
      (initialPreferences.theme ?? "system") === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : initialPreferences.theme;
    document.documentElement.dataset.theme = applied;
  }, [initialPreferences.theme]);

  const hasChanges =
    pendingPreferences.language !== initialPreferences.language ||
    pendingPreferences.theme !== initialPreferences.theme ||
    pendingPreferences.currency !== initialPreferences.currency ||
    pendingPreferences.timezone !== initialPreferences.timezone;

  function handleLanguageChange(value: LocaleValue) {
    setPendingPreferences((prev) =>
      prev.language === value ? prev : { ...prev, language: value },
    );
  }

  function handleThemeChange(value: ThemeValue) {
    setPendingPreferences((prev) =>
      prev.theme === value ? prev : { ...prev, theme: value },
    );
  }

  function handleCurrencyChange(value: CurrencyValue) {
    setPendingPreferences((prev) =>
      prev.currency === value ? prev : { ...prev, currency: value },
    );
  }

  function handleTimezoneChange(value: TimezoneValue) {
    setPendingPreferences((prev) =>
      prev.timezone === value ? prev : { ...prev, timezone: value },
    );
  }

  function handleSave() {
    if (!hasChanges) return;

    const updates: Partial<PreferenceSettingsProps> = {};
    if (pendingPreferences.language !== initialPreferences.language) {
      updates.language = pendingPreferences.language;
    }
    if (pendingPreferences.theme !== initialPreferences.theme) {
      updates.theme = pendingPreferences.theme;
    }
    if (pendingPreferences.currency !== initialPreferences.currency) {
      updates.currency = pendingPreferences.currency;
    }
    if (pendingPreferences.timezone !== initialPreferences.timezone) {
      updates.timezone = pendingPreferences.timezone;
    }

    startTransition(() => {
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch(() => {
        // Ignore network errors for now; UI will remain on pending values.
      });
    });

    // Apply side effects only after user explicitly saves.
    if (updates.language && typeof window !== "undefined") {
      const value = updates.language;
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `locale=${value}; path=/; max-age=${maxAge}`;
      document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=${maxAge}`;
      window.localStorage.setItem("user_language", value);
      router.replace(pathname, { locale: value });
    }

    if (updates.theme && typeof window !== "undefined" && typeof document !== "undefined") {
      window.localStorage.setItem("user_theme", updates.theme);
      const applied =
        updates.theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : updates.theme;
      document.documentElement.dataset.theme = applied;
    }

    if (updates.currency && typeof window !== "undefined") {
      window.localStorage.setItem("user_currency", updates.currency);
    }

    if (updates.timezone && typeof window !== "undefined") {
      window.localStorage.setItem("user_timezone", updates.timezone);
    }

    setInitialPreferences(pendingPreferences);
  }

  return (
    <FormSection
      title="Preferences"
      description="Customize how PaperDock looks and behaves for you."
      footer={
        <Button
          type="button"
          size="sm"
          disabled={!hasChanges || isSaving}
          loading={isSaving}
          onClick={handleSave}
        >
          Save changes
        </Button>
      }
    >
        {/* Language */}
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
              <Globe className="h-4 w-4 text-zinc-400" />
              Language
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Choose the language used for the interface.
            </p>
          </div>
          <Select
            value={pendingPreferences.language}
            onChange={(e) => handleLanguageChange(e.target.value as LocaleValue)}
            className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-thai"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Theme */}
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
              <Sun className="h-4 w-4 text-zinc-400" />
              Theme
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Switch between light, dark, or system theme.
            </p>
          </div>
          <Select
            value={pendingPreferences.theme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeValue)}
            className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Currency */}
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
              <Coins className="h-4 w-4 text-zinc-400" />
              Currency
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Used for displaying prices in the interface.
            </p>
          </div>
          <Select
            value={pendingPreferences.currency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyValue)}
            className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Timezone */}
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
              <Clock4 className="h-4 w-4 text-zinc-400" />
              Timezone
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Future features will use this timezone for schedules and history.
            </p>
          </div>
          <Select
            value={pendingPreferences.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value as TimezoneValue)}
            className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </FormSection>
  );
}

