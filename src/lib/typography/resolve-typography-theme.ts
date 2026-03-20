import { FONT_STACKS, type FontStackKey } from "./font-stacks";
import {
  TYPOGRAPHY_PRESETS,
  type TypographyPreset,
  type TypographyPresetKey,
} from "./typography-presets";

export interface TypographyThemeSettings {
  presetKey: TypographyPresetKey | string;
  overrides?: Partial<TypographyPreset>;
}

export interface ResolvedTypographyTheme extends TypographyPreset {
  fontHeading: string;
  fontBody: string;
  fontUi: string;
  fontMono: string;
}

const DEFAULT_PRESET_KEY: TypographyPresetKey = "modern-education";
const DEFAULT_PRESET = TYPOGRAPHY_PRESETS[DEFAULT_PRESET_KEY];

function resolveFontStack(fontKey: string, fallbackKey: FontStackKey) {
  if (fontKey in FONT_STACKS) {
    return FONT_STACKS[fontKey as FontStackKey];
  }

  return FONT_STACKS[fallbackKey];
}

export function resolveTypographyTheme(
  settings: TypographyThemeSettings,
): ResolvedTypographyTheme {
  if (
    process.env.NODE_ENV === "development" &&
    !TYPOGRAPHY_PRESETS[settings.presetKey as TypographyPresetKey]
  ) {
    console.warn("[Typography] Invalid presetKey:", settings.presetKey);
  }

  const preset =
    TYPOGRAPHY_PRESETS[settings.presetKey as TypographyPresetKey] ?? DEFAULT_PRESET;

  const merged: TypographyPreset = {
    ...DEFAULT_PRESET,
    ...preset,
    ...settings.overrides,
  };

  return Object.freeze({
    ...merged,
    fontHeading: [
      resolveFontStack(merged.headingLatin, DEFAULT_PRESET.headingLatin),
      resolveFontStack(merged.headingThai, DEFAULT_PRESET.headingThai),
    ].join(", "),
    fontBody: [
      resolveFontStack(merged.bodyLatin, DEFAULT_PRESET.bodyLatin),
      resolveFontStack(merged.bodyThai, DEFAULT_PRESET.bodyThai),
    ].join(", "),
    fontUi: [
      resolveFontStack(merged.uiLatin, DEFAULT_PRESET.uiLatin),
      resolveFontStack(merged.uiThai, DEFAULT_PRESET.uiThai),
    ].join(", "),
    fontMono: resolveFontStack(merged.mono, DEFAULT_PRESET.mono),
  });
}
