"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { RECOMMENDATION_EXPERIMENT_ID, type RecommendationVariant } from "@/lib/recommendations/experiment";

interface RecommendationSectionProps {
  /**
   * Experiment variant assigned to this user.
   * Null means the user is a guest or has no history — click events are still
   * fired but will have no userId on the server side.
   */
  variant: RecommendationVariant | null;
  /** Section identifier recorded with every click event. */
  section: string;
  resourceIds: string[];
  children: React.ReactNode;
}

const recommendationImpressionSessionKeys = new Set<string>();

/**
 * Thin client wrapper around a recommendation grid.
 *
 * - Intercepts click events via event delegation (no changes to ResourceCard).
 * - Reads `data-resource-id` from the closest ancestor element of the click target.
 * - POSTs to /api/recommendations/click with experiment context (fire-and-forget).
 * - In development only: renders a tiny variant badge below the grid.
 */
export function RecommendationSection({
  variant,
  section,
  resourceIds,
  children,
}: RecommendationSectionProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!variant || resourceIds.length === 0 || typeof window === "undefined") {
      return;
    }

    const sessionKey =
      `recommendation-impression:${pathname}:${section}:${variant}:${resourceIds.join(",")}`;
    if (
      recommendationImpressionSessionKeys.has(sessionKey) ||
      window.sessionStorage.getItem(sessionKey)
    ) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    let sent = false;

    const sendImpression = () => {
      if (sent) {
        return;
      }

      sent = true;
      recommendationImpressionSessionKeys.add(sessionKey);
      window.sessionStorage.setItem(sessionKey, "1");

      void fetch("/api/recommendations/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds,
          experiment: RECOMMENDATION_EXPERIMENT_ID,
          variant,
          section,
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    if (typeof window.IntersectionObserver !== "function") {
      sendImpression();
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          sendImpression();
          observer.disconnect();
        }
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [pathname, resourceIds, section, variant]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!variant) return;

    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-resource-id]");
    if (!el?.dataset.resourceId) return;

    void fetch("/api/recommendations/click", {
      method:    "POST",
      headers:   { "Content-Type": "application/json" },
      body:      JSON.stringify({
        resourceId: el.dataset.resourceId,
        experiment: RECOMMENDATION_EXPERIMENT_ID,
        variant,
        section,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <div ref={rootRef} onClick={handleClick}>
      {children}
      {process.env.NODE_ENV === "development" && variant && (
        <p className="mt-1 text-[10px] text-zinc-400">
          [dev] rec experiment: {RECOMMENDATION_EXPERIMENT_ID} · variant: {variant}
        </p>
      )}
    </div>
  );
}
