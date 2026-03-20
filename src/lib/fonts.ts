import {
  Fraunces,
  Inter,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
  Plus_Jakarta_Sans,
  Geist_Mono,
} from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai"],
  variable: "--font-noto-serif-thai",
  display: "swap",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// No local mono asset exists in the repo yet, so use the hosted Geist Mono fallback.
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const fontVariables = [
  inter.variable,
  fraunces.variable,
  notoSansThai.variable,
  notoSerifThai.variable,
  plusJakartaSans.variable,
  geistMono.variable,
].join(" ");
