import { Prisma } from "@prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { env } from "@/env";
import {
  getPlatformSettings as getStoredPlatformSettings,
  updatePlatformSettings as savePlatformSettings,
} from "@/repositories/platformSettings.repository";
import {
  CACHE_KEYS,
  CACHE_TAGS,
  CACHE_TTLS,
  rememberJson,
  runSingleFlight,
} from "@/lib/cache";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import { isMissingTableError } from "@/lib/prismaErrors";
import type {
  PlatformConfig,
  PlatformEmailDefaults,
  PlatformSettingsInput,
  PlatformStoredSettings,
} from "@/lib/platform/platform.types";

export const PUBLIC_PLATFORM_ASSET_ROUTES = {
  logoFullUrl: "/brand-assets/full-logo",
  logoFullDarkUrl: "/brand-assets/full-logo-dark",
  logoIconUrl: "/brand-assets/icon-logo",
  logoIconDarkUrl: "/brand-assets/icon-logo-dark",
  logoOgUrl: "/brand-assets/og-logo",
  logoEmailUrl: "/brand-assets/email-logo",
  faviconUrl: "/brand-assets/favicon",
} as const;

const readPlatformSettings = unstable_cache(
  async () => {
    try {
      return await rememberJson(
        CACHE_KEYS.platformSettings,
        CACHE_TTLS.platform,
        () =>
          runSingleFlight(CACHE_KEYS.platformSettings, () =>
            getStoredPlatformSettings(),
          ),
        {
          metricName: "platform.settings",
        },
      );
    } catch (error) {
      if (!isMissingTableError(error) && !isPlatformSettingsTransientDbError(error)) {
        throw error;
      }
      // Missing table or transient DB pool/connectivity failure — use defaults.
      return null;
    }
  },
  [CACHE_KEYS.platformSettings],
  {
    revalidate: CACHE_TTLS.platform,
    tags: [CACHE_TAGS.platform],
  },
);

function isPlatformSettingsTransientDbError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("Can't reach database server") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

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

function normalizeStoredPlatformAssetUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return "";
  }

  try {
    const pathname = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed).pathname
      : trimmed;

    return Object.values(PUBLIC_PLATFORM_ASSET_ROUTES).includes(
      pathname as (typeof PUBLIC_PLATFORM_ASSET_ROUTES)[keyof typeof PUBLIC_PLATFORM_ASSET_ROUTES],
    )
      ? ""
      : trimmed;
  } catch {
    return Object.values(PUBLIC_PLATFORM_ASSET_ROUTES).includes(
      trimmed as (typeof PUBLIC_PLATFORM_ASSET_ROUTES)[keyof typeof PUBLIC_PLATFORM_ASSET_ROUTES],
    )
      ? ""
      : trimmed;
  }
}

function sanitizeAdminStoredSettings(
  settings: Awaited<ReturnType<typeof getStoredPlatformSettings>>,
): PlatformStoredSettings {
  if (!settings) return {};

  const hasCustomFullLogo =
    !!settings.logoFullUrl?.trim() &&
    settings.logoFullUrl.trim() !== PLATFORM_DEFAULTS.logoFullUrl;
  const hasLegacyFullLogo =
    !!settings.logoUrl?.trim() &&
    settings.logoUrl.trim() !== PLATFORM_DEFAULTS.logoFullUrl;
  const hasCustomIconLogo =
    !!settings.logoIconUrl?.trim() &&
    settings.logoIconUrl.trim() !== PLATFORM_DEFAULTS.logoIconUrl;

  const logoOgUrl =
    normalizeStoredPlatformAssetUrl(settings.logoOgUrl) === PLATFORM_DEFAULTS.logoOgUrl &&
    (hasCustomFullLogo || hasLegacyFullLogo)
      ? null
      : normalizeStoredPlatformAssetUrl(settings.logoOgUrl) || null;
  const logoEmailUrl =
    normalizeStoredPlatformAssetUrl(settings.logoEmailUrl) === PLATFORM_DEFAULTS.logoEmailUrl &&
    (hasCustomFullLogo || hasLegacyFullLogo)
      ? null
      : normalizeStoredPlatformAssetUrl(settings.logoEmailUrl) || null;
  const faviconUrl =
    normalizeStoredPlatformAssetUrl(settings.faviconUrl) === PLATFORM_DEFAULTS.faviconUrl &&
    hasCustomIconLogo
      ? null
      : normalizeStoredPlatformAssetUrl(settings.faviconUrl) || null;

  return {
    ...settings,
    logoUrl: normalizeStoredPlatformAssetUrl(settings.logoUrl) || null,
    logoFullUrl: normalizeStoredPlatformAssetUrl(settings.logoFullUrl) || null,
    logoFullDarkUrl:
      normalizeStoredPlatformAssetUrl(settings.logoFullDarkUrl) || null,
    logoIconUrl: normalizeStoredPlatformAssetUrl(settings.logoIconUrl) || null,
    logoIconDarkUrl:
      normalizeStoredPlatformAssetUrl(settings.logoIconDarkUrl) || null,
    logoOgUrl,
    logoEmailUrl,
    faviconUrl,
  };
}

