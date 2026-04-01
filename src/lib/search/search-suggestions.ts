"use client";

type SearchSuggestionsResponse<TData, TRecovery> = {
  data: TData[];
  recovery: TRecovery | null;
};

type SuggestionsCacheEntry = {
  data: unknown;
  expiresAt: number;
};

const searchSuggestionsCache = new Map<string, SuggestionsCacheEntry>();
const searchSuggestionsInFlight = new Map<string, Promise<unknown>>();

function getSuggestionsCacheEntry<TData, TRecovery>(
  key: string,
  ttlMs: number,
): SearchSuggestionsResponse<TData, TRecovery> | null {
  if (ttlMs <= 0) {
    return null;
  }

  const entry = searchSuggestionsCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    searchSuggestionsCache.delete(key);
    return null;
  }

  return entry.data as SearchSuggestionsResponse<TData, TRecovery>;
}

export async function fetchSearchSuggestions<TData, TRecovery>(
  url: string,
  ttlMs = 15_000,
): Promise<SearchSuggestionsResponse<TData, TRecovery>> {
  const cached = getSuggestionsCacheEntry<TData, TRecovery>(url, ttlMs);
  if (cached) {
    return cached;
  }

  const existing = searchSuggestionsInFlight.get(url) as
    | Promise<SearchSuggestionsResponse<TData, TRecovery>>
    | undefined;
  if (existing) {
    return existing;
  }

  const promise = fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("SEARCH_SUGGESTIONS_FAILED");
      }

      const payload = (await response.json()) as {
        data?: TData[];
        recovery?: TRecovery | null;
      };
      const normalizedPayload: SearchSuggestionsResponse<TData, TRecovery> = {
        data: payload.data ?? [],
        recovery: payload.recovery ?? null,
      };

      if (ttlMs > 0) {
        searchSuggestionsCache.set(url, {
          data: normalizedPayload,
          expiresAt: Date.now() + ttlMs,
        });
      }

      return normalizedPayload;
    })
    .finally(() => {
      searchSuggestionsInFlight.delete(url);
    });

  searchSuggestionsInFlight.set(url, promise);
  return promise;
}

export async function fetchSearchRecovery<TRecovery>(
  url: string,
  ttlMs = 15_000,
): Promise<TRecovery | null> {
  const cached = getSuggestionsCacheEntry<never, TRecovery>(url, ttlMs);
  if (cached) {
    return cached.recovery;
  }

  const existing = searchSuggestionsInFlight.get(url) as Promise<TRecovery | null> | undefined;
  if (existing) {
    return existing;
  }

  const promise = fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("SEARCH_RECOVERY_FAILED");
      }

      const payload = (await response.json()) as {
        data?: TRecovery | null;
      };
      const recovery = payload.data ?? null;

      if (ttlMs > 0) {
        searchSuggestionsCache.set(url, {
          data: {
            data: [],
            recovery,
          } satisfies SearchSuggestionsResponse<never, TRecovery>,
          expiresAt: Date.now() + ttlMs,
        });
      }

      return recovery;
    })
    .finally(() => {
      searchSuggestionsInFlight.delete(url);
    });

  searchSuggestionsInFlight.set(url, promise);
  return promise;
}
