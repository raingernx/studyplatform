import type { Metadata } from "next";
import type { PlatformConfig } from "./platform.types";

function getMetadataBase(siteUrl: string) {
  if (!siteUrl) return undefined;

  try {
    return new URL(siteUrl);
  } catch {
    return undefined;
  }
}

export function buildPlatformMetadata(platform: PlatformConfig): Metadata {
  const metadataBase = getMetadataBase(platform.siteUrl);
  const socialImages = platform.logoOgUrl
    ? [{ url: platform.logoOgUrl }]
    : undefined;

  return {
    metadataBase,
    applicationName: platform.platformShortName,
    title: {
      default: platform.defaultMetaTitle,
      template: `%s | ${platform.platformShortName}`,
    },
    description: platform.defaultMetaDescription,
    openGraph: {
      title: platform.defaultMetaTitle,
      description: platform.defaultMetaDescription,
      siteName: platform.ogSiteName,
      images: socialImages,
      ...(metadataBase ? { url: platform.siteUrl } : {}),
    },
    twitter: {
      title: platform.defaultMetaTitle,
      description: platform.defaultMetaDescription,
      images: socialImages,
    },
    icons: {
      icon: platform.faviconUrl
        ? [{ url: platform.faviconUrl }]
        : undefined,
    },
  };
}
