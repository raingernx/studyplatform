"use client";

import {
  startTransition,
  useEffect,
  useRef,
  type ComponentProps,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const VIEWPORT_ROOT_MARGIN = "220px";
const DEFAULT_INTENT_PREFETCH_LIMIT = 8;
const DEFAULT_VIEWPORT_PREFETCH_LIMIT = 2;
const CLIENT_PERFORMANCE_DEBUG_LOGS_ENABLED =
  process.env.NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS === "1";

type PrefetchScopeState = {
  count: number;
  hrefs: Set<string>;
};

const prefetchedHrefScopes = new Map<string, PrefetchScopeState>();

type IntentPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch"> & {
  href: string;
  prefetchMode?: "intent" | "viewport" | "none";
  prefetchScope?: string;
  prefetchLimit?: number;
};

function getScopeState(scopeKey: string) {
  let state = prefetchedHrefScopes.get(scopeKey);

  if (!state) {
    state = { count: 0, hrefs: new Set<string>() };
    prefetchedHrefScopes.set(scopeKey, state);
  }

  return state;
}

function logPrefetchEvent(event: string, details: Record<string, unknown>) {
  if (!CLIENT_PERFORMANCE_DEBUG_LOGS_ENABLED) {
    return;
  }

  console.info(`[PREFETCH] ${event}`, details);
}

export function IntentPrefetchLink({
  prefetchMode = "intent",
  href,
  onMouseEnter,
  onFocus,
  onTouchStart,
  prefetchScope = "default",
  prefetchLimit,
  ...props
}: IntentPrefetchLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const prefetchedRef = useRef(false);
  const effectivePrefetchLimit =
    prefetchLimit ??
    (prefetchMode === "viewport"
      ? DEFAULT_VIEWPORT_PREFETCH_LIMIT
      : DEFAULT_INTENT_PREFETCH_LIMIT);
  const scopeKey = `${pathname ?? "unknown"}:${prefetchScope}`;

  function prefetch() {
    if (prefetchedRef.current) {
      logPrefetchEvent("skip_local_dedupe", {
        href,
        mode: prefetchMode,
        scopeKey,
      });
      return;
    }

    const scopeState = getScopeState(scopeKey);

    if (scopeState.hrefs.has(href)) {
      prefetchedRef.current = true;
      logPrefetchEvent("skip_global_dedupe", {
        href,
        mode: prefetchMode,
        scopeKey,
      });
      return;
    }

    if (scopeState.count >= effectivePrefetchLimit) {
      logPrefetchEvent("skip_scope_limit", {
        href,
        mode: prefetchMode,
        prefetchLimit: effectivePrefetchLimit,
        scopeKey,
      });
      return;
    }

    prefetchedRef.current = true;
    scopeState.hrefs.add(href);
    scopeState.count += 1;
    logPrefetchEvent("prefetch", {
      href,
      mode: prefetchMode,
      prefetchLimit: effectivePrefetchLimit,
      scopeKey,
      scopeCount: scopeState.count,
    });
    startTransition(() => {
      router.prefetch(href);
    });
  }

  useEffect(() => {
    if (prefetchMode !== "viewport") {
      return;
    }

    const node = linkRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          prefetch();
          observer.disconnect();
        }
      },
      { rootMargin: VIEWPORT_ROOT_MARGIN },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefetchMode, href]);

  return (
    <Link
      {...props}
      ref={linkRef}
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (prefetchMode !== "none") {
          prefetch();
        }
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (prefetchMode !== "none") {
          prefetch();
        }
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (prefetchMode !== "none") {
          prefetch();
        }
      }}
    />
  );
}
