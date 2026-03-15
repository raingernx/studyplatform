"use client";

import { useEffect } from "react";

const HERO_AB_COOKIE_NAME = "hero_ab_seed";

interface HeroImpressionTrackerProps {
  heroId?: string | null;
  experimentId?: string | null;
  variant?: string | null;
}

function ensureAbSeedCookie() {
  if (typeof document === "undefined") {
    return;
  }

  const hasSeed = document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${HERO_AB_COOKIE_NAME}=`));

  if (hasSeed) {
    return;
  }

  const seed =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${HERO_AB_COOKIE_NAME}=${seed}; path=/; max-age=${maxAge}; samesite=lax`;
}

function persistExperimentVariant(experimentId: string, variant: string) {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `hero_exp_${experimentId}=${variant}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function HeroImpressionTracker({
  heroId,
  experimentId,
  variant,
}: HeroImpressionTrackerProps) {
  useEffect(() => {
    if (!heroId) {
      return;
    }

    ensureAbSeedCookie();

    if (experimentId && variant) {
      persistExperimentVariant(experimentId, variant);
    }

    const storageKey = `hero-impression:${heroId}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }

    void fetch("/api/hero/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroId,
        experimentId: experimentId ?? null,
        variant: variant ?? null,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [experimentId, heroId, variant]);

  return null;
}
