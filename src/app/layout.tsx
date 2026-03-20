import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlatformConfigProvider } from "@/components/providers/PlatformConfigProvider";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
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

  if (process.env.NODE_ENV === "development") {
    console.log("Typography Theme:", theme);
  }

  return (
    <html
      lang="th"
      data-typography={typographySettings.presetKey}
      data-typography-scale={theme.headingScale}
    >
      <body
        className={`${fontVariables} font-sans ${typographySettings.enableFontSmoothing ? "antialiased" : ""}`.trim()}
        style={style}
      >
        <PlatformConfigProvider initialConfig={platform}>
          <ThemeProvider>
            <Providers>
              {children}
              <PublicSiteFooter>
                <Footer platformName={platform.platformShortName} />
              </PublicSiteFooter>
            </Providers>
          </ThemeProvider>
        </PlatformConfigProvider>
      </body>
    </html>
  );
}
