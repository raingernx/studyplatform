"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileText, Search } from "lucide-react";
import { SearchInput } from "@/design-system";
import { cn } from "@/lib/utils";
import {
  beginResourcesNavigation,
  inferResourcesNavigationMode,
} from "@/components/marketplace/resourcesNavigationState";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import {
  buildMarketplaceClearSearchHref,
  getMarketplaceInitialSearchValue,
  buildMarketplaceSearchRecoveryHref,
  buildMarketplaceSearchHref,
  buildMarketplaceSuggestionsHref,
  shouldSyncMarketplaceSearchValue,
} from "@/lib/search/marketplace-navigation";
import {
  fetchSearchRecovery,
  fetchSearchSuggestions,
} from "@/lib/search/search-suggestions";
import { routes } from "@/lib/routes";

type HeroSearchVariant = "hero" | "listing";

interface HeroSearchProps {
  variant?: HeroSearchVariant;
  className?: string;
  placeholder?: string;
}

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  previewUrl: string | null;
  price: number;
  isFree: boolean;
  category: { name: string } | null;
  author: { name: string | null } | null;
  matchReason?: string | null;
}

interface SearchRecoveryMatch {
  name: string;
  slug: string;
  resourceCount: number;
}

interface SearchRecoveryData {
  suggestedQueries: string[];
  categoryMatches: SearchRecoveryMatch[];
  tagMatches: SearchRecoveryMatch[];
}

/**
 * Canonical marketplace search input.
 * - On `/resources`, it refines the current catalogue context.
 * - On other public routes, it acts as a global marketplace jump point.
 * - Enter submits to the marketplace results page.
 * - Arrow keys / click can open a resource detail directly from suggestions.
 */
