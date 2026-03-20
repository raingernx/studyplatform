import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS,
  normalizePlatformTypographySettingsInput,
  type PlatformTypographySettingsInput,
  type PlatformTypographySettingsRecord,
} from "@/lib/typography/typography-settings";

const GLOBAL_SINGLETON_KEY = "global";

function toRecord(
  record: Awaited<ReturnType<typeof prisma.platformTypographySettings.findFirstOrThrow>>,
): PlatformTypographySettingsRecord {
  return {
    id: record.id,
    presetKey: record.presetKey as PlatformTypographySettingsRecord["presetKey"],
    headingLatin:
      (record.headingLatin as PlatformTypographySettingsRecord["headingLatin"]) ??
      null,
    headingThai:
      (record.headingThai as PlatformTypographySettingsRecord["headingThai"]) ??
      null,
    bodyLatin:
      (record.bodyLatin as PlatformTypographySettingsRecord["bodyLatin"]) ?? null,
    bodyThai:
      (record.bodyThai as PlatformTypographySettingsRecord["bodyThai"]) ?? null,
    uiLatin:
      (record.uiLatin as PlatformTypographySettingsRecord["uiLatin"]) ?? null,
    uiThai:
      (record.uiThai as PlatformTypographySettingsRecord["uiThai"]) ?? null,
    mono: (record.mono as PlatformTypographySettingsRecord["mono"]) ?? null,
    baseFontSize:
      (record.baseFontSize as PlatformTypographySettingsRecord["baseFontSize"]) ??
      null,
    headingScale:
      (record.headingScale as PlatformTypographySettingsRecord["headingScale"]) ??
      null,
    lineHeightDensity:
      (record.lineHeightDensity as PlatformTypographySettingsRecord["lineHeightDensity"]) ??
      null,
    letterSpacingPreset:
      (record.letterSpacingPreset as PlatformTypographySettingsRecord["letterSpacingPreset"]) ??
      null,
    enableFontSmoothing: record.enableFontSmoothing,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toData(input: PlatformTypographySettingsInput) {
  const normalized = normalizePlatformTypographySettingsInput(input);

  return {
    presetKey: normalized.presetKey,
    headingLatin: normalized.headingLatin,
    headingThai: normalized.headingThai,
    bodyLatin: normalized.bodyLatin,
    bodyThai: normalized.bodyThai,
    uiLatin: normalized.uiLatin,
    uiThai: normalized.uiThai,
    mono: normalized.mono,
    baseFontSize: normalized.baseFontSize,
    headingScale: normalized.headingScale,
    lineHeightDensity: normalized.lineHeightDensity,
    letterSpacingPreset: normalized.letterSpacingPreset,
    enableFontSmoothing: normalized.enableFontSmoothing,
  };
}

export async function getPlatformTypographySettings(): Promise<PlatformTypographySettingsRecord> {
  const settings = await prisma.platformTypographySettings.upsert({
    where: { singletonKey: GLOBAL_SINGLETON_KEY },
    update: {},
    create: {
      singletonKey: GLOBAL_SINGLETON_KEY,
      ...toData(DEFAULT_PLATFORM_TYPOGRAPHY_SETTINGS),
    },
  });

  return toRecord(settings);
}

export async function updatePlatformTypographySettings(
  input: PlatformTypographySettingsInput,
): Promise<PlatformTypographySettingsRecord> {
  const updated = await prisma.platformTypographySettings.upsert({
    where: { singletonKey: GLOBAL_SINGLETON_KEY },
    update: toData(input),
    create: {
      singletonKey: GLOBAL_SINGLETON_KEY,
      ...toData(input),
    },
  });

  return toRecord(updated);
}
