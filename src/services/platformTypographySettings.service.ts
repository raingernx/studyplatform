import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_TAGS, CACHE_TTLS } from "@/lib/cache";
import {
  DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS,
  buildTypographyThemeSettings,
  normalizePlatformTypographySettingsInput,
  type PlatformTypographySettingsInput,
} from "@/lib/typography/typography-settings";
import {
  getPlatformTypographySettings as getStoredTypographySettings,
  updatePlatformTypographySettings as saveTypographySettings,
} from "@/repositories/platformTypographySettings.repository";

const readPlatformTypographySettings = unstable_cache(
  async () => getStoredTypographySettings(),
  [CACHE_KEYS.platformTypographySettings],
  {
    revalidate: CACHE_TTLS.platform,
    tags: [CACHE_TAGS.platform],
  },
);

async function getTypographySettingsConfig() {
  return readPlatformTypographySettings();
}

export const getTypographySettings = cache(getTypographySettingsConfig);

export async function getTypographySettingsOrDefault() {
  try {
    return await getTypographySettings();
  } catch (error) {
    console.error("[TYPOGRAPHY_SETTINGS_FALLBACK]", error);
    return normalizePlatformTypographySettingsInput(
      DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS,
    );
  }
}

export async function updateTypographySettings(
  input: PlatformTypographySettingsInput,
) {
  return saveTypographySettings(normalizePlatformTypographySettingsInput(input));
}

export { buildTypographyThemeSettings };