export function resolvePlatformConfig(
  settings:
    | Awaited<ReturnType<typeof getStoredPlatformSettings>>
    | PlatformStoredSettings
    | null,
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
    env.appBaseUrl ||
    PLATFORM_DEFAULTS.siteUrl;
  const legacyLogoUrl = normalizeStoredPlatformAssetUrl(settings?.logoUrl);
  const storedFullLogoUrl = normalizeStoredPlatformAssetUrl(settings?.logoFullUrl);
  const storedFullDarkLogoUrl = normalizeStoredPlatformAssetUrl(
    settings?.logoFullDarkUrl,
  );
  const storedIconLogoUrl = normalizeStoredPlatformAssetUrl(settings?.logoIconUrl);
  const storedIconDarkLogoUrl = normalizeStoredPlatformAssetUrl(
    settings?.logoIconDarkUrl,
  );
  const storedOgLogoUrl = normalizeStoredPlatformAssetUrl(settings?.logoOgUrl);
  const storedEmailLogoUrl = normalizeStoredPlatformAssetUrl(settings?.logoEmailUrl);
  const storedFaviconUrl = normalizeStoredPlatformAssetUrl(settings?.faviconUrl);
  const logoFullUrl =
    storedFullLogoUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoFullUrl;
  const logoIconUrl =
    storedIconLogoUrl ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoIconUrl;
  const logoFullDarkUrl =
    storedFullDarkLogoUrl ||
    storedFullLogoUrl ||
    legacyLogoUrl ||
    logoFullUrl ||
    PLATFORM_DEFAULTS.logoFullDarkUrl;
  const logoIconDarkUrl =
    storedIconDarkLogoUrl ||
    storedIconLogoUrl ||
    logoFullDarkUrl ||
    logoIconUrl ||
    PLATFORM_DEFAULTS.logoIconDarkUrl;
  const logoOgUrl =
    storedOgLogoUrl ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoOgUrl;
  const logoEmailUrl =
    storedEmailLogoUrl ||
    logoFullUrl ||
    legacyLogoUrl ||
    PLATFORM_DEFAULTS.logoEmailUrl;
  const faviconUrl =
    storedFaviconUrl ||
    (looksLikeFaviconAsset(logoIconUrl) ? logoIconUrl : "") ||
    (looksLikeFaviconAsset(legacyLogoUrl) ? legacyLogoUrl : "") ||
    PLATFORM_DEFAULTS.faviconUrl;

  return {
    platformName,
    platformShortName,
    platformDescription,
    logoFullUrl,
    logoFullDarkUrl,
    logoIconUrl,
    logoIconDarkUrl,
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

export function getBuildSafePlatformConfig(): PlatformConfig {
  return resolvePlatformConfig(null);
}

export function getBuildSafePublicPlatformConfig(): PlatformConfig {
  const platform = resolvePlatformConfig(null);

  return {
    ...platform,
    logoFullUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoFullUrl,
    logoFullDarkUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoFullDarkUrl,
    logoIconUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoIconUrl,
    logoIconDarkUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoIconDarkUrl,
    logoOgUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoOgUrl,
    logoEmailUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoEmailUrl,
    logoUrl: PUBLIC_PLATFORM_ASSET_ROUTES.logoFullUrl,
    faviconUrl: PUBLIC_PLATFORM_ASSET_ROUTES.faviconUrl,
  };
}

export async function getPlatformAdminSettings(): Promise<{
  resolved: PlatformConfig;
  stored: PlatformStoredSettings;
}> {
  const rawSettings = await readPlatformSettings();
  const settings = sanitizeAdminStoredSettings(rawSettings);

  return {
    resolved: resolvePlatformConfig(settings),
    stored: settings,
  };
}

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
