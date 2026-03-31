import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlatformConfigProvider } from "@/components/providers/PlatformConfigProvider";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { Footer } from "@/components/layout/Footer";
import { fontVariables } from "@/lib/fonts";
import { getBuildSafePlatformConfig } from "@/services/platform.service";
import { buildPlatformMetadata } from "@/lib/platform/platform-metadata";
import { Providers } from "./providers";

export async function generateMetadata(): Promise<Metadata> {
  const platform = getBuildSafePlatformConfig();
  return buildPlatformMetadata(platform);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platform = getBuildSafePlatformConfig();
  const htmlLang = platform.defaultLanguage.trim() || "th";

  return (
    <html lang={htmlLang} data-scroll-behavior="smooth" className="min-h-screen bg-white">
      <body
        className={`${fontVariables} min-h-screen bg-white font-sans text-foreground antialiased`.trim()}
      >
        <PlatformConfigProvider initialConfig={platform}>
          <ThemeProvider>
            <Providers>
              <div className="flex min-h-screen flex-col bg-white">
                <div className="flex-1 min-h-0">{children}</div>
                <PublicSiteFooter>
                  <Footer platformName={platform.platformShortName} />
                </PublicSiteFooter>
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
