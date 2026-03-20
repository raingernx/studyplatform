-- CreateTable
CREATE TABLE "PlatformTypographySettings" (
    "id" TEXT NOT NULL,
    "presetKey" TEXT NOT NULL DEFAULT 'modern-education',
    "headingLatin" TEXT,
    "headingThai" TEXT,
    "bodyLatin" TEXT,
    "bodyThai" TEXT,
    "uiLatin" TEXT,
    "uiThai" TEXT,
    "mono" TEXT,
    "baseFontSize" TEXT,
    "headingScale" TEXT,
    "lineHeightDensity" TEXT,
    "letterSpacingPreset" TEXT,
    "enableFontSmoothing" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTypographySettings_pkey" PRIMARY KEY ("id")
);
