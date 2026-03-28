import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-sans-thai",
  weight: ["400", "500", "600", "700"],
});

const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-serif-thai",
  weight: ["400", "500", "600", "700"],
});

export const fontVariables = [
  GeistSans.variable,
  GeistMono.variable,
  notoSansThai.variable,
  notoSerifThai.variable,
].join(" ");

export const fontVariableFallbacks: Record<string, string> = {
  "--font-inter": "var(--font-geist-sans)",
  "--font-fraunces": "Georgia",
  "--font-plus-jakarta": "var(--font-geist-sans)",
};
