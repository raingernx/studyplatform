import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Thai } from "next/font/google";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-sans-thai",
  weight: ["400", "500", "600", "700"],
});

export const fontVariables = [
  GeistMono.variable,
  notoSansThai.variable,
].join(" ");

export const fontVariableFallbacks: Record<string, string> = {};
