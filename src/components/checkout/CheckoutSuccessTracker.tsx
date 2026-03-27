"use client";

import { useEffect } from "react";

interface CheckoutSuccessTrackerProps {
  /** Resource slug from the `?slug=` query param, if present. */
  slug?: string;
}

/**
 * Invisible client component mounted on the checkout success page.
 * Fires a single CHECKOUT_SUCCESS_PAGE_VIEWED event on mount via a
 * non-blocking POST to /api/analytics/activity.
 *
 * keepalive: true ensures the request completes even if the user navigates
 * away from the success page immediately (e.g. clicks "Check My Library").
 */
export function CheckoutSuccessTracker({ slug }: CheckoutSuccessTrackerProps) {
  useEffect(() => {
    void fetch("/api/analytics/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CHECKOUT_SUCCESS_PAGE_VIEWED",
        metadata: slug ? { resourceSlug: slug } : {},
      }),
      keepalive: true,
    });
  }, []);

  return null;
}
