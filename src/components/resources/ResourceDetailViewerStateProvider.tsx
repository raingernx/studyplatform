"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthViewer } from "@/lib/auth/use-auth-viewer";
import { fetchJson } from "@/lib/use-fetch-json";
import type { ResourceDetailViewerBaseState } from "@/lib/resources/resource-detail-viewer-state";

type ResourceDetailViewerContextValue = ResourceDetailViewerBaseState & {
  isReady: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE: ResourceDetailViewerBaseState = {
  authenticated: false,
  userId: null,
  subscriptionStatus: null,
  isOwned: false,
};

const EMPTY_VIEWER_STATE: ResourceDetailViewerContextValue = {
  ...EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE,
  isReady: false,
  refresh: async () => {},
};

const ResourceDetailViewerStateContext =
  createContext<ResourceDetailViewerContextValue>(EMPTY_VIEWER_STATE);

const RESOURCE_DETAIL_VIEWER_BASE_TTL_MS = 15_000;

export function ResourceDetailViewerStateProvider({
  children,
  resourceId,
}: {
  children: ReactNode;
  resourceId: string;
}) {
  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const [viewerState, setViewerState] = useState<ResourceDetailViewerBaseState>(
    EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE,
  );
  const [isReady, setIsReady] = useState(false);
  const shouldLoadViewerState = authViewer.isReady && authViewer.authenticated;
  const viewerCacheKey =
    authViewer.user?.id
      ? `resource-detail-viewer-base:${resourceId}:${authViewer.user.id}`
      : null;

  const load = useCallback(async (options?: { fresh?: boolean }) => {
    if (!viewerCacheKey) {
      setViewerState(EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE);
      return;
    }

    const params = new URLSearchParams();
    params.set("scope", "base");
    if (options?.fresh) {
      params.set("fresh", "1");
    }

    const query = params.size > 0 ? `?${params.toString()}` : "";
    const data = await fetchJson<ResourceDetailViewerBaseState>({
      url: `/api/resources/${resourceId}/viewer-state${query}`,
      cacheKey: viewerCacheKey,
      ttlMs: RESOURCE_DETAIL_VIEWER_BASE_TTL_MS,
      fresh: options?.fresh,
    });
    setViewerState(data ?? EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE);
  }, [resourceId, viewerCacheKey]);

  useEffect(() => {
    let cancelled = false;

    setIsReady(false);

    if (authViewer.isReady && !authViewer.authenticated) {
      setViewerState(EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE);
      setIsReady(true);
      return () => {
        cancelled = true;
      };
    }

    if (!shouldLoadViewerState) {
      return () => {
        cancelled = true;
      };
    }

    void load()
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("[RESOURCE_DETAIL_VIEWER_STATE]", error);
        setViewerState(EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE);
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authViewer.authenticated, authViewer.isReady, load, shouldLoadViewerState]);

  const refresh = useCallback(async () => {
    if (!authViewer.authenticated) {
      setViewerState(EMPTY_RESOURCE_DETAIL_VIEWER_BASE_STATE);
      setIsReady(true);
      return;
    }

    setIsReady(false);
    try {
      await load({ fresh: true });
    } finally {
      setIsReady(true);
    }
  }, [authViewer.authenticated, load]);

  const value = useMemo<ResourceDetailViewerContextValue>(
    () => ({
      ...viewerState,
      isReady,
      refresh,
    }),
    [isReady, refresh, viewerState],
  );

  return (
    <ResourceDetailViewerStateContext.Provider value={value}>
      {children}
    </ResourceDetailViewerStateContext.Provider>
  );
}

export function useResourceDetailViewerState() {
  return useContext(ResourceDetailViewerStateContext);
}
