import Link from "next/link";
import { Compass, Search, Sparkles } from "lucide-react";
import { routes } from "@/lib/routes";
import type { SearchRecoveryData } from "@/services/search-recovery.service";

export function SearchRecoveryPanel({
  query,
  recovery,
}: {
  query: string;
  recovery: SearchRecoveryData;
}) {
  const hasSuggestedQueries = recovery.suggestedQueries.length > 0;
  const hasCategoryMatches = recovery.categoryMatches.length > 0;
  const hasTagMatches = recovery.tagMatches.length > 0;

  return (
    <div className="space-y-5 rounded-[28px] border border-surface-200 bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-col items-center justify-center py-1 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50">
          <Search className="h-6 w-6 text-text-muted" />
        </div>
        <p className="mt-4 text-base font-semibold text-zinc-700">
          {`ยังไม่พบผลลัพธ์สำหรับ “${query}”`}
        </p>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          ลองค้นหาด้วยคำที่กว้างขึ้น หรือข้ามไปดูหมวดและแท็กที่เกี่ยวข้องเพื่อกลับเข้าสู่คลังได้เร็วขึ้น
        </p>
      </div>

      {hasSuggestedQueries ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Try these searches
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.suggestedQueries.map((suggestion) => (
              <Link
                key={suggestion}
                href={routes.marketplaceSearch(suggestion)}
                className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-white"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hasCategoryMatches ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Browse categories instead
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.categoryMatches.map((match) => (
              <Link
                key={match.slug}
                href={routes.marketplaceCategory(match.slug)}
                className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
              >
                {match.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hasTagMatches ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Related tags
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.tagMatches.slice(0, 6).map((match) => (
              <Link
                key={match.slug}
                href={routes.marketplaceTag(match.slug)}
                className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
              >
                #{match.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 border-t border-surface-100 pt-4 sm:grid-cols-3">
        <Link
          href={routes.marketplaceQuery("sort=trending&category=all")}
          className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-surface-300 hover:bg-white"
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-text-primary">Trending now</span>
        </Link>
        <Link
          href={routes.marketplaceQuery("price=free&category=all")}
          className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-surface-300 hover:bg-white"
        >
          <Compass className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-text-primary">Browse free resources</span>
        </Link>
        <Link
          href={routes.marketplace}
          className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-surface-300 hover:bg-white"
        >
          <Search className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-text-primary">Return to discover</span>
        </Link>
      </section>
    </div>
  );
}
