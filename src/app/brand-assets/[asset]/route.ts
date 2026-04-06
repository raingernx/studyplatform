import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import { getPlatform } from "@/services/platform";

export const dynamic = "force-dynamic";

const ASSET_KEYS = {
  "full-logo": "logoFullUrl",
  "full-logo-dark": "logoFullDarkUrl",
  "icon-logo": "logoIconUrl",
  "icon-logo-dark": "logoIconDarkUrl",
  "og-logo": "logoOgUrl",
  "email-logo": "logoEmailUrl",
  favicon: "faviconUrl",
} as const;

const ASSET_DEFAULTS = {
  "full-logo": PLATFORM_DEFAULTS.logoFullUrl,
  "full-logo-dark": PLATFORM_DEFAULTS.logoFullDarkUrl,
  "icon-logo": PLATFORM_DEFAULTS.logoIconUrl,
  "icon-logo-dark": PLATFORM_DEFAULTS.logoIconDarkUrl,
  "og-logo": PLATFORM_DEFAULTS.logoOgUrl,
  "email-logo": PLATFORM_DEFAULTS.logoEmailUrl,
  favicon: PLATFORM_DEFAULTS.faviconUrl,
} as const;

type AssetKey = keyof typeof ASSET_KEYS;

function isAssetKey(value: string): value is AssetKey {
  return value in ASSET_KEYS;
}

function toAssetUrl(request: NextRequest, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return new URL(value, request.url).toString();
}

function isSelfReferentialAssetRoute(
  request: NextRequest,
  asset: AssetKey,
  value: string,
) {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  try {
    const pathname = normalized.startsWith("http://") || normalized.startsWith("https://")
      ? new URL(normalized).pathname
      : normalized;

    if (pathname === request.nextUrl.pathname) {
      return true;
    }

    return pathname === `/brand-assets/${asset}`;
  } catch {
    if (normalized === request.nextUrl.pathname) {
      return true;
    }

    return normalized === `/brand-assets/${asset}`;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ asset: string }> },
) {
  const { asset } = await context.params;
  if (!isAssetKey(asset)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const platform = await getPlatform();
  const key = ASSET_KEYS[asset];
  const resolvedValue = platform[key];
  const value = isSelfReferentialAssetRoute(request, asset, resolvedValue)
    ? ASSET_DEFAULTS[asset]
    : resolvedValue;

  if (!value) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(toAssetUrl(request, value), {
    status: 307,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