export function HeroSearch({
  variant = "hero",
  className,
  placeholder = "ค้นหาใบงาน แฟลชการ์ด โน้ต...",
}: HeroSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncWithUrl = shouldSyncMarketplaceSearchValue(pathname);

  const [value, setValue] = useState(() =>
    getMarketplaceInitialSearchValue({
      pathname,
      searchParams,
    }),
  );
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recovery, setRecovery] = useState<SearchRecoveryData | null>(null);

  // Keep the input in sync with the URL (browser back/forward)
  useEffect(() => {
    if (!syncWithUrl) {
      return;
    }

    setValue(getMarketplaceInitialSearchValue({ pathname, searchParams }));
  }, [pathname, searchParams, syncWithUrl]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navigateToHref = useCallback((href: string) => {
    const mode = inferResourcesNavigationMode(href);
    if (mode) {
      beginResourcesNavigation(mode, href);
    }

    setIsDropdownOpen(false);
    setActiveIndex(-1);
    startTransition(() => {
      router.push(href);
    });
  }, [router, startTransition]);

  const navigateToResource = useCallback((slug: string) => {
    const href = routes.resource(slug);
    beginResourcesNavigation("detail", href);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    startTransition(() => {
      router.push(href);
    });
  }, [router, startTransition]);

  const loadSearchRecovery = useCallback(async ({
    controller,
    query,
  }: {
    controller: AbortController;
    query: string;
  }) => {
    const recoveryEndpoint = buildMarketplaceSearchRecoveryHref(query);
    if (!recoveryEndpoint || controller.signal.aborted) {
      return null;
    }

    return fetchSearchRecovery<SearchRecoveryData>(recoveryEndpoint);
  }, []);

  useEffect(() => {
    const endpoint = buildMarketplaceSuggestionsHref({
      pathname,
      searchParams,
      query: value,
    });

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;

    if (!endpoint) {
      setResults([]);
      setRecovery(null);
      setIsDropdownOpen(false);
      setIsLoadingResults(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoadingResults(true);
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      void fetchSearchSuggestions<SearchSuggestion, SearchRecoveryData>(endpoint)
        .then(async (payload) => {
          if (controller.signal.aborted) {
            return;
          }

          const nextRecovery =
            payload.data.length === 0
              ? await loadSearchRecovery({
                  controller,
                  query: value,
                })
              : null;

          if (controller.signal.aborted) {
            return;
          }

          setResults(payload.data ?? []);
          setRecovery(nextRecovery);
          setIsDropdownOpen(true);
          setActiveIndex(-1);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          console.error("[HERO_SEARCH_SUGGESTIONS]", error);
          setResults([]);
          setRecovery(null);
          setIsDropdownOpen(true);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (fetchAbortRef.current === controller) {
            fetchAbortRef.current = null;
          }
          setIsLoadingResults(false);
        });
    }, 220);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = null;
    };
  }, [loadSearchRecovery, pathname, searchParams, value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    const activeResult = activeIndex >= 0 ? results[activeIndex] : null;
    if (activeResult) {
      navigateToResource(activeResult.slug);
      return;
    }

    const href = buildMarketplaceSearchHref({
      pathname,
      searchParams,
      query: value,
    });

    if (!value.trim() && !syncWithUrl) {
      setIsDropdownOpen(false);
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    navigateToHref(href);
  }

  function handleClear() {
    setValue("");
    setResults([]);
    setRecovery(null);
    setActiveIndex(-1);
    setIsDropdownOpen(false);

    if (isPending || !syncWithUrl) {
      inputRef.current?.focus();
      return;
    }

    navigateToHref(
      buildMarketplaceClearSearchHref({
        pathname,
        searchParams,
      }),
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isDropdownOpen) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, results.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, -1));
      return;
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  }

  const showDropdown =
    isDropdownOpen &&
    value.trim().length > 0 &&
    (isLoadingResults || results.length > 0 || value.trim().length >= 2);

  function renderSuggestedQueries() {
    if (!recovery?.suggestedQueries?.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          Try these searches
        </p>
        <div className="flex flex-wrap gap-2">
          {recovery.suggestedQueries.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                navigateToHref(
                  buildMarketplaceSearchHref({
                    pathname,
                    searchParams,
                    query: suggestion,
                  }),
                )
              }
              className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-text-primary transition hover:border-surface-300 hover:bg-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderTaxonomyBrowse() {
    if (!recovery || (!recovery.categoryMatches.length && !recovery.tagMatches.length)) {
      return null;
    }

    return (
      <div className="space-y-3">
        {recovery.categoryMatches.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Browse categories
            </p>
            <div className="flex flex-wrap gap-2">
              {recovery.categoryMatches.map((match) => (
                <button
                  key={`category-${match.slug}`}
                  type="button"
                  onClick={() => navigateToHref(routes.marketplaceCategory(match.slug))}
                  className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
                >
                  {match.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {recovery.tagMatches.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Related tags
            </p>
            <div className="flex flex-wrap gap-2">
              {recovery.tagMatches.slice(0, 4).map((match) => (
                <button
                  key={`tag-${match.slug}`}
                  type="button"
                  onClick={() => navigateToHref(routes.marketplaceTag(match.slug))}
                  className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
                >
                  #{match.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderDropdown() {
    if (!showDropdown) {
      return null;
    }

    if (results.length === 0 && !isLoadingResults) {
      return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-slate-900/8">
          <div className="space-y-4 px-4 py-4">
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
              ยังไม่พบผลลัพธ์ที่ตรงกับ “{value.trim()}”
              </p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                ลองใช้คำที่กว้างขึ้น หรือข้ามไปดูหมวดที่ใกล้เคียงแทน
              </p>
            </div>

            {renderSuggestedQueries()}
            {renderTaxonomyBrowse()}
          </div>
          <button
            type="button"
            onClick={() =>
              navigateToHref(
                buildMarketplaceSearchHref({
                  pathname,
                  searchParams,
                  query: value,
                }),
              )
            }
            className="flex w-full items-center justify-center gap-2 border-t border-surface-100 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-surface-50"
          >
            <Search className="h-4 w-4" />
            ดูผลลัพธ์ทั้งหมด
          </button>
        </div>
      );
    }

    return (
      <div
        id={listboxId}
        role="listbox"
        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-slate-900/8"
      >
        <div className="border-b border-surface-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Top matches
          </p>
        </div>

        {results.map((result, index) => {
          const meta = [
            result.category?.name ?? null,
            result.author?.name ?? null,
            result.matchReason ?? null,
          ]
            .filter(Boolean)
            .slice(0, 2)
            .join(" • ");

          return (
            <button
              key={result.id}
              id={`${listboxId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => navigateToResource(result.slug)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                index === activeIndex ? "bg-surface-50" : "hover:bg-surface-50",
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                {result.previewUrl ? (
                  <Image
                    src={result.previewUrl}
                    alt={result.title}
                    width={44}
                    height={44}
                    unoptimized={shouldBypassImageOptimizer(result.previewUrl)}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : (
                  <FileText className="h-4 w-4 text-brand-500" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {result.title}
                </p>
                {meta ? (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {meta}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-text-primary">
                  {result.isFree
                    ? "ฟรี"
                    : new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                        maximumFractionDigits: 0,
                      }).format(result.price / 100)}
                </p>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  เปิดรายละเอียด
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() =>
            navigateToHref(
              buildMarketplaceSearchHref({
                pathname,
                searchParams,
                query: value,
              }),
            )
          }
          className="flex w-full items-center justify-center gap-2 border-t border-surface-100 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-surface-50"
        >
          <Search className="h-4 w-4" />
          ดูผลลัพธ์ทั้งหมดสำหรับ “{value.trim()}”
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full"
        aria-busy={isPending}
      >
        <SearchInput
          ref={inputRef}
          variant={variant === "hero" ? "hero" : "default"}
          type="text"
          role="combobox"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || (value.trim().length >= 2 && !isLoadingResults)) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder={placeholder}
          onClear={handleClear}
          disabled={isPending}
          loading={isPending || isLoadingResults}
          startAdornment={
            variant === "listing" ? (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-[44px] items-center justify-center text-[#94a3b8]">
                <Search className="h-[14px] w-[14px] stroke-[1.75]" aria-hidden />
              </span>
            ) : undefined
          }
          className={cn(
            variant === "listing" &&
              "h-[40px] rounded-[999px] border-[#e2e8f0] bg-white py-[8px] pl-[45px] pr-[45px] text-[16px] font-normal leading-normal tracking-[0px] text-text-primary shadow-none placeholder:text-[#94a3b8] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/15",
            className,
          )}
        />
      </form>

      {renderDropdown()}
    </div>
  );
}
