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
import type { ResourceDetailViewerBaseState } from "@/lib/resources/resource-detail-viewer-state";

type ResourceDetailViewerContextValue = ResourceDetailViewerBaseState & {
  isReady: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_VIEWER_STATE: ResourceDetailViewerContextValue = {
  authenticated: false,
  userId: null,
  subscriptionStatus: null,
  isOwned: false,
  isReady: false,
  refresh: async () => {},
};

const ResourceDetailViewerStateContext =
  createContext<ResourceDetailViewerContextValue>(EMPTY_VIEWER_STATE);

export function ResourceDetailViewerStateProvider({
  children,
  resourceId,
}: {
  children: ReactNode;
  resourceId: string;
}) {
  const authViewer = useAuthViewer();
  const [viewerState, setViewerState] = useState<ResourceDetailViewerBaseState>({
    authenticated: false,
    userId: null,
    subscriptionStatus: null,
    isOwned: false,
  });
  const [isReady, setIsReady] = useState(false);
  const shouldLoadViewerState = authViewer.isReady && authViewer.authenticated;

  const load = useCallback(async (options?: { fresh?: boolean }) => {
    const params = new URLSearchParams();
    params.set("scope", "base");
    if (options?.fresh) {
      params.set("fresh", "1");
    }

    const query = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`/api/resources/${resourceId}/viewer-state${query}`, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Failed to load resource detail viewer state");
    }

    const json = (await response.json()) as { data?: ResourceDetailViewerBaseState };
    if (json.data) {
      setViewerState(json.data);
    }
  }, [resourceId]);

  useEffect(() => {
    let cancelled = false;

    setIsReady(false);

    if (authViewer.isReady && !authViewer.authenticated) {
      setViewerState({
        authenticated: false,
        userId: null,
        subscriptionStatus: null,
        isOwned: false,
      });
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
        setViewerState({
          authenticated: false,
          userId: null,
          subscriptionStatus: null,
          isOwned: false,
        });
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
      setViewerState({
        authenticated: false,
        userId: null,
        subscriptionStatus: null,
        isOwned: false,
      });
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
