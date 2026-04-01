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
};

const EMPTY_AUTH_VIEWER: AuthViewerPayload = {
  authenticated: false,
  user: null,
};

let cachedViewer: AuthViewerPayload | null = null;
let inFlightViewer: Promise<AuthViewerPayload> | null = null;

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

function loadAuthViewer() {
  if (cachedViewer) {
    return Promise.resolve(cachedViewer);
  }

  if (!inFlightViewer) {
    inFlightViewer = fetchAuthViewer()
      .then((viewer) => {
        cachedViewer = viewer;
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
  clearFetchJsonCache();
}

export function primeAuthViewer() {
  return loadAuthViewer().catch((error) => {
    console.error("[AUTH_VIEWER_HOOK]", error);
    return EMPTY_AUTH_VIEWER;
  });
}

export function useAuthViewer(options: UseAuthViewerOptions = {}): AuthViewerState {
  const {
    strategy = "eager",
    idleTimeoutMs = 800,
  } = options;
  const [state, setState] = useState<AuthViewerState>(() => ({
    ...EMPTY_AUTH_VIEWER,
    isReady: false,
  }));

  useEffect(() => {
    let cancelled = false;

    if (cachedViewer) {
      setState({
        ...cachedViewer,
        isReady: true,
      });
      return () => {
        cancelled = true;
      };
    }

    const runLoad = () => {
      void loadAuthViewer()
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

          console.error("[AUTH_VIEWER_HOOK]", error);
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
