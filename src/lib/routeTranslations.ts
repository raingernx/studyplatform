import type {Locale} from "@/i18n/config";

export const routeTranslations = {
  marketplace: {
    th: "resources",
    en: "resources",
  },
  library: {
    th: "dashboard/library",
    en: "dashboard/library",
  },
  membership: {
    th: "membership",
    en: "membership",
  },
} as const;

export type RouteKey = keyof typeof routeTranslations;

export function getLocalizedPath(key: RouteKey, locale: Locale): string {
  const segment = routeTranslations[key][locale];
  return `/${segment}`;
}

