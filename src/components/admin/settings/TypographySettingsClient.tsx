"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { resolveTypographyTheme } from "@/lib/typography/resolve-typography-theme";
import { typographyThemeToCssVars } from "@/lib/typography/typography-theme-to-css-vars";
import {
  DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS,
  BASE_FONT_SIZE_OPTIONS,
  FONT_KEY_OPTIONS,
  HEADING_SCALE_OPTIONS,
  LETTER_SPACING_PRESET_OPTIONS,
  LINE_HEIGHT_DENSITY_OPTIONS,
  TYPOGRAPHY_PRESET_OPTIONS,
  buildTypographyThemeSettings,
  normalizePlatformTypographySettingsInput,
  type BaseFontSize,
  type FontKey,
  type HeadingScale,
  type LetterSpacingPreset,
  type LineHeightDensity,
  type PlatformTypographySettingsInput,
  type TypographyPresetKey,
} from "@/lib/typography/typography-settings";
import { Tabs } from "@/components/ui/Tabs";
import { TYPOGRAPHY_PRESETS } from "@/lib/typography/typography-presets";
import { Button, Card, Input, PageContent, Select, Switch } from "@/design-system";

type NullableSelectValue<T extends string> = T | "";
type PreviewViewport = "desktop" | "tablet" | "mobile";
type SaveAction = "save" | "publish" | null;
type TypographyStatus = "draft" | "saved" | "published";

type TypographyFormState = {
  presetKey: TypographyPresetKey;
  headingLatin: NullableSelectValue<FontKey>;
  headingThai: NullableSelectValue<FontKey>;
  bodyLatin: NullableSelectValue<FontKey>;
  bodyThai: NullableSelectValue<FontKey>;
  uiLatin: NullableSelectValue<FontKey>;
  uiThai: NullableSelectValue<FontKey>;
  mono: NullableSelectValue<FontKey>;
  baseFontSize: NullableSelectValue<BaseFontSize>;
  headingScale: NullableSelectValue<HeadingScale>;
  lineHeightDensity: NullableSelectValue<LineHeightDensity>;
  letterSpacingPreset: NullableSelectValue<LetterSpacingPreset>;
  enableFontSmoothing: boolean;
};

type TypographySettingsApiResponse = PlatformTypographySettingsInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

interface TypographySettingsClientProps {
  initialSettings: PlatformTypographySettingsInput;
}

const PRESET_DESCRIPTIONS: Record<TypographyPresetKey, string> = {
  "modern-education":
    "Balanced serif-led hierarchy for premium educational pages.",
  "editorial-learning":
    "More expressive headlines with softer long-form reading rhythm.",
  "friendly-classroom":
    "Approachable sans-forward typography for warm, clear interfaces.",
};

const PRESET_PREVIEW_COPY: Record<
  TypographyPresetKey,
  {
    heading: string;
    body: string;
    mixed: string;
  }
> = {
  "modern-education": {
    heading: "KRUCraft Marketplace",
    body: "Structured and polished for resource discovery.",
    mixed: "แหล่งรวมสื่อการสอนคุณภาพสูง for modern classrooms.",
  },
  "editorial-learning": {
    heading: "Learning with depth",
    body: "Elegant hierarchy for premium reading experiences.",
    mixed: "คอนเทนต์ที่อ่านลื่นไหล พร้อม English editorial rhythm.",
  },
  "friendly-classroom": {
    heading: "Made for busy teachers",
    body: "Clear, approachable UI for everyday workflows.",
    mixed: "ใช้งานง่าย อ่านสบาย และ friendly across Thai + English.",
  },
};

const PREVIEW_VIEWPORT_ITEMS = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
] as const;

const PREVIEW_BASE_WIDTH_MAP: Record<PreviewViewport, number> = {
  desktop: 1440,
  tablet: 1024,
  mobile: 375,
};

const OVERRIDE_FIELD_KEYS = [
  "headingLatin",
  "headingThai",
  "bodyLatin",
  "bodyThai",
  "uiLatin",
  "uiThai",
  "mono",
  "baseFontSize",
  "headingScale",
  "lineHeightDensity",
  "letterSpacingPreset",
] as const;

