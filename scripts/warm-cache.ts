const baseUrlArg = process.argv[2]?.trim();
const baseUrl =
  process.env.BASE_URL?.trim() ||
  process.env.WARM_BASE_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  baseUrlArg;

const hotSlug =
  process.env.HOT_SLUG?.trim() ||
  "middle-school-science-quiz-assessment-set";
const hotCreator =
  process.env.HOT_CREATOR?.trim() ||
  "kru-mint";
const categorySlug = process.env.CATEGORY?.trim() || "science";

const warmSecret = process.env.PERFORMANCE_WARM_SECRET?.trim();

// 15 s gives the recommended listing's multi-CTE SQL enough time to complete
// on a cold Vercel instance (~7 s observed) and write its result to Redis
// before k6 performance tests run.  The previous 5 s limit caused the warm
// request to abort early, leaving Redis empty and triggering a cross-instance
// thundering herd during the k6 ramp.  This timeout only applies to the CI
// warm step — it has no effect on the hot request path.
const timeoutMs = 15000;
const userAgent = "Krukraft-Warmup/1.0";

if (!baseUrl) {
  console.error(
    "[warm-cache] Missing base URL. Set BASE_URL or pass it as the first CLI argument.",
  );
  process.exit(1);
}

type WarmRoute = {
  label: string;
  path: string;
  /**
   * Repeat the same warm request multiple times when the route is prone to
   * post-deploy cold starts across successive compute instances.
   */
  repeat?: number;
  /**
   * Fire multiple warm requests at once for routes that can fan out onto
   * fresh compute instances during the later k6 ramp. Sequential repeats warm
   * only one hot instance; a small burst reduces cross-instance cold tails.
   */
  burst?: number;
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
    // Hit the public home shell twice so the deployment-status workflow is
    // less likely to hand the k6 smoke suite a just-born instance on its
    // first measured request.
    repeat: 3,
    // k6 ramps `/resources` up to 5 VUs. A small concurrent burst warms more
    // than one fresh instance so the later ramp is less likely to hit an
    // unwarmed discover-home stream on a newly scaled worker.
    burst: 5,
    required: true,
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
    // The smoke suite ramps the treatment/recommended listing to 5 VUs too.
    // A single warm pass left the Redis/data path hot on one worker, but later
    // smoke VUs could still land on fresh instances and spike p95. Treat this
    // route the same way as the control/newest path: repeat the warm pass and
    // match the later smoke fanout up front.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "listing-newest",
    path: "/resources?category=all&sort=newest",
    // The smoke suite ramps the control/newest listing to 5 VUs. A burst of 3
    // still left room for 1-2 fresh instances to take their first hit during
    // k6 and spike p95 even though the Redis listing query itself was already
    // warm. Match the warm burst to the later smoke-VU ceiling so the page
    // shell and query path are both hot across the small fresh-instance fanout.
    burst: 5,
    repeat: 3,
    required: true,
  },
  {
    label: "resource-detail-hot",
    path: `/resources/${encodeURIComponent(hotSlug)}`,
    // Resource detail smoke also ramps to 5 VUs. A single warm hit can still
    // leave one late fresh instance cold during k6 even when the shell/data
    // caches are otherwise aligned, so burst-align the hot detail route too.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "creator-detail-hot",
    path: `/creators/${encodeURIComponent(hotCreator)}`,
    // The creator detail smoke route ramps to 5 VUs. Sequential warms still
    // leave room for fresh instances to serve their first creator-page hit
    // during k6, which shows up as a p95 tail even though the main profile
    // cache is already hot on one worker. Match the smoke fanout up front.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "category-listing",
    path: `/categories/${encodeURIComponent(categorySlug)}`,
    // Category listing uses the same 5-VU smoke ramp as creator/newest. Warm
    // it with the same concurrent fanout so one cold worker does not take its
    // first category render during k6 and spike p95.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "listing-recommended-tail",
    path: "/resources?category=all&sort=recommended",
    // Reheat the highest-risk listing route immediately before the perf suite
    // starts. In recent failing runs the main warm pass succeeded, but the
    // recommended/newest control routes were no longer the freshest warmed
    // surfaces by the time k6 measured them.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "listing-newest-tail",
    path: "/resources?category=all&sort=newest",
    // Mirror the same end-of-sequence reheat for the control route so both
    // listing variants finish as the last warmed public pages before k6.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "resource-detail-hot-tail",
    path: `/resources/${encodeURIComponent(hotSlug)}`,
    // Reheat the hot detail route immediately before k6 begins so the route
    // that previously showed the most recent post-listing tail failure is not
    // relying only on an earlier warm pass in the sequence.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "category-listing-tail",
    path: `/categories/${encodeURIComponent(categorySlug)}`,
    // Mirror the same tail reheat for the category listing route so every
    // warmed public route class measured by k6 finishes close to suite start.
    burst: 5,
    repeat: 2,
    required: true,
  },
  {
    label: "creator-detail-hot-tail",
    path: `/creators/${encodeURIComponent(hotCreator)}`,
    // Creator detail now finishes the final warm band so the creator smoke
    // arm does not arrive after a later category-tail pass has already become
    // the freshest public route class in the sequence.
    burst: 5,
    repeat: 2,
    required: true,
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

/**
 * Parse priority image URLs out of an HTML string and request each one so the
 * Next.js image-optimisation cache (/_next/image) is warm before real users
 * arrive.  Only /_next/image paths are warmed — external CDN assets (e.g.
 * Cloudflare R2 logos) are already cached at the edge and don't need warming.
 */
async function warmImagesFromHtml(
  html: string,
  label: string,
): Promise<void> {
  const imageUrls = new Set<string>();

  // Next.js renders priority <Image> as:
  //   <link rel="preload" as="image" imagesrcset="/_next/image?...&w=640 640w, ...">
  // Collect every /_next/image URL from every srcset.
  for (const match of html.matchAll(/imagesrcset="([^"]+)"/g)) {
    for (const entry of match[1].split(",")) {
      const src = entry.trim().split(" ")[0];
      if (src?.startsWith("/_next/image")) {
        imageUrls.add(`${baseUrl}${src}`);
      }
    }
  }

  // Also handle plain href preloads: <link rel="preload" as="image" href="/_next/image?...">
  for (const match of html.matchAll(/as="image"[^>]+href="([^"]+)"/g)) {
    const src = match[1];
    if (src?.startsWith("/_next/image")) {
      imageUrls.add(src.startsWith("http") ? src : `${baseUrl}${src}`);
    }
  }

  if (imageUrls.size === 0) {
    return;
  }

  console.log(
    `[warm-cache] ${label}: warming ${imageUrls.size} optimised image(s)`,
  );

  for (const imgUrl of imageUrls) {
    const imgStart = Date.now();
    try {
      const res = await fetch(imgUrl, {
        headers: { "user-agent": userAgent },
        signal: AbortSignal.timeout(timeoutMs),
      });
      // Drain body so the connection is cleanly closed.
      await res.arrayBuffer();
      console.log(
        `[warm-cache]   image ${res.status} ${res.headers.get("content-type") ?? "?"} ${Date.now() - imgStart}ms ${imgUrl.slice(0, 100)}`,
      );
    } catch (err) {
      console.warn(
        `[warm-cache]   image FAIL ${Date.now() - imgStart}ms ${imgUrl.slice(0, 100)} — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

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
      // Warm /_next/image URLs found in this page's preload hints so the
      // image-optimisation cache is hot before real users trigger the LCP request.
      await warmImagesFromHtml(body, route.label);
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

/**
 * Fetch the top-N resource slugs from the internal hot-slugs API so the
 * warm script can prime the cache for pages beyond the single HOT_SLUG.
 * Returns an empty array (with a warning) if the endpoint is unreachable or
 * the secret is missing — the main route list still runs as normal.
 */
async function fetchHotSlugs(limit = 20): Promise<string[]> {
  if (!warmSecret) {
    console.warn(
      "[warm-cache] PERFORMANCE_WARM_SECRET not set — skipping hot-slugs fetch, only HOT_SLUG will be warmed",
    );
    return [];
  }

  const url = new URL("/api/internal/hot-slugs", baseUrl);
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": userAgent,
        "x-warm-secret": warmSecret,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`[warm-cache] hot-slugs API returned ${res.status} — falling back to HOT_SLUG only`);
      return [];
    }

    const json = (await res.json()) as { slugs?: unknown };
    if (!Array.isArray(json.slugs)) return [];

    const slugs = (json.slugs as unknown[]).filter((s): s is string => typeof s === "string");
    console.log(`[warm-cache] hot-slugs: fetched ${slugs.length} slugs to warm`);
    return slugs;
  } catch (err) {
    console.warn(
      `[warm-cache] hot-slugs fetch failed — falling back to HOT_SLUG only: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

async function triggerInternalWarm(): Promise<void> {
  if (!warmSecret) {
    return;
  }

  const url = new URL("/api/internal/performance/warm", baseUrl);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "user-agent": userAgent,
        "x-warm-secret": warmSecret,
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.warn(
        `[warm-cache] internal warm endpoint returned ${response.status} after ${Date.now() - startedAt}ms`,
      );
      return;
    }

    await response.arrayBuffer().catch(() => undefined);
    console.log(
      `[warm-cache] internal warm endpoint completed in ${Date.now() - startedAt}ms`,
    );
  } catch (error) {
    console.warn(
      `[warm-cache] internal warm endpoint failed after ${Date.now() - startedAt}ms: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function main() {
  console.log(
    `[warm-cache] Starting public cache warm-up against ${baseUrl}`,
  );

  // Prime service-level/precomputed caches first when the internal warm secret
  // is available. The later public-route fanout still warms route shells and
  // image optimizer hints, but it should no longer be responsible for the
  // first expensive listing/detail cache fill by itself.
  await triggerInternalWarm();

  // Fetch the top-N resource slugs and append them as warm routes.
  // The static HOT_SLUG route (resource-detail-hot) is already in the routes
  // array above; fetchHotSlugs returns all top slugs including it, so we
  // deduplicate by the path string to avoid warming the same URL twice.
  const hotSlugs = await fetchHotSlugs(20);
  const existingPaths = new Set(routes.map((r) => r.path));
  for (const slug of hotSlugs) {
    const path = `/resources/${encodeURIComponent(slug)}`;
    if (!existingPaths.has(path)) {
      routes.push({ label: `resource-detail:${slug}`, path });
      existingPaths.add(path);
    }
  }

  console.log(`[warm-cache] Warming ${routes.length} routes total`);

  const results: WarmResult[] = [];

  for (const route of routes) {
    const attempts = Math.max(1, route.repeat ?? 1);
    const burst = Math.max(1, route.burst ?? 1);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const passSuffix = attempts > 1 ? ` (pass ${attempt}/${attempts})` : "";

      if (burst === 1) {
        console.log(`[warm-cache] Warming ${route.label}${passSuffix}: ${route.path}`);
        const result = await warmRoute(route);
        results.push(result);

        if (result.ok) {
          console.log(
            `[warm-cache] OK ${result.status} ${result.label}${passSuffix} ${result.elapsedMs}ms bodyBytes=${result.bodyBytes ?? "n/a"}`,
          );
        } else {
          console.warn(
            `[warm-cache] FAIL ${result.status ?? "ERR"} ${result.label}${passSuffix} ${result.elapsedMs}ms${result.error ? ` ${result.error}` : ""}`,
          );
        }
        continue;
      }

      console.log(
        `[warm-cache] Warming ${route.label}${passSuffix}: ${route.path} (burst ${burst})`,
      );
      const burstResults = await Promise.all(
        Array.from({ length: burst }, async (_, index) => {
          const shardSuffix = `${passSuffix} [burst ${index + 1}/${burst}]`;
          const result = await warmRoute(route);

          if (result.ok) {
            console.log(
              `[warm-cache] OK ${result.status} ${result.label}${shardSuffix} ${result.elapsedMs}ms bodyBytes=${result.bodyBytes ?? "n/a"}`,
            );
          } else {
            console.warn(
              `[warm-cache] FAIL ${result.status ?? "ERR"} ${result.label}${shardSuffix} ${result.elapsedMs}ms${result.error ? ` ${result.error}` : ""}`,
            );
          }

          return result;
        }),
      );
      results.push(...burstResults);
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
