"use client";

import { useEffect, useState } from "react";
import { clearFetchJsonCache } from "@/lib/use-fetch-json";

type AuthViewerUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type AuthViewerPayload = {
  authenticated: boolean;
  user: AuthViewerUser | null;
};

type AuthViewerState = AuthViewerPayload & {
  isReady: boolean;
};

type UseAuthViewerOptions = {
  strategy?: "eager" | "idle";
  idleTimeoutMs?: number;
  hydrateFromCache?: boolean;
};

const EMPTY_AUTH_VIEWER: AuthViewerPayload = {
  authenticated: false,
  user: null,
};
const AUTH_VIEWER_STORAGE_KEY = "krukraft.authViewer";

let cachedViewer: AuthViewerPayload | null = null;
let inFlightViewer: Promise<AuthViewerPayload> | null = null;

type LoadAuthViewerOptions = {
  allowCached?: boolean;
  allowPersisted?: boolean;
};

const DEV_TRANSIENT_FETCH_ERROR_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
];

type IdleCallbackHandle = number;
type IdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallbackScheduler = typeof window & {
  requestIdleCallback?: (
    callback: (deadline: IdleCallbackDeadline) => void,
    options?: { timeout: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

async function fetchAuthViewer() {
  const response = await fetch("/api/auth/viewer", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to load auth viewer");
  }

  const json = (await response.json()) as {
    data?: AuthViewerPayload;
  };

  return json.data ?? EMPTY_AUTH_VIEWER;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readPersistedAuthViewer() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_VIEWER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthViewerPayload | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.authenticated !== "boolean"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistAuthViewer(viewer: AuthViewerPayload) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(AUTH_VIEWER_STORAGE_KEY, JSON.stringify(viewer));
  } catch {
    // Best-effort cache only.
  }
}

function clearPersistedAuthViewer() {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_VIEWER_STORAGE_KEY);
  } catch {
    // Best-effort cache only.
  }
}

function isTransientAuthViewerError(error: unknown) {
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

function reportAuthViewerError(error: unknown) {
  if (
    process.env.NODE_ENV !== "production" &&
    isTransientAuthViewerError(error)
  ) {
    return;
  }

  console.error("[AUTH_VIEWER_HOOK]", error);
}

function loadAuthViewer(options: LoadAuthViewerOptions = {}) {
  const { allowCached = true, allowPersisted = true } = options;

  if (allowCached && cachedViewer) {
    return Promise.resolve(cachedViewer);
  }

  const persistedViewer = allowPersisted ? readPersistedAuthViewer() : null;
  if (allowPersisted && persistedViewer) {
    cachedViewer = persistedViewer;
    return Promise.resolve(persistedViewer);
  }

  if (!inFlightViewer) {
    inFlightViewer = fetchAuthViewer()
      .then((viewer) => {
        cachedViewer = viewer;
        persistAuthViewer(viewer);
        return viewer;
      })
      .finally(() => {
        inFlightViewer = null;
      });
  }

  return inFlightViewer;
}

function scheduleIdleLoad(
  callback: () => void,
  timeoutMs: number,
) {
  const scheduler = window as IdleCallbackScheduler;

  if (typeof scheduler.requestIdleCallback === "function") {
    const handle = scheduler.requestIdleCallback(
      () => callback(),
      { timeout: timeoutMs },
    );

    return () => {
      scheduler.cancelIdleCallback?.(handle);
    };
  }

  const handle = window.setTimeout(callback, timeoutMs);
  return () => {
    window.clearTimeout(handle);
  };
}

export function clearCachedAuthViewer() {
  cachedViewer = null;
  inFlightViewer = null;
  clearPersistedAuthViewer();
  clearFetchJsonCache();
}

export function primeAuthViewer() {
  return loadAuthViewer().catch((error) => {
    reportAuthViewerError(error);
    return EMPTY_AUTH_VIEWER;
  });
}

export function useAuthViewer(options: UseAuthViewerOptions = {}): AuthViewerState {
  const {
    strategy = "eager",
    idleTimeoutMs = 800,
    hydrateFromCache = true,
  } = options;
  const [state, setState] = useState<AuthViewerState>(() => ({
    ...((hydrateFromCache ? cachedViewer : null) ?? EMPTY_AUTH_VIEWER),
    isReady: hydrateFromCache ? Boolean(cachedViewer) : false,
  }));

  useEffect(() => {
    let cancelled = false;

    const persistedViewer = hydrateFromCache ? readPersistedAuthViewer() : null;

    if (hydrateFromCache && !cachedViewer && persistedViewer) {
      cachedViewer = persistedViewer;
    }

    if (hydrateFromCache && cachedViewer) {
      setState({
        ...cachedViewer,
        isReady: true,
      });
    }

    const runLoad = () => {
      void loadAuthViewer(
        hydrateFromCache
          ? undefined
          : {
              allowCached: false,
              allowPersisted: false,
            },
      )
        .then((viewer) => {
          if (cancelled) {
            return;
          }

          setState({
            ...viewer,
            isReady: true,
          });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          reportAuthViewerError(error);
          setState({
            ...EMPTY_AUTH_VIEWER,
            isReady: true,
          });
        });
    };

    const cancelScheduledLoad =
      strategy === "idle"
        ? scheduleIdleLoad(runLoad, idleTimeoutMs)
        : (runLoad(), null);

    return () => {
      cancelled = true;
      cancelScheduledLoad?.();
    };
  }, [idleTimeoutMs, strategy]);

  return state;
}
