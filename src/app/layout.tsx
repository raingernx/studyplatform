import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { BonesRegistryBootstrap } from "@/components/providers/BonesRegistryBootstrap";
import { DashboardGroupNavigationOverlay } from "@/components/providers/DashboardGroupNavigationOverlay";
import { ResourcesNavigationOverlay } from "@/components/providers/ResourcesNavigationOverlay";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlatformConfigProvider } from "@/components/providers/PlatformConfigProvider";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { Footer } from "@/components/layout/Footer";
import { fontVariables } from "@/lib/fonts";
import { getBuildSafePublicPlatformConfig } from "@/services/platform";
import { buildPlatformMetadata } from "@/lib/platform/platform-metadata";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Providers } from "./providers";

export function generateMetadata(): Metadata {
  const platform = getBuildSafePublicPlatformConfig();
  return buildPlatformMetadata(platform);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platform = getBuildSafePublicPlatformConfig();
  const htmlLang = platform.defaultLanguage.trim() || "th";
  const enableVercelTelemetry = process.env.NODE_ENV === "production";

  return (
    <html
      lang={htmlLang}
      data-scroll-behavior="smooth"
      className="min-h-screen bg-background"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${fontVariables} min-h-screen bg-background font-sans text-foreground antialiased`.trim()}
      >
        <BonesRegistryBootstrap />
        <DashboardGroupNavigationOverlay />
        <ResourcesNavigationOverlay />
        <PlatformConfigProvider initialConfig={platform}>
          <ThemeProvider>
            <Providers>
              <div className="flex min-h-screen flex-col bg-background">
                <div className="flex-1 min-h-0">{children}</div>
                <PublicSiteFooter>
                  <Footer platformName={platform.platformShortName} />
                </PublicSiteFooter>
              </div>
            </Providers>
          </ThemeProvider>
        </PlatformConfigProvider>
        {enableVercelTelemetry ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
