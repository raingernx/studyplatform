/**
 * Canonical sort options for all marketplace / library UIs.
 *
 * This is the **single source of truth**.  Import `SORT_OPTIONS` wherever a
 * sort selector is rendered instead of declaring a local array.
 *
 * Query-param values are stable — changing a `value` here is a breaking
 * change for bookmarked/shared URLs, so treat them like a public API.
 */
export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended"       },
  { value: "trending",    label: "Trending"          },
  { value: "newest",      label: "Newest"            },
  { value: "downloads",   label: "Most downloaded"   },
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/** Default sort applied when the ?sort= param is absent. */
export const DEFAULT_SORT: SortValue = "trending";

/**
 * Maps legacy or non-standard sort param values to a canonical SortValue.
 * Use at query-param read sites so old bookmarked URLs keep working.
 *
 * e.g.  normaliseSortParam("popular")  → "downloads"
 *       normaliseSortParam("oldest")   → "newest"
 *       normaliseSortParam(undefined)  → DEFAULT_SORT
 */
export function normaliseSortParam(raw: string | null | undefined): SortValue {
  const LEGACY: Record<string, SortValue> = {
    popular:  "downloads",
    oldest:   "newest",
    featured: "newest",
  };

  if (!raw) return DEFAULT_SORT;
  if (LEGACY[raw]) return LEGACY[raw];

  const valid = SORT_OPTIONS.map((o) => o.value) as string[];
  return valid.includes(raw) ? (raw as SortValue) : DEFAULT_SORT;
}
