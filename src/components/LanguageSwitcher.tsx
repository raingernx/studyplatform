"use client";

import {usePathname, useRouter} from "@/i18n/navigation";
import {useLocale} from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(nextLocale: "th" | "en") {
    if (nextLocale === locale) return;
    // Persist preference for 1 year
    if (typeof document !== "undefined") {
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `locale=${nextLocale}; path=/; max-age=${maxAge}`;
      // next-intl uses NEXT_LOCALE internally
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${maxAge}`;
    }

    // #region agent log
    fetch("http://127.0.0.1:7472/ingest/8f36f62e-5ee6-48fc-ac11-6d3f136199e5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "839f66",
      },
      body: JSON.stringify({
        sessionId: "839f66",
        runId: "lang-switch",
        hypothesisId: "H1",
        location: "src/components/LanguageSwitcher.tsx:switchTo",
        message: "Switching locale",
        data: { from: locale, to: nextLocale, pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-1 py-0.5 text-[11px] font-medium text-text-secondary">
      <button
        type="button"
        onClick={() => switchTo("th")}
        className={`rounded-md px-2 py-1 ${locale === "th" ? "bg-surface-100 text-text-primary" : "hover:bg-surface-50"}`}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`rounded-md px-2 py-1 ${locale === "en" ? "bg-surface-100 text-text-primary" : "hover:bg-surface-50"}`}
      >
        EN
      </button>
    </div>
  );
}

