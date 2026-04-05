"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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

type PreferenceRowProps = {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
  children: ReactNode;
};

function PreferenceRow({
  id,
  icon,
  label,
  description,
  children,
}: PreferenceRowProps) {
  return (
    <div className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:items-start md:gap-6">
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          {icon}
          {label}
        </label>
        <p className="text-small text-muted-foreground">{description}</p>
      </div>
      <div className="w-full md:justify-self-end">{children}</div>
    </div>
  );
}

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
    theme: initialTheme ?? "light",
    currency: initialCurrency ?? "THB",
    timezone: initialTimezone ?? "Asia/Bangkok",
  }));

  const [pendingPreferences, setPendingPreferences] = useState<PreferenceSettingsProps>(
    initialPreferences,
  );

  useEffect(() => {
    if (readStoredTheme() !== null) return;
    setTheme(initialPreferences.theme ?? "light", { persist: false });
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
      variant="flat"
      title="Preferences"
      description={`Customize how ${platform.platformShortName} looks and behaves for you.`}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span
            className="min-h-[16px] text-[11px]"
            aria-live="polite"
          >
            {saveFeedback ? (
              <span
                className={
                  saveFeedback.tone === "error" ? "text-danger-600" : "text-success-600"
                }
              >
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
      contentClassName="space-y-4"
    >
      <PreferenceRow
        id="preference-theme"
        icon={<Sun className="h-4 w-4 text-muted-foreground" />}
        label="Theme"
        description="Switch between light, dark, or system theme."
      >
          <Select
            id="preference-theme"
            value={pendingPreferences.theme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeValue)}
            className="w-full max-w-xs"
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
      </PreferenceRow>

      <PreferenceRow
        id="preference-currency"
        icon={<Coins className="h-4 w-4 text-muted-foreground" />}
        label="Currency"
        description="Used for displaying prices in the interface."
      >
          <Select
            id="preference-currency"
            value={pendingPreferences.currency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyValue)}
            className="w-full max-w-xs"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
      </PreferenceRow>

      <PreferenceRow
        id="preference-timezone"
        icon={<Clock4 className="h-4 w-4 text-muted-foreground" />}
        label="Timezone"
        description="Future features will use this timezone for schedules and history."
      >
          <Select
            id="preference-timezone"
            value={pendingPreferences.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value as TimezoneValue)}
            className="w-full max-w-xs"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
      </PreferenceRow>
    </FormSection>
  );
}
