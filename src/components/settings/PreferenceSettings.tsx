"use client";

import { useEffect, useState } from "react";
import { Sun, Coins, Clock4 } from "lucide-react";
import { Button, FormSection, Select } from "@/design-system";
import { useTheme } from "@/components/providers/ThemeProvider";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { readStoredTheme } from "@/lib/theme";

type ThemeValue = "light" | "dark" | "system";
type CurrencyValue = "THB" | "USD";
type TimezoneValue = "Asia/Bangkok" | "UTC";

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
  theme: ThemeValue;
  currency: CurrencyValue;
  timezone: TimezoneValue;
};

export function PreferenceSettings({
  theme: initialTheme,
  currency: initialCurrency,
  timezone: initialTimezone,
}: PreferenceSettingsProps) {
  const platform = usePlatformConfig();
  const { setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    tone: "saved" | "error";
    message: string;
  } | null>(null);

  const [initialPreferences, setInitialPreferences] = useState<PreferenceSettingsProps>(() => ({
    theme: initialTheme ?? "system",
    currency: initialCurrency ?? "THB",
    timezone: initialTimezone ?? "Asia/Bangkok",
  }));

  const [pendingPreferences, setPendingPreferences] = useState<PreferenceSettingsProps>(
    initialPreferences,
  );

  useEffect(() => {
    if (readStoredTheme() !== null) return;
    setTheme(initialPreferences.theme ?? "system", { persist: false });
  }, [initialPreferences.theme, setTheme]);

  const hasChanges =
    pendingPreferences.theme !== initialPreferences.theme ||
    pendingPreferences.currency !== initialPreferences.currency ||
    pendingPreferences.timezone !== initialPreferences.timezone;

  function handleThemeChange(value: ThemeValue) {
    if (saveFeedback !== null) {
      setSaveFeedback(null);
    }
    setPendingPreferences((prev) =>
      prev.theme === value ? prev : { ...prev, theme: value },
    );
  }

  function handleCurrencyChange(value: CurrencyValue) {
    if (saveFeedback !== null) {
      setSaveFeedback(null);
    }
    setPendingPreferences((prev) =>
      prev.currency === value ? prev : { ...prev, currency: value },
    );
  }

  function handleTimezoneChange(value: TimezoneValue) {
    if (saveFeedback !== null) {
      setSaveFeedback(null);
    }
    setPendingPreferences((prev) =>
      prev.timezone === value ? prev : { ...prev, timezone: value },
    );
  }

  async function handleSave() {
    if (!hasChanges) return;

    const updates: Partial<PreferenceSettingsProps> = {};
    if (pendingPreferences.theme !== initialPreferences.theme) {
      updates.theme = pendingPreferences.theme;
    }
    if (pendingPreferences.currency !== initialPreferences.currency) {
      updates.currency = pendingPreferences.currency;
    }
    if (pendingPreferences.timezone !== initialPreferences.timezone) {
      updates.timezone = pendingPreferences.timezone;
    }

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Could not save your preferences. Try again.");
      }

      if (updates.theme) {
        setTheme(updates.theme);
      }

      if (updates.currency && typeof window !== "undefined") {
        window.localStorage.setItem("user_currency", updates.currency);
      }

      if (updates.timezone && typeof window !== "undefined") {
        window.localStorage.setItem("user_timezone", updates.timezone);
      }

      setInitialPreferences(pendingPreferences);
      setSaveFeedback({
        tone: "saved",
        message: "Preferences saved.",
      });
    } catch {
      setSaveFeedback({
        tone: "error",
        message: "Could not save your preferences. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormSection
      title="Preferences"
      description={`Customize how ${platform.platformShortName} looks and behaves for you.`}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span
            className="min-h-[16px] text-[11px]"
            aria-live="polite"
          >
            {saveFeedback ? (
              <span className={saveFeedback.tone === "error" ? "text-red-600" : "text-emerald-600"}>
                {saveFeedback.message}
              </span>
            ) : null}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={!hasChanges || isSaving}
            loading={isSaving}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </div>
      }
    >
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
