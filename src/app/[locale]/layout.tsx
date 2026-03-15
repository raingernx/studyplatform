import type {Metadata} from "next";
import {NextIntlClientProvider, hasLocale} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {routing} from "@/i18n/routing";
import {Providers} from "../providers";

export const metadata: Metadata = {
  title: {default: "PaperDock", template: "%s | PaperDock"},
  description: "PaperDock is a marketplace for high-quality educational resources.",
  icons: {
    icon: [
      {url: "/logo/72ppi/favicon-32x32.png", sizes: "32x32", type: "image/png"},
      {url: "/logo/72ppi/favicon-48x48.png", sizes: "48x48", type: "image/png"},
    ],
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    // Let next-intl middleware handle 404s for invalid locales
    return null;
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}

