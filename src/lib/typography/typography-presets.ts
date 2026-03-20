import type { FontStackKey } from "./font-stacks";

export type FontKey = FontStackKey;
export type BaseFontSize = "sm" | "md" | "lg";

export type TypographyPresetKey =
  | "modern-education"
  | "editorial-learning"
  | "friendly-classroom";

export type HeadingScale = "balanced" | "expressive" | "compact";
export type LineHeightDensity = "comfortable" | "balanced" | "tight";
export type LetterSpacingPreset = "default" | "tight" | "editorial";

export interface TypographyPreset {
  headingLatin: FontKey;
  headingThai: FontKey;
  bodyLatin: FontKey;
  bodyThai: FontKey;
  uiLatin: FontKey;
  uiThai: FontKey;
  mono: FontKey;
  baseFontSize: BaseFontSize;
  headingScale: HeadingScale;
  lineHeightDensity: LineHeightDensity;
  letterSpacingPreset: LetterSpacingPreset;
}

export const TYPOGRAPHY_PRESETS: Record<TypographyPresetKey, TypographyPreset> = {
  "modern-education": {
    headingLatin: "fraunces",
    headingThai: "notoSerifThai",
    bodyLatin: "inter",
    bodyThai: "notoSansThai",
    uiLatin: "plusJakartaSans",
    uiThai: "notoSansThai",
    mono: "geistMono",
    baseFontSize: "md",
    headingScale: "balanced",
    lineHeightDensity: "balanced",
    letterSpacingPreset: "tight",
  },
  "editorial-learning": {
    headingLatin: "fraunces",
    headingThai: "notoSerifThai",
    bodyLatin: "plusJakartaSans",
    bodyThai: "notoSansThai",
    uiLatin: "inter",
    uiThai: "notoSansThai",
    mono: "geistMono",
    baseFontSize: "md",
    headingScale: "expressive",
    lineHeightDensity: "comfortable",
    letterSpacingPreset: "editorial",
  },
  "friendly-classroom": {
    headingLatin: "plusJakartaSans",
    headingThai: "notoSansThai",
    bodyLatin: "inter",
    bodyThai: "notoSansThai",
    uiLatin: "plusJakartaSans",
    uiThai: "notoSansThai",
    mono: "geistMono",
    baseFontSize: "lg",
    headingScale: "compact",
    lineHeightDensity: "comfortable",
    letterSpacingPreset: "default",
  },
};
