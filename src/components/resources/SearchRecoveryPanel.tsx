import Link from "next/link";
import { Compass, Search, Sparkles } from "lucide-react";
import { routes } from "@/lib/routes";
import type { SearchRecoveryData } from "@/services/search";

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
    <div className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-card sm:p-7">
      <div className="flex flex-col items-center justify-center py-1 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">
          {`ยังไม่พบผลลัพธ์สำหรับ “${query}”`}
        </p>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          ลองค้นหาด้วยคำที่กว้างขึ้น หรือข้ามไปดูหมวดและแท็กที่เกี่ยวข้องเพื่อกลับเข้าสู่คลังได้เร็วขึ้น
        </p>
      </div>

      {hasSuggestedQueries ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Try these searches
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.suggestedQueries.map((suggestion) => (
              <Link
                key={suggestion}
                href={routes.marketplaceSearch(suggestion)}
                className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition hover:bg-accent hover:text-foreground"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hasCategoryMatches ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Browse categories instead
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.categoryMatches.map((match) => (
              <Link
                key={match.slug}
                href={routes.marketplaceCategory(match.slug)}
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {match.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hasTagMatches ? (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Related tags
          </p>
          <div className="flex flex-wrap gap-2">
            {recovery.tagMatches.slice(0, 6).map((match) => (
              <Link
                key={match.slug}
                href={routes.marketplaceTag(match.slug)}
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                #{match.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <Link
          href={routes.marketplaceQuery("sort=trending&category=all")}
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 transition hover:bg-background"
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-foreground">Trending now</span>
        </Link>
        <Link
          href={routes.marketplaceQuery("price=free&category=all")}
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 transition hover:bg-background"
        >
          <Compass className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-foreground">Browse free resources</span>
        </Link>
        <Link
          href={routes.marketplace}
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 transition hover:bg-background"
        >
          <Search className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-foreground">Return to discover</span>
        </Link>
      </section>
    </div>
  );
}
