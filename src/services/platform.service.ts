import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getPlatformSettings as getStoredPlatformSettings,
  updatePlatformSettings as savePlatformSettings,
} from "@/repositories/platformSettings.repository";
import { CACHE_KEYS, CACHE_TAGS, CACHE_TTLS } from "@/lib/cache";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import type {
  PlatformConfig,
  PlatformEmailDefaults,
  PlatformSettingsInput,
} from "@/lib/platform/platform.types";

const readPlatformSettings = unstable_cache(
  async () => getStoredPlatformSettings(),
  [CACHE_KEYS.platformSettings],
  {
    revalidate: CACHE_TTLS.platform,
    tags: [CACHE_TAGS.platform],
  },
);

function looksLikeFaviconAsset(value: string | null | undefined) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const candidate = normalized.startsWith("http")
      ? new URL(normalized).pathname.toLowerCase()
      : normalized;
    return /\.(png|svg|ico|webp)(\?.*)?$/.test(candidate);
  } catch {
    return /\.(png|svg|ico|webp)(\?.*)?$/.test(normalized);
  }
}

export function resolvePlatformConfig(
  settings: Awaited<ReturnType<typeof getStoredPlatformSettings>>,
): PlatformConfig {
  const platformName = settings?.name?.trim() || PLATFORM_DEFAULTS.platformName;
  const platformDescription =
    settings?.description?.trim() || PLATFORM_DEFAULTS.platformDescription;
  const platformShortName =
    settings?.shortName?.trim() ||
    platformName ||
    PLATFORM_DEFAULTS.platformShortName;
  const siteUrl =
    settings?.siteUrl?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    PLATFORM_DEFAULTS.siteUrl;
  const legacyLogoUrl = settings?.logoUrl?.trim() || "";
  const logoFullUrl =
    settings?.logoFullUrl?.trim() ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoFullUrl;
  const logoIconUrl =
    settings?.logoIconUrl?.trim() ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoIconUrl;
  const logoOgUrl =
    settings?.logoOgUrl?.trim() ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoOgUrl;
  const logoEmailUrl =
    settings?.logoEmailUrl?.trim() ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoEmailUrl;
  const faviconUrl =
    settings?.faviconUrl?.trim() ||
    (looksLikeFaviconAsset(logoIconUrl) ? logoIconUrl : "") ||
    (looksLikeFaviconAsset(legacyLogoUrl) ? legacyLogoUrl : "") ||
    PLATFORM_DEFAULTS.faviconUrl;

  return {
    platformName,
    platformShortName,
    platformDescription,
    logoFullUrl,
    logoIconUrl,
    logoOgUrl,
    logoEmailUrl,
    logoUrl: logoFullUrl,
    faviconUrl,
    supportEmail:
      settings?.supportEmail?.trim() || PLATFORM_DEFAULTS.supportEmail,
    siteUrl,
    defaultMetaTitle:
      settings?.defaultMetaTitle?.trim() ||
      platformName ||
      PLATFORM_DEFAULTS.defaultMetaTitle,
    defaultMetaDescription:
      settings?.defaultMetaDescription?.trim() ||
      platformDescription ||
      PLATFORM_DEFAULTS.defaultMetaDescription,
    ogSiteName:
      settings?.ogSiteName?.trim() ||
      platformShortName ||
      PLATFORM_DEFAULTS.ogSiteName,
    emailSenderName:
      settings?.emailSenderName?.trim() ||
      platformShortName ||
      PLATFORM_DEFAULTS.emailSenderName,
    defaultLanguage:
      settings?.defaultLanguage?.trim() || PLATFORM_DEFAULTS.defaultLanguage,
    defaultCurrency:
      settings?.defaultCurrency?.trim() || PLATFORM_DEFAULTS.defaultCurrency,
  };
}

export async function getPlatformConfig() {
  const settings = await readPlatformSettings();
  return resolvePlatformConfig(settings);
}

export const getPlatform = cache(getPlatformConfig);

export async function updatePlatformConfig(input: PlatformSettingsInput) {
  return savePlatformSettings(input);
}

export async function getPlatformEmailDefaults(): Promise<PlatformEmailDefaults> {
  const platform = await getPlatform();

  return {
    senderName: platform.emailSenderName,
    supportEmail: platform.supportEmail,
    from: `${platform.emailSenderName} <${platform.supportEmail}>`,
    logoEmailUrl: platform.logoEmailUrl,
  };
}
