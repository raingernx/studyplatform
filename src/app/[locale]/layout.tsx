// This layout is kept as a passthrough to avoid 404s for any [locale] routes
// that survive the /th → / redirect in middleware. It no longer injects any
// i18n context — all routes have been migrated to flat paths.
import { Providers } from "../providers";

type Props = {
  children: React.ReactNode;
};

export default function LocaleLayout({ children }: Props) {
  return <Providers>{children}</Providers>;
}
