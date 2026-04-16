"use client";

import { useEffect, useState } from "react";
import { Sun } from "lucide-react";
import { Button, FormSection, Select } from "@/design-system";
import { useTheme } from "@/components/providers/ThemeProvider";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { persistTheme, readStoredTheme } from "@/lib/theme";

type ThemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

type PreferenceSettingsProps = {
  theme: ThemeValue;
};

export function PreferenceSettings({ theme: initialTheme }: PreferenceSettingsProps) {
  const platform = usePlatformConfig();
  const { theme: runtimeTheme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    tone: "saved" | "error";
    message: string;
  } | null>(null);
  const [initialThemePreference, setInitialThemePreference] = useState<ThemeValue>(
    () => initialTheme ?? "system",
  );
  const [pendingTheme, setPendingTheme] = useState<ThemeValue>(initialThemePreference);

  const hasChanges = pendingTheme !== initialThemePreference;

  useEffect(() => {
    if (readStoredTheme() !== null) return;

    // Keep the first rendered runtime theme as the local source of truth until
    // the user explicitly changes it from settings.
    persistTheme(runtimeTheme);
  }, [runtimeTheme]);

  function handleThemeChange(value: ThemeValue) {
    if (saveFeedback !== null) {
      setSaveFeedback(null);
    }
    setPendingTheme((prev) => (prev === value ? prev : value));
  }

  async function handleSave() {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: pendingTheme }),
      });

      if (!response.ok) {
        throw new Error("Could not save your appearance. Try again.");
      }

      setTheme(pendingTheme);
      setInitialThemePreference(pendingTheme);
      setSaveFeedback({
        tone: "saved",
        message: "Appearance saved.",
      });
    } catch {
      setSaveFeedback({
        tone: "error",
        message: "Could not save your appearance. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormSection
      variant="flat"
      title="Appearance"
      description={`Choose how ${platform.platformShortName} should look on your device.`}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="min-h-[16px] text-[11px]" aria-live="polite">
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
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px] md:items-start md:gap-6">
        <div className="space-y-1">
          <label
            htmlFor="preference-theme"
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Sun className="h-4 w-4 text-muted-foreground" />
            Theme
          </label>
          <p className="text-small text-muted-foreground">
            Light, dark, or follow your system setting.
          </p>
        </div>
        <div className="w-full md:justify-self-end">
          <Select
            id="preference-theme"
            value={pendingTheme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeValue)}
            className="w-full max-w-xs"
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </FormSection>
  );
}
