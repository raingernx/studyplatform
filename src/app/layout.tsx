import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// force-dynamic removed: neither getPlatform() nor getTypographySettingsOrDefault()
// access request-specific data (cookies/headers/session). Both are wrapped in
// unstable_cache (Data Cache, 300 s TTL) and react.cache() for per-request
// deduplication — they work identically in static and dynamic rendering contexts.
// Platform config freshness is guaranteed by revalidateTag("platform") in the
// admin settings mutation routes. Pages that genuinely need per-request rendering
// declare their own `export const dynamic = "force-dynamic"` (e.g. /resources,
// all dashboard/admin pages).
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlatformConfigProvider } from "@/components/providers/PlatformConfigProvider";
import { PublicFooterGate } from "@/components/layout/PublicFooterGate";
import { Footer } from "@/components/layout/Footer";
import { fontVariables } from "@/lib/fonts";
import { resolveTypographyTheme } from "@/lib/typography/resolve-typography-theme";
import { typographyThemeToCssVars } from "@/lib/typography/typography-theme-to-css-vars";
import { getPlatform } from "@/services/platform.service";
import {
  buildTypographyThemeSettings,
  getTypographySettingsOrDefault,
} from "@/services/platformTypographySettings.service";
import { buildPlatformMetadata } from "@/lib/platform/platform-metadata";
import { Providers } from "./providers";

function cssVarsToStyle(vars: Record<string, string>): React.CSSProperties {
  return vars;
}

export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatform();
  return buildPlatformMetadata(platform);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [platform, typographySettings] = await Promise.all([
    getPlatform(),
    getTypographySettingsOrDefault(),
  ]);
  const theme = resolveTypographyTheme(
    buildTypographyThemeSettings(typographySettings),
  );
  const cssVars = typographyThemeToCssVars(theme);
  const style = cssVarsToStyle(cssVars);

  return (
    <html
      lang="th"
      data-typography={typographySettings.presetKey}
      data-typography-scale={theme.headingScale}
      data-scroll-behavior="smooth"
    >
      <body
        className={`${fontVariables} font-sans ${typographySettings.enableFontSmoothing ? "antialiased" : ""}`.trim()}
        style={style}
      >
        <PlatformConfigProvider initialConfig={platform}>
          <ThemeProvider>
            <Providers>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1 min-h-0">{children}</div>
                <PublicFooterGate>
                  <Footer platformName={platform.platformShortName} />
                </PublicFooterGate>
              </div>
            </Providers>
          </ThemeProvider>
        </PlatformConfigProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
