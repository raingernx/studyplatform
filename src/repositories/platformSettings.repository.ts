import { prisma } from "@/lib/prisma";
import type { PlatformSettingsInput } from "@/lib/platform/platform.types";

function normalizeOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getPlatformSettings() {
  return prisma.platformSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export async function updatePlatformSettings(input: PlatformSettingsInput) {
  const existing = await getPlatformSettings();
  const data = {
    name: input.name.trim(),
    description: normalizeOptional(input.description),
    shortName: normalizeOptional(input.shortName),
    siteUrl: normalizeOptional(input.siteUrl),
    defaultMetaTitle: normalizeOptional(input.defaultMetaTitle),
    defaultMetaDescription: normalizeOptional(input.defaultMetaDescription),
    ogSiteName: normalizeOptional(input.ogSiteName),
    logoUrl: normalizeOptional(input.logoUrl),
    logoFullUrl: normalizeOptional(input.logoFullUrl),
    logoFullDarkUrl: normalizeOptional(input.logoFullDarkUrl),
    logoIconUrl: normalizeOptional(input.logoIconUrl),
    logoIconDarkUrl: normalizeOptional(input.logoIconDarkUrl),
    logoOgUrl: normalizeOptional(input.logoOgUrl),
    logoEmailUrl: normalizeOptional(input.logoEmailUrl),
    faviconUrl: normalizeOptional(input.faviconUrl),
    supportEmail: normalizeOptional(input.supportEmail),
    emailSenderName: normalizeOptional(input.emailSenderName),
    defaultLanguage: normalizeOptional(input.defaultLanguage),
    defaultCurrency: normalizeOptional(input.defaultCurrency),
  };

  if (existing) {
    return prisma.platformSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.platformSettings.create({
    data,
  });
}