function cssVarsToStyle(vars: Record<string, string>): React.CSSProperties {
  return vars;
}

function toFormState(
  settings: PlatformTypographySettingsInput,
): TypographyFormState {
  return {
    presetKey: settings.presetKey,
    headingLatin: settings.headingLatin ?? "",
    headingThai: settings.headingThai ?? "",
    bodyLatin: settings.bodyLatin ?? "",
    bodyThai: settings.bodyThai ?? "",
    uiLatin: settings.uiLatin ?? "",
    uiThai: settings.uiThai ?? "",
    mono: settings.mono ?? "",
    baseFontSize: settings.baseFontSize ?? "",
    headingScale: settings.headingScale ?? "",
    lineHeightDensity: settings.lineHeightDensity ?? "",
    letterSpacingPreset: settings.letterSpacingPreset ?? "",
    enableFontSmoothing: settings.enableFontSmoothing,
  };
}

function toSettingsInput(
  formState: TypographyFormState,
): PlatformTypographySettingsInput {
  return normalizePlatformTypographySettingsInput({
    presetKey: formState.presetKey,
    headingLatin: formState.headingLatin || null,
    headingThai: formState.headingThai || null,
    bodyLatin: formState.bodyLatin || null,
    bodyThai: formState.bodyThai || null,
    uiLatin: formState.uiLatin || null,
    uiThai: formState.uiThai || null,
    mono: formState.mono || null,
    baseFontSize: formState.baseFontSize || null,
    headingScale: formState.headingScale || null,
    lineHeightDensity: formState.lineHeightDensity || null,
    letterSpacingPreset: formState.letterSpacingPreset || null,
    enableFontSmoothing: formState.enableFontSmoothing,
  });
}

function getPresetPreviewSettings(
  presetKey: TypographyPresetKey,
): PlatformTypographySettingsInput {
  return {
    ...DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS,
    presetKey,
  };
}

function resetFormStateToPreset(formState: TypographyFormState): TypographyFormState {
  return {
    ...formState,
    headingLatin: "",
    headingThai: "",
    bodyLatin: "",
    bodyThai: "",
    uiLatin: "",
    uiThai: "",
    mono: "",
    baseFontSize: "",
    headingScale: "",
    lineHeightDensity: "",
    letterSpacingPreset: "",
  };
}

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  helper,
}: {
  id: string;
  label: string;
  value: NullableSelectValue<T>;
  onChange: (nextValue: NullableSelectValue<T>) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  helper?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as NullableSelectValue<T>)}
      >
        <option value="">Preset default</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {helper ? <p className="text-xs text-text-muted">{helper}</p> : null}
    </div>
  );
}

function getPresetLabel(presetKey: TypographyPresetKey): string {
  return (
    TYPOGRAPHY_PRESET_OPTIONS.find((option) => option.value === presetKey)?.label ??
    presetKey
  );
}

