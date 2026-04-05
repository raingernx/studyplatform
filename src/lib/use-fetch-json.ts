"use client";

import { useEffect, useState } from "react";

type UseFetchJsonOptions = {
  url: string;
  enabled?: boolean;
  ttlMs?: number;
  cacheKey?: string;
};

type FetchJsonOptions = {
  url: string;
  ttlMs?: number;
  cacheKey?: string;
  fresh?: boolean;
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
const DEV_TRANSIENT_FETCH_ERROR_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
];

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

function writeCacheEntry<T>(cacheKey: string, data: T | null, ttlMs: number) {
  if (ttlMs <= 0) {
    fetchJsonCache.delete(cacheKey);
    return;
  }

  fetchJsonCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

async function requestJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  const json = (await response.json()) as { data?: T | null };
  return json.data ?? null;
}

function isTransientFetchJsonError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "AbortError" ||
    DEV_TRANSIENT_FETCH_ERROR_PATTERNS.some((pattern) =>
      pattern.test(error.message),
    )
  );
}

function reportFetchJsonError(error: unknown) {
  if (
    process.env.NODE_ENV !== "production" &&
    isTransientFetchJsonError(error)
  ) {
    return;
  }

  console.error("[USE_FETCH_JSON]", error);
}

async function loadFetchJson<T>(
  url: string,
  cacheKey: string,
  ttlMs: number,
  options?: { fresh?: boolean },
): Promise<T | null> {
  const fresh = options?.fresh ?? false;

  if (!fresh) {
    const cached = getCacheEntry<T>(cacheKey, ttlMs);
    if (cached.hit) {
      return cached.data;
    }

    const existing = fetchJsonInFlight.get(cacheKey) as Promise<T | null> | undefined;
    if (existing) {
      return existing;
    }
  }

  const promise = requestJson<T>(url)
    .then((data) => {
      writeCacheEntry(cacheKey, data, ttlMs);
      return data;
    })
    .finally(() => {
      if (!fresh) {
        fetchJsonInFlight.delete(cacheKey);
      }
    });

  if (!fresh) {
    fetchJsonInFlight.set(cacheKey, promise);
  }

  return promise;
}

export function clearFetchJsonCache() {
  fetchJsonCache.clear();
  fetchJsonInFlight.clear();
}

export async function fetchJson<T>({
  url,
  ttlMs = 0,
  cacheKey,
  fresh = false,
}: FetchJsonOptions): Promise<T | null> {
  const resolvedCacheKey = cacheKey ?? url;
  return loadFetchJson<T>(url, resolvedCacheKey, ttlMs, { fresh });
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

        reportFetchJsonError(error);
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
