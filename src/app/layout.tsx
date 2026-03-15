import "./globals.css";
import { Geist, Inter, Noto_Sans_Thai } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { Footer } from "@/components/layout/Footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${geist.variable} ${inter.variable} ${notoSansThai.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <PublicSiteFooter>
            <Footer />
          </PublicSiteFooter>
        </ThemeProvider>
      </body>
    </html>
  );
}