"use client";

/**
 * LiveSearch
 *
 * A floating search-as-you-type component backed by GET /api/search.
 * Debounces input (300ms) to avoid hammering the API on every keystroke.
 * Renders a dropdown of matching resources; pressing Enter or clicking a
 * result navigates directly to that resource's detail page.
 *
 * Usage:
 *   <LiveSearch placeholder="Search resources…" />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";
import Image from "next/image";
import { SearchInput } from "@/design-system";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id:            string;
  title:         string;
  slug:          string;
  price:         number;
  isFree:        boolean;
  downloadCount: number;
  previewUrl:    string | null;
  category:      { name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("th-TH", {
    style:    "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LiveSearchProps {
  placeholder?: string;
  className?:   string;
  autoFocus?:   boolean;
}

export function LiveSearch({
  placeholder = "Search resources…",
  className   = "",
  autoFocus   = false,
}: LiveSearchProps) {
  const router = useRouter();

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [active,  setActive]  = useState(-1); // keyboard-selected index

  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced fetch ───────────────────────────────────────────────────────

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json() as { data?: SearchResult[] };
      setResults(json.data ?? []);
      setOpen(true);
      setActive(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // ── Close on outside click ────────────────────────────────────────────────

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) {
        navigate(results[active].slug);
      } else if (query.trim()) {
        // Fall back to marketplace filter search
        router.push(routes.marketplaceSearch(query.trim()));
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function navigate(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(routes.resource(slug));
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <SearchInput
        ref={inputRef}
        type="text"
        value={query}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Search resources"
        aria-autocomplete="list"
        aria-expanded={open}
        loading={loading}
        onClear={handleClear}
      />

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border-subtle bg-white shadow-xl"
        >
          {results.map((r, i) => (
            <button
              key={r.id}
              role="option"
              aria-selected={i === active}
              onClick={() => navigate(r.slug)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 ${
                i === active ? "bg-neutral-50" : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-violet-50">
                {r.previewUrl ? (
                  <Image
                    src={r.previewUrl}
                    alt={r.title}
                    width={36}
                    height={36}
                    unoptimized={shouldBypassImageOptimizer(r.previewUrl)}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                ) : (
                  <FileText className="h-4 w-4 text-blue-400" />
                )}
              </div>

              {/* Title + category */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-text-primary">
                  {r.title}
                </p>
                {r.category && (
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {r.category.name}
                  </p>
                )}
              </div>

              {/* Price */}
              <span className="flex-shrink-0 text-[12px] font-bold text-neutral-700">
                {r.isFree ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  formatPrice(r.price)
                )}
              </span>
            </button>
          ))}

          {/* "See all results" footer */}
          <button
            onClick={() => {
              router.push(routes.marketplaceSearch(query.trim()));
              setOpen(false);
            }}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-50"
          >
            <Search className="h-3 w-3" />
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}

      {/* No results */}
      {open && !loading && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border-subtle bg-white px-4 py-4 shadow-xl">
          <p className="text-center text-[13px] text-text-muted">
            No resources found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