function PresetCard({
  presetKey,
  selected,
  onSelect,
}: {
  presetKey: TypographyPresetKey;
  selected: boolean;
  onSelect: (presetKey: TypographyPresetKey) => void;
}) {
  const settings = useMemo(
    () => getPresetPreviewSettings(presetKey),
    [presetKey],
  );
  const themeSettings = useMemo(
    () => buildTypographyThemeSettings(settings),
    [settings],
  );
  const theme = useMemo(
    () => resolveTypographyTheme(themeSettings),
    [themeSettings],
  );
  const style = useMemo(
    () => cssVarsToStyle(typographyThemeToCssVars(theme)),
    [theme],
  );
  const copy = PRESET_PREVIEW_COPY[presetKey];

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Select ${presetKey.replace(/-/g, " ")} preset`}
      onClick={() => onSelect(presetKey)}
      style={style}
      className={cn(
        "h-full w-full rounded-2xl border p-4 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2",
        selected
          ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/25 shadow-md shadow-brand-500/10"
          : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50/70 hover:shadow-md",
      )}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-ui text-sm font-semibold text-text-primary">
              {getPresetLabel(presetKey)}
            </p>
            {selected ? (
              <Badge variant="info" className="shrink-0">
                Selected
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-text-secondary">
            {PRESET_DESCRIPTIONS[presetKey]}
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-black/5 bg-gradient-to-br from-white to-zinc-50 p-3">
          <p className="font-heading text-h3 font-semibold text-text-primary">
            {copy.heading}
          </p>
          <p className="text-sm text-text-secondary">{copy.body}</p>
          <p lang="th" className="text-sm text-text-secondary">
            {copy.mixed}
          </p>
        </div>
      </div>
    </button>
  );
}

function PreviewPanel({
  settings,
  viewport,
  onViewportChange,
}: {
  settings: PlatformTypographySettingsInput;
  viewport: PreviewViewport;
  onViewportChange: (value: PreviewViewport) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const themeSettings = useMemo(
    () => buildTypographyThemeSettings(settings),
    [settings],
  );
  const theme = useMemo(
    () => resolveTypographyTheme(themeSettings),
    [themeSettings],
  );
  const cssVars = useMemo(() => typographyThemeToCssVars(theme), [theme]);
  const previewStyle = useMemo(() => cssVarsToStyle(cssVars), [cssVars]);
  const baseWidth = PREVIEW_BASE_WIDTH_MAP[viewport];

  useLayoutEffect(() => {
    setIsPreviewAnimating(true);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsPreviewAnimating(false);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [settings.presetKey, viewport]);

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return;
    }

    setContentHeight(contentRef.current.scrollHeight);
  }, [viewport, settings]);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) {
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      if (!containerWidth) {
        return;
      }

      const nextScale = Math.min(containerWidth / baseWidth, 1);
      setScale(nextScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [baseWidth, viewport]);

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-slate-200/70 transition-all duration-300">
      <div className="border-b border-zinc-200 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Live Preview
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Local-only typography preview using your current unsaved selections.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Viewport
            </p>
            <Tabs
              items={PREVIEW_VIEWPORT_ITEMS.map((item) => ({
                id: item.id,
                label: item.label,
              }))}
              value={viewport}
              onChange={(value) => onViewportChange(value as PreviewViewport)}
              className="w-fit"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden p-6 lg:p-8">
        <div
          className={cn(
            "w-full overflow-hidden",
            viewport !== "desktop" && "flex justify-center",
          )}
        >
          <div
            ref={containerRef}
            className={cn(
              "w-full overflow-hidden rounded-2xl border bg-background",
              viewport === "mobile" && "max-w-[375px]",
              viewport === "tablet" && "max-w-[1024px]",
            )}
            style={{
              height: contentHeight ? `${contentHeight * scale}px` : undefined,
            }}
          >
            <div
              style={{
                width: `${baseWidth}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              className="min-w-0"
            >
              <div
                ref={contentRef}
                style={previewStyle}
                className={cn(
                  "min-w-0 space-y-6 rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-950/20 transition-all duration-300 ease-out lg:p-8",
                  isPreviewAnimating
                    ? "translate-y-2 scale-[0.992] opacity-90"
                    : "translate-y-0 scale-100 opacity-100",
                  settings.enableFontSmoothing && "antialiased",
                )}
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-ui text-white/80">
                      {settings.presetKey.replace(/-/g, " ")}
                    </span>
                    <span className="rounded-full border border-white/15 px-3 py-1 font-ui text-white/65">
                      {theme.headingScale} scale
                    </span>
                    <span className="rounded-full border border-white/15 px-3 py-1 font-ui text-white/65">
                      {settings.enableFontSmoothing ? "Font smoothing on" : "Font smoothing off"}
                    </span>
                  </div>

                  <div className="space-y-2 min-w-0 max-w-full">
                    <p className="font-ui text-xs uppercase tracking-[0.18em] text-white/65">
                      Hero preview
                    </p>
                    <h1 className="max-w-full break-words text-balance text-display font-heading font-semibold leading-[1.1] text-white">
                      Designed for learners who notice the details.
                    </h1>
                    <p className="max-w-2xl break-words text-base text-white/78">
                      Build a clearer reading experience across landing pages,
                      dashboards, and study materials without changing any content
                      structure.
                    </p>
                    <p
                      lang="th"
                      className="max-w-2xl break-words text-base text-white/72"
                    >
                      ปรับบุคลิกของแบรนด์ด้วยระบบตัวอักษรที่อ่านง่ายทั้งภาษาไทยและภาษาอังกฤษ
                      โดยยังคงโครงสร้างหน้าและประสบการณ์ใช้งานเดิมไว้ครบถ้วน
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid min-w-0",
                    viewport === "mobile"
                      ? "grid-cols-1 gap-3"
                      : "grid-cols-3 gap-4",
                  )}
                >
                  <div className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                      Heading One
                    </p>
                    <h2 className="mt-3 max-w-full break-words text-balance text-h1 font-heading font-semibold leading-[1.1] text-white">
                      Premium hierarchy
                    </h2>
                  </div>
                  <div className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                      Heading Two
                    </p>
                    <h3 className="mt-3 max-w-full break-words text-balance text-h2 font-heading font-semibold leading-tight text-white">
                      Reading rhythm
                    </h3>
                  </div>
                  <div className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                      Heading Three
                    </p>
                    <h4 className="mt-3 max-w-full break-words text-balance text-h3 font-heading font-semibold leading-tight text-white">
                      Fine detail
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 max-w-full min-w-0">
                  <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                    UI controls
                  </p>
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <Button size="sm" variant="primary">
                      Primary action
                    </Button>
                    <Button size="sm" variant="secondary">
                      Secondary action
                    </Button>
                    <span className="rounded-full border border-white/15 px-3 py-1.5 font-ui text-sm text-white/70">
                      Navigation chip
                    </span>
                  </div>
                  <div className="max-w-md min-w-0">
                    <Input
                      value="Study session notes"
                      readOnly
                      className="border-white/15 bg-white/95 text-zinc-900"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 max-w-full min-w-0">
                  <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                    Resource card sample
                  </p>
                  <div className="max-w-full min-w-0 rounded-2xl border border-white/10 bg-white text-zinc-900 shadow-sm">
                    <div className="h-32 rounded-t-2xl bg-gradient-to-br from-brand-100 via-white to-violet-100" />
                    <div className="space-y-4 p-5 min-w-0">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="info">Featured</Badge>
                          <Badge variant="neutral">Worksheet</Badge>
                        </div>
                        <h3 className="max-w-full break-words text-h3 font-heading font-semibold leading-tight text-zinc-900">
                          High-impact teaching bundle
                        </h3>
                        <p className="break-words text-sm text-zinc-600">
                          Curated lesson resources with typography that stays clear
                          across long titles and mixed-language content.
                        </p>
                        <p lang="th" className="break-words text-sm text-zinc-500">
                          รองรับทั้งภาษาไทยและภาษาอังกฤษในการ์ดเดียวกันอย่างอ่านง่าย
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-ui text-sm font-medium text-zinc-900">
                          THB 490
                        </span>
                        <Button size="sm" variant="primary">
                          View resource
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-full min-w-0 rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/55">
                    Monospace sample
                  </p>
                  <pre className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                    <code className="font-mono break-words">
                      {`const lessonPlan = {
  module: "Typography systems",
  status: "ready",
  locale: ["en", "th"],
};`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TypographySettingsClient({
  initialSettings,
}: TypographySettingsClientProps) {
  const initialInput = useMemo(
    () => normalizePlatformTypographySettingsInput(initialSettings),
    [initialSettings],
  );
  const [persistedSettings, setPersistedSettings] =
    useState<PlatformTypographySettingsInput>(initialInput);
  const [formState, setFormState] = useState<TypographyFormState>(
    toFormState(initialInput),
  );
  const [saveAction, setSaveAction] = useState<SaveAction>(null);
  const [lastSavedStatus, setLastSavedStatus] =
    useState<Exclude<TypographyStatus, "draft">>("saved");
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("desktop");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<
    string | null
  >(null);
  const router = useRouter();
  const { toast } = useToast();

  const previewSettings = useMemo(
    () => toSettingsInput(formState),
    [formState],
  );
  const activePreset = useMemo(
    () => TYPOGRAPHY_PRESETS[formState.presetKey],
    [formState.presetKey],
  );
  const activePresetLabel = useMemo(
    () => getPresetLabel(formState.presetKey),
    [formState.presetKey],
  );
  const hasChanges = useMemo(() => {
    return JSON.stringify(previewSettings) !== JSON.stringify(persistedSettings);
  }, [persistedSettings, previewSettings]);
  const isModified = useMemo(() => {
    return OVERRIDE_FIELD_KEYS.some((key) => {
      const value = formState[key];
      if (value === "") {
        return false;
      }

      return value !== activePreset[key];
    });
  }, [activePreset, formState]);
  const status = hasChanges ? "draft" : lastSavedStatus;
  const isSaving = saveAction !== null;

  useEffect(() => {
    if (!hasChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  async function persistSettings(action: Exclude<SaveAction, null>) {
    setSaveAction(action);

    try {
      const response = await fetch("/api/admin/settings/typography", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewSettings),
      });

      const payload = (await response.json()) as
        | TypographySettingsApiResponse
        | { error?: string };
      const errorMessage = "error" in payload ? payload.error : undefined;

      if (!response.ok || !("presetKey" in payload)) {
        throw new Error(errorMessage ?? "Unable to save typography settings.");
      }

      const nextSettings = normalizePlatformTypographySettingsInput(payload);
      setPersistedSettings(nextSettings);
      setFormState(toFormState(nextSettings));
      setLastSavedStatus(action === "publish" ? "published" : "saved");
      toast.success(
        action === "publish"
          ? "Typography settings published"
          : "Typography settings saved",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save typography settings.",
      );
    } finally {
      setSaveAction(null);
    }
  }

  function handleReset() {
    setFormState(toFormState(persistedSettings));
  }

  function handleResetToPreset() {
    setFormState((prev) => resetFormStateToPreset(prev));
  }

  function handleNavigateToSettings() {
    if (!hasChanges) {
      router.push(routes.adminSettings);
      return;
    }

    setPendingNavigationHref(routes.adminSettings);
    setShowLeaveConfirm(true);
  }

  function handleConfirmNavigation() {
    if (pendingNavigationHref) {
      router.push(pendingNavigationHref);
    }
    setPendingNavigationHref(null);
  }

  return (
    <PageContent className="max-w-[1280px] space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <SectionHeader
            title="Typography"
            description="Control the global type preset, reading scale, and script-specific overrides without affecting layout structure."
          />
          <p className="text-sm text-text-secondary">
            Preset:{" "}
            <span className="font-medium text-text-primary">{activePresetLabel}</span>
            {isModified ? " (modified)" : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                status === "published"
                  ? "success"
                  : status === "saved"
                    ? "info"
                    : "warning"
              }
            >
              {status === "published"
                ? "Published"
                : status === "saved"
                  ? "Saved"
                  : "Draft"}
            </Badge>
            {hasChanges ? (
              <Badge variant="warning">Unsaved changes</Badge>
            ) : null}
            {isModified ? <Badge variant="warning">Modified</Badge> : null}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleNavigateToSettings}
        >
          Back to settings
        </Button>
      </div>

      <div className="space-y-8">
        <div className="w-full">
          <PreviewPanel
            settings={previewSettings}
            viewport={previewViewport}
            onViewportChange={setPreviewViewport}
          />
        </div>

        <div className="space-y-6 pb-24">
          <Card className="space-y-6 p-6 lg:p-7">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Preset
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Start from a curated typographic direction, then add selective
                overrides only where needed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TYPOGRAPHY_PRESET_OPTIONS.map((option) => (
                <PresetCard
                  key={option.value}
                  presetKey={option.value}
                  selected={formState.presetKey === option.value}
                  onSelect={(presetKey) =>
                    setFormState((prev) => ({
                      ...prev,
                      presetKey,
                    }))
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Font smoothing
                </p>
                <p className="text-xs text-text-muted">
                  Toggle antialiasing for the global app typography render.
                </p>
              </div>
              <Switch
                checked={formState.enableFontSmoothing}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    enableFontSmoothing: checked,
                  }))
                }
              />
            </div>
          </Card>

          <Card className="space-y-6 p-6 lg:p-7">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Scale & rhythm
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                These controls stay token-based so the system remains responsive
                and consistent across pages.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="baseFontSize"
                label="Base font size"
                value={formState.baseFontSize}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, baseFontSize: nextValue }))
                }
                options={BASE_FONT_SIZE_OPTIONS}
              />
              <SelectField
                id="headingScale"
                label="Heading scale"
                value={formState.headingScale}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, headingScale: nextValue }))
                }
                options={HEADING_SCALE_OPTIONS}
              />
              <SelectField
                id="lineHeightDensity"
                label="Line-height density"
                value={formState.lineHeightDensity}
                onChange={(nextValue) =>
                  setFormState((prev) => ({
                    ...prev,
                    lineHeightDensity: nextValue,
                  }))
                }
                options={LINE_HEIGHT_DENSITY_OPTIONS}
              />
              <SelectField
                id="letterSpacingPreset"
                label="Letter spacing"
                value={formState.letterSpacingPreset}
                onChange={(nextValue) =>
                  setFormState((prev) => ({
                    ...prev,
                    letterSpacingPreset: nextValue,
                  }))
                }
                options={LETTER_SPACING_PRESET_OPTIONS}
              />
            </div>
          </Card>

          <Card className="space-y-6 p-6 lg:p-7">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Script-aware font overrides
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Leave overrides on preset default unless you need a specific
                Latin or Thai stack for one role.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="headingLatin"
                label="Heading Latin"
                value={formState.headingLatin}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, headingLatin: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for Latin headings and display text."
              />
              <SelectField
                id="headingThai"
                label="Heading Thai"
                value={formState.headingThai}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, headingThai: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for Thai headings and display text."
              />
              <SelectField
                id="bodyLatin"
                label="Body Latin"
                value={formState.bodyLatin}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, bodyLatin: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for paragraphs and supporting copy."
              />
              <SelectField
                id="bodyThai"
                label="Body Thai"
                value={formState.bodyThai}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, bodyThai: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for Thai paragraph text."
              />
              <SelectField
                id="uiLatin"
                label="UI Latin"
                value={formState.uiLatin}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, uiLatin: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for controls, buttons, and navigation."
              />
              <SelectField
                id="uiThai"
                label="UI Thai"
                value={formState.uiThai}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, uiThai: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Thai fallback for UI labels and controls."
              />
              <SelectField
                id="mono"
                label="Monospace"
                value={formState.mono}
                onChange={(nextValue) =>
                  setFormState((prev) => ({ ...prev, mono: nextValue }))
                }
                options={FONT_KEY_OPTIONS}
                helper="Used for code snippets and structured values."
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Effective preset
                </label>
                <Input
                  readOnly
                  value={TYPOGRAPHY_PRESET_OPTIONS.find(
                    (option) => option.value === formState.presetKey,
                  )?.label ?? formState.presetKey}
                  className="bg-zinc-50"
                />
                <p className="text-xs text-text-muted">
                  Overrides apply on top of the selected preset only where a
                  value is chosen.
                </p>
              </div>
            </div>
          </Card>

          <div className="sticky bottom-0 z-10 -mx-2 border-t border-zinc-200 bg-background/95 px-2 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  Reset changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToPreset}
                  disabled={isSaving}
                >
                  Reset to preset
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void persistSettings("save")}
                  loading={saveAction === "save"}
                  disabled={!hasChanges || isSaving}
                >
                  Save typography settings
                </Button>
                <Button
                  type="button"
                  onClick={() => void persistSettings("publish")}
                  loading={saveAction === "publish"}
                  disabled={!hasChanges || isSaving}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={(open) => {
          setShowLeaveConfirm(open);
          if (!open) {
            setPendingNavigationHref(null);
          }
        }}
        variant="warning"
        destructive={false}
        title="Leave without saving?"
        description="You have unsaved typography changes. Leaving now will discard them."
        confirmLabel="Leave page"
        cancelLabel="Stay here"
        onConfirm={handleConfirmNavigation}
      />
    </PageContent>
  );
}
