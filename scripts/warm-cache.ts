const baseUrlArg = process.argv[2]?.trim();
const baseUrl =
  process.env.BASE_URL?.trim() ||
  process.env.WARM_BASE_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  baseUrlArg;

const hotSlug =
  process.env.HOT_SLUG?.trim() ||
  "middle-school-science-quiz-assessment-set";

// 15 s gives the recommended listing's multi-CTE SQL enough time to complete
// on a cold Vercel instance (~7 s observed) and write its result to Redis
// before k6 performance tests run.  The previous 5 s limit caused the warm
// request to abort early, leaving Redis empty and triggering a cross-instance
// thundering herd during the k6 ramp.  This timeout only applies to the CI
// warm step — it has no effect on the hot request path.
const timeoutMs = 15000;
const userAgent = "KruCraft-Warmup/1.0";

if (!baseUrl) {
  console.error(
    "[warm-cache] Missing base URL. Set BASE_URL or pass it as the first CLI argument.",
  );
  process.exit(1);
}

type WarmRoute = {
  label: string;
  path: string;
  /** Extra request headers forwarded verbatim. Used to simulate experiment
   *  cookie state so the warm request exercises the same effectiveSort branch
   *  that CI smoke tests use. */
  headers?: Record<string, string>;
  /**
   * When true the CI step exits non-zero if this specific route fails, even
   * if other routes succeed.  Use for routes whose cache must be warm before
   * the smoke suite starts.
   */
  required?: boolean;
};

const routes: WarmRoute[] = [
  {
    label: "resources-home",
    path: "/resources",
  },
  {
    label: "listing-default",
    path: "/resources?category=all",
    required: true,
  },
  {
    label: "listing-trending",
    path: "/resources?category=all&sort=trending",
  },
  {
    label: "listing-recommended",
    path: "/resources?category=all&sort=recommended",
    // ranking_variant=B → effectiveSort="recommended" in page.tsx.
    // Without this cookie the route silently falls back to effectiveSort="newest",
    // warming the wrong cache key and leaving the "recommended" Redis entry cold.
    headers: { Cookie: "ranking_variant=B" },
    // Keep the treatment path warm for ranking experiments, but do not block
    // deploy follow-up tasks on the heaviest query path.  The main production
    // UX should prioritize the default listing route first.
  },
  {
    label: "listing-newest",
    path: "/resources?category=all&sort=newest",
  },
  {
    label: "resource-detail-hot",
    path: `/resources/${encodeURIComponent(hotSlug)}`,
  },
];

type WarmResult = {
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  bodyBytes: number | null;
  error?: string;
};

async function warmRoute(route: WarmRoute): Promise<WarmResult> {
  const url = new URL(route.path, baseUrl);
  const startedAt = Date.now();

  if (route.headers?.Cookie) {
    console.log(
      `[warm-cache] ${route.label}: sending Cookie: ${route.headers.Cookie}`,
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": userAgent,
        ...route.headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Drain the response body before returning.
    //
    // For Next.js App Router routes that use RSC streaming, the HTTP response
    // headers (status 200) arrive early — well before the expensive server-side
    // work (e.g. the activation-ranking multi-CTE SQL) has run.  The SQL, and
    // the Redis write that follows it, happen during the streaming body phase.
    //
    // Without this read, `await fetch()` resolves as soon as headers arrive
    // (~100 ms) and the warm script exits while the 7-s SQL is still running.
    // The Node.js process may exit before the server finishes the Redis write,
    // leaving the cache cold and causing the smoke-test p95 to hit the raw SQL.
    //
    // Consuming the body guarantees that:
    //   1. The RSC stream has fully flushed.
    //   2. All server-side service calls (including the Redis rememberJson write)
    //      have completed before we mark this route as warm.
    let bodyBytes: number | null = null;
    try {
      const body = await response.text();
      bodyBytes = body.length;
    } catch {
      // Body read failure is non-fatal — the status check already captured
      // whether the route responded correctly.
    }

    return {
      label: route.label,
      url: url.toString(),
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      bodyBytes,
    };
  } catch (error) {
    return {
      label: route.label,
      url: url.toString(),
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      bodyBytes: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(
    `[warm-cache] Starting public cache warm-up against ${baseUrl} (${routes.length} routes)`,
  );

  const results: WarmResult[] = [];

  for (const route of routes) {
    console.log(`[warm-cache] Warming ${route.label}: ${route.path}`);
    const result = await warmRoute(route);
    results.push(result);

    if (result.ok) {
      console.log(
        `[warm-cache] OK ${result.status} ${result.label} ${result.elapsedMs}ms bodyBytes=${result.bodyBytes ?? "n/a"}`,
      );
    } else {
      console.warn(
        `[warm-cache] FAIL ${result.status ?? "ERR"} ${result.label} ${result.elapsedMs}ms${result.error ? ` ${result.error}` : ""}`,
      );
    }
  }

  const successCount = results.filter((result) => result.ok).length;
  const failureCount = results.length - successCount;

  console.log(
    `[warm-cache] Completed: ${successCount} succeeded, ${failureCount} failed`,
  );

  // Exit non-zero if any required route failed.  These are routes whose Redis
  // key MUST be warm before the smoke suite starts — a partial-failure exit(0)
  // would let CI proceed with a cold cache, producing a false p95 regression.
  const failedRequired = results.filter(
    (result) => !result.ok && routes.find((route) => route.label === result.label)?.required,
  );
  if (failedRequired.length > 0) {
    console.error(
      `[warm-cache] Required routes failed — aborting to prevent cold smoke run: ${failedRequired.map((result) => result.label).join(", ")}`,
    );
    process.exit(1);
  }

  if (successCount === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[warm-cache] Unexpected error", error);
  process.exit(1);
});

export {};
