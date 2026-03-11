import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "PaperDock", template: "%s | PaperDock" },
  description: "PaperDock is a marketplace for high-quality educational resources.",
  icons: {
    icon: [
      { url: "/logo/72ppi/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/72ppi/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/jgt5pob.css" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
