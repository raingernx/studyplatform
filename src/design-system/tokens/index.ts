import {
  chartColors,
  colorAliases,
  colorScales,
  colors,
  semanticColors,
  themeColors,
} from "./colors";
import { radius } from "./radius";
import { spacing } from "./spacing";
import {
  fontFamilies,
  fontFamilyScale,
  fontSizeScale,
  fontWeights,
  letterSpacingScale,
  lineHeights,
  typography,
} from "./typography";

export {
  chartColors,
  colorAliases,
  colorScales,
  colors,
  fontFamilies,
  fontFamilyScale,
  fontSizeScale,
  fontWeights,
  letterSpacingScale,
  lineHeights,
  radius,
  semanticColors,
  spacing,
  themeColors,
  typography,
};

export const designSystemTokens = {
  colors,
  spacing,
  radius,
  typography,
} as const;

export type {
  DesignSystemColorAliasToken,
  DesignSystemColorScaleToken,
  DesignSystemColorToken,
  DesignSystemSemanticColorToken,
  DesignSystemThemeColorToken,
} from "./colors";
export type { DesignSystemRadiusToken } from "./radius";
export type { DesignSystemSpacingToken } from "./spacing";
export type { DesignSystemTypographyScaleToken } from "./typography";
