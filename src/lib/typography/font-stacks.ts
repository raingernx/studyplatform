export const FONT_STACKS = {
  inter: "var(--font-inter), system-ui, sans-serif",
  fraunces: "var(--font-fraunces), Georgia, serif",
  notoSansThai: "var(--font-noto-sans-thai), system-ui, sans-serif",
  notoSerifThai: "var(--font-noto-serif-thai), Georgia, serif",
  plusJakartaSans: "var(--font-plus-jakarta), system-ui, sans-serif",
  geistMono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export type FontStackKey = keyof typeof FONT_STACKS;
