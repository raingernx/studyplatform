import type { TypographyThemeSettings } from "./resolve-typography-theme";
import type {
  BaseFontSize,
  FontKey,
  HeadingScale,
  LetterSpacingPreset,
  LineHeightDensity,
  TypographyPreset,
  TypographyPresetKey,
} from "./typography-presets";

export type {
  BaseFontSize,
  FontKey,
  HeadingScale,
  LetterSpacingPreset,
  LineHeightDensity,
  TypographyPresetKey,
} from "./typography-presets";

export const TYPOGRAPHY_PRESET_VALUES = [
  "modern-education",
  "editorial-learning",
  "friendly-classroom",
] as const satisfies readonly TypographyPresetKey[];

export const FONT_KEY_VALUES = [
  "inter",
  "fraunces",
  "notoSansThai",
  "notoSerifThai",
  "plusJakartaSans",
  "geistMono",
] as const satisfies readonly FontKey[];

export const BASE_FONT_SIZE_VALUES = [
  "sm",
  "md",
  "lg",
] as const satisfies readonly BaseFontSize[];

export const HEADING_SCALE_VALUES = [
  "balanced",
  "expressive",
  "compact",
] as const satisfies readonly HeadingScale[];

export const LINE_HEIGHT_DENSITY_VALUES = [
  "comfortable",
  "balanced",
  "tight",
] as const satisfies readonly LineHeightDensity[];

export const LETTER_SPACING_PRESET_VALUES = [
  "default",
  "tight",
  "editorial",
] as const satisfies readonly LetterSpacingPreset[];

type Option<T extends string> = {
  value: T;
  label: string;
};

export interface PlatformTypographySettingsInput {
  presetKey: TypographyPresetKey;
  headingLatin?: FontKey | null;
  headingThai?: FontKey | null;
  bodyLatin?: FontKey | null;
  bodyThai?: FontKey | null;
  uiLatin?: FontKey | null;
  uiThai?: FontKey | null;
  mono?: FontKey | null;
  baseFontSize?: BaseFontSize | null;
  headingScale?: HeadingScale | null;
  lineHeightDensity?: LineHeightDensity | null;
  letterSpacingPreset?: LetterSpacingPreset | null;
  enableFontSmoothing: boolean;
}

export interface PlatformTypographySettingsRecord
  extends PlatformTypographySettingsInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS: PlatformTypographySettingsInput =
  {
    presetKey: "modern-education",
    headingLatin: null,
    headingThai: null,
    bodyLatin: null,
    bodyThai: null,
    uiLatin: null,
    uiThai: null,
    mono: null,
    baseFontSize: null,
    headingScale: null,
    lineHeightDensity: null,
    letterSpacingPreset: null,
    enableFontSmoothing: true,
  };

export const TYPOGRAPHY_PRESET_OPTIONS: ReadonlyArray<
  Option<TypographyPresetKey>
> = [
  { value: "modern-education", label: "Modern Education" },
  { value: "editorial-learning", label: "Editorial Learning" },
  { value: "friendly-classroom", label: "Friendly Classroom" },
];

export const FONT_KEY_OPTIONS: ReadonlyArray<Option<FontKey>> = [
  { value: "inter", label: "Inter" },
  { value: "fraunces", label: "Fraunces" },
  { value: "notoSansThai", label: "Noto Sans Thai" },
  { value: "notoSerifThai", label: "Noto Serif Thai" },
  { value: "plusJakartaSans", label: "Plus Jakarta Sans" },
  { value: "geistMono", label: "Geist Mono" },
];

export const BASE_FONT_SIZE_OPTIONS: ReadonlyArray<Option<BaseFontSize>> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export const HEADING_SCALE_OPTIONS: ReadonlyArray<Option<HeadingScale>> = [
  { value: "balanced", label: "Balanced" },
  { value: "expressive", label: "Expressive" },
  { value: "compact", label: "Compact" },
];

export const LINE_HEIGHT_DENSITY_OPTIONS: ReadonlyArray<
  Option<LineHeightDensity>
> = [
  { value: "comfortable", label: "Comfortable" },
  { value: "balanced", label: "Balanced" },
  { value: "tight", label: "Tight" },
];

export const LETTER_SPACING_PRESET_OPTIONS: ReadonlyArray<
  Option<LetterSpacingPreset>
> = [
  { value: "default", label: "Default" },
  { value: "tight", label: "Tight" },
  { value: "editorial", label: "Editorial" },
];

export function normalizePlatformTypographySettingsInput(
  input: PlatformTypographySettingsInput,
): PlatformTypographySettingsInput {
  return {
    presetKey: input.presetKey,
    headingLatin: input.headingLatin ?? null,
    headingThai: input.headingThai ?? null,
    bodyLatin: input.bodyLatin ?? null,
    bodyThai: input.bodyThai ?? null,
    uiLatin: input.uiLatin ?? null,
    uiThai: input.uiThai ?? null,
    mono: input.mono ?? null,
    baseFontSize: input.baseFontSize ?? null,
    headingScale: input.headingScale ?? null,
    lineHeightDensity: input.lineHeightDensity ?? null,
    letterSpacingPreset: input.letterSpacingPreset ?? null,
    enableFontSmoothing: Boolean(input.enableFontSmoothing),
  };
}

export function toPlatformTypographySettingsInput(
  settings:
    | PlatformTypographySettingsInput
    | PlatformTypographySettingsRecord,
): PlatformTypographySettingsInput {
  return normalizePlatformTypographySettingsInput({
    presetKey: settings.presetKey,
    headingLatin: settings.headingLatin,
    headingThai: settings.headingThai,
    bodyLatin: settings.bodyLatin,
    bodyThai: settings.bodyThai,
    uiLatin: settings.uiLatin,
    uiThai: settings.uiThai,
    mono: settings.mono,
    baseFontSize: settings.baseFontSize,
    headingScale: settings.headingScale,
    lineHeightDensity: settings.lineHeightDensity,
    letterSpacingPreset: settings.letterSpacingPreset,
    enableFontSmoothing: settings.enableFontSmoothing,
  });
}

function withOverride<T extends keyof TypographyPreset>(
  overrides: Partial<TypographyPreset>,
  key: T,
  value: TypographyPreset[T] | null | undefined,
) {
  if (value != null) {
    overrides[key] = value;
  }
}

export function buildTypographyThemeSettings(
  settings: PlatformTypographySettingsInput,
): TypographyThemeSettings {
  const overrides: Partial<TypographyPreset> = {};

  withOverride(overrides, "headingLatin", settings.headingLatin);
  withOverride(overrides, "headingThai", settings.headingThai);
  withOverride(overrides, "bodyLatin", settings.bodyLatin);
  withOverride(overrides, "bodyThai", settings.bodyThai);
  withOverride(overrides, "uiLatin", settings.uiLatin);
  withOverride(overrides, "uiThai", settings.uiThai);
  withOverride(overrides, "mono", settings.mono);
  withOverride(overrides, "baseFontSize", settings.baseFontSize);
  withOverride(overrides, "headingScale", settings.headingScale);
  withOverride(overrides, "lineHeightDensity", settings.lineHeightDensity);
  withOverride(
    overrides,
    "letterSpacingPreset",
    settings.letterSpacingPreset,
  );

  return {
    presetKey: settings.presetKey,
    overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
  };
}
