"use client";

import { useEffect, useState } from "react";

type UseFetchJsonOptions = {
  url: string;
  enabled?: boolean;
  ttlMs?: number;
  cacheKey?: string;
};

type UseFetchJsonState<T> = {
  data: T | null;
  isReady: boolean;
};

type FetchJsonCacheEntry = {
  data: unknown;
  expiresAt: number;
};

const fetchJsonCache = new Map<string, FetchJsonCacheEntry>();
const fetchJsonInFlight = new Map<string, Promise<unknown>>();

function getCacheEntry<T>(key: string, ttlMs: number): { hit: boolean; data: T | null } {
  if (ttlMs <= 0) {
    return { hit: false, data: null };
  }

  const entry = fetchJsonCache.get(key);
  if (!entry) {
    return { hit: false, data: null };
  }

  if (entry.expiresAt <= Date.now()) {
    fetchJsonCache.delete(key);
    return { hit: false, data: null };
  }

  return {
    hit: true,
    data: (entry.data as T | null) ?? null,
  };
}

async function loadFetchJson<T>(url: string, cacheKey: string, ttlMs: number): Promise<T | null> {
  const cached = getCacheEntry<T>(cacheKey, ttlMs);
  if (cached.hit) {
    return cached.data;
  }

  const existing = fetchJsonInFlight.get(cacheKey) as Promise<T | null> | undefined;
  if (existing) {
    return existing;
  }

  const promise = fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${url}`);
      }

      const json = (await response.json()) as { data?: T | null };
      const data = json.data ?? null;

      if (ttlMs > 0) {
        fetchJsonCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + ttlMs,
        });
      }

      return data;
    })
    .finally(() => {
      fetchJsonInFlight.delete(cacheKey);
    });

  fetchJsonInFlight.set(cacheKey, promise);
  return promise;
}

export function clearFetchJsonCache() {
  fetchJsonCache.clear();
  fetchJsonInFlight.clear();
}

export function useFetchJson<T>({
  url,
  enabled = true,
  ttlMs = 0,
  cacheKey,
}: UseFetchJsonOptions): UseFetchJsonState<T> {
  const resolvedCacheKey = cacheKey ?? url;
  const [state, setState] = useState<UseFetchJsonState<T>>(() => {
    if (!enabled) {
      return {
        data: null,
        isReady: true,
      };
    }

    const cached = getCacheEntry<T>(resolvedCacheKey, ttlMs);
    return {
      data: cached.data,
      isReady: cached.hit,
    };
  });

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setState({
        data: null,
        isReady: true,
      });
      return () => {
        cancelled = true;
      };
    }

    const cached = getCacheEntry<T>(resolvedCacheKey, ttlMs);
    if (cached.hit) {
      setState({
        data: cached.data,
        isReady: true,
      });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({
      data: current.data,
      isReady: false,
    }));

    void loadFetchJson<T>(url, resolvedCacheKey, ttlMs)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setState({
          data,
          isReady: true,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("[USE_FETCH_JSON]", error);
        setState({
          data: null,
          isReady: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, resolvedCacheKey, ttlMs, url]);

  return state;
}
