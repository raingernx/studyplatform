import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlatformConfigProvider } from "@/components/providers/PlatformConfigProvider";
import { PublicFooterGate } from "@/components/layout/PublicFooterGate";
import { Footer } from "@/components/layout/Footer";
import { fontVariables } from "@/lib/fonts";
import { getPlatform } from "@/services/platform.service";
import { buildPlatformMetadata } from "@/lib/platform/platform-metadata";
import { Providers } from "./providers";

export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatform();
  return buildPlatformMetadata(platform);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platform = await getPlatform();

  return (
    <html lang="th" data-scroll-behavior="smooth" className="min-h-screen bg-background">
      <body
        className={`${fontVariables} min-h-screen bg-background font-sans text-foreground antialiased`.trim()}
      >
        <PlatformConfigProvider initialConfig={platform}>
          <ThemeProvider>
            <Providers>
              <div className="flex min-h-screen flex-col bg-background">
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
