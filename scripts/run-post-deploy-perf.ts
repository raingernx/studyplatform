import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cliArgs = new Set(process.argv.slice(2));
const baseUrl = process.env.BASE_URL?.trim();
const hotSlug =
  process.env.HOT_SLUG?.trim() || "middle-school-science-quiz-assessment-set";
const hotCreator = process.env.HOT_CREATOR?.trim() || "kru-mint";
const categorySlug = process.env.CATEGORY?.trim() || "science";
const sentinelCategorySlug =
  process.env.SENTINEL_CATEGORY?.trim() || "art-creativity";
const sentinelQuery =
  process.env.SENTINEL_QUERY?.trim() || "worksheet";
const resultsDir = path.resolve(process.env.PERF_RESULTS_DIR?.trim() || "artifacts/k6");
const summaryPath = path.resolve(
  process.env.PERF_SUMMARY_PATH?.trim() || "artifacts/perf-summary.json",
);
const requestedSuite = process.env.PERF_SUITE?.trim() || (
  cliArgs.has("--suite=full") ? "full" : "smoke"
);

if (!baseUrl) {
  console.error("[post-deploy-perf] Missing BASE_URL.");
  process.exit(1);
}

if (
  requestedSuite !== "smoke" &&
  requestedSuite !== "full" &&
  requestedSuite !== "sentinel" &&
  requestedSuite !== "listing-drilldown"
) {
  console.error(
    `[post-deploy-perf] Unsupported PERF_SUITE "${requestedSuite}". Use "smoke", "full", "sentinel", or "listing-drilldown".`,
  );
  process.exit(1);
}

const selectedSuite: PerfSuite = requestedSuite;

type PerfSuite = "smoke" | "full" | "sentinel" | "listing-drilldown";

type RouteSpec = {
  name: string;
  script: string;
  thresholdMs: number;
  env?: Record<string, string>;
};

type K6MetricValues = Record<string, number>;

type K6SummaryMetric = K6MetricValues & {
  values?: K6MetricValues;
};

type K6Summary = {
  metrics?: Record<string, K6SummaryMetric>;
};

type PerfRouteResult = {
  name: string;
  script: string;
  thresholdMs: number;
  avgMs: number | null;
  p95Ms: number | null;
  failRate: number | null;
  thresholdPassed: boolean;
  exitCode: number;
  summaryPath: string;
};

type PerfSummaryRollup = {
  status: "pass" | "fail";
  passedRouteCount: number;
  failedRouteCount: number;
  worstP95Route: {
    name: string;
    p95Ms: number | null;
    thresholdMs: number;
  } | null;
  nearestBudgetRoute: {
    name: string;
    p95Ms: number | null;
    thresholdMs: number;
    headroomMs: number | null;
  } | null;
};

let hasLoggedCiMetricDebug = false;

const routeSpecsBySuite: Record<PerfSuite, RouteSpec[]> = {
  smoke: [
    {
      name: "resources_home_smoke",
      script: "k6/routes/resources-home-smoke.js",
      thresholdMs: 900,
    },
    {
      name: "listing_recommended_smoke",
      script: "k6/routes/listing-recommended-smoke.js",
      thresholdMs: 1000,
    },
    {
      name: "listing_newest_smoke",
      script: "k6/routes/listing-newest-smoke.js",
      thresholdMs: 900,
    },
    {
      name: "resource_detail_smoke",
      script: "k6/routes/resource-detail-smoke.js",
      thresholdMs: 900,
      env: { HOT_SLUG: hotSlug },
    },
    {
      name: "creator_detail_smoke",
      script: "k6/routes/creator-detail-smoke.js",
      thresholdMs: 1000,
      env: { HOT_CREATOR: hotCreator },
    },
    {
      name: "category_listing_smoke",
      script: "k6/routes/category-listing-smoke.js",
      thresholdMs: 1000,
      env: { CATEGORY: categorySlug },
    },
  ],
  full: [
    {
      name: "resources_home_full",
      script: "k6/routes/resources-home.js",
      thresholdMs: 1500,
    },
    {
      name: "listing_recommended_experiment_full",
      script: "k6/routes/listing-recommended-experiment.js",
      thresholdMs: 1500,
    },
    {
      name: "listing_newest_control_full",
      script: "k6/routes/listing-newest-control.js",
      thresholdMs: 1500,
    },
    {
      name: "resource_detail_hot_full",
      script: "k6/routes/resource-detail-hot.js",
      thresholdMs: 1800,
      env: { HOT_SLUG: hotSlug },
    },
  ],
  sentinel: [
    {
      name: "filtered_category_art_creativity_sentinel",
      script: "k6/routes/resources-filtered-category-smoke.js",
      thresholdMs: 1200,
      env: { CATEGORY: sentinelCategorySlug },
    },
    {
      name: "search_worksheet_sentinel",
      script: "k6/routes/resources-search-smoke.js",
      thresholdMs: 1200,
      env: { QUERY: sentinelQuery },
    },
  ],
  "listing-drilldown": [
    {
      name: "resources_home_smoke",
      script: "k6/routes/resources-home-smoke.js",
      thresholdMs: 900,
    },
    {
      name: "listing_recommended_smoke",
      script: "k6/routes/listing-recommended-smoke.js",
      thresholdMs: 1000,
    },
    {
      name: "listing_newest_smoke",
      script: "k6/routes/listing-newest-smoke.js",
      thresholdMs: 900,
    },
    {
      name: "category_listing_smoke",
      script: "k6/routes/category-listing-smoke.js",
      thresholdMs: 1000,
      env: { CATEGORY: categorySlug },
    },
    {
      name: "filtered_category_art_creativity_sentinel",
      script: "k6/routes/resources-filtered-category-smoke.js",
      thresholdMs: 1200,
      env: { CATEGORY: sentinelCategorySlug },
    },
    {
      name: "search_worksheet_sentinel",
      script: "k6/routes/resources-search-smoke.js",
      thresholdMs: 1200,
      env: { QUERY: sentinelQuery },
    },
  ],
};

function formatMs(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(2)}ms`;
}

function formatRate(value: number | null) {
  return value === null ? "n/a" : `${(value * 100).toFixed(2)}%`;
}

function formatHeadroom(value: number | null) {
  if (value === null) {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}ms`;
}

function readMetricValue(
  summary: K6Summary,
  metricName: string,
  valueKey: string,
): number | null {
  const metric = summary.metrics?.[metricName];
  if (!metric) {
    return null;
  }

  const nestedValue = metric.values?.[valueKey];
  if (typeof nestedValue === "number") {
    return nestedValue;
  }

  const directValue = metric[valueKey];
  return typeof directValue === "number" ? directValue : null;
}

function logMissingMetric(
  routeName: string,
  metricName: string,
  valueKey: string,
  summaryPathForLog: string,
) {
  console.error(
    `[post-deploy-perf] Missing k6 metric "${metricName}.${valueKey}" for ${routeName} in ${summaryPathForLog}`,
  );
}

function extractRouteMetrics(
  summary: K6Summary | null,
  routeName: string,
  summaryPathForLog: string,
) {
  if (!summary) {
    console.error(
      `[post-deploy-perf] Unable to parse k6 summary JSON for ${routeName} in ${summaryPathForLog}`,
    );
    return {
      avgMs: null,
      p95Ms: null,
      failRate: null,
    };
  }

  const avgMs = readMetricValue(summary, "http_req_duration", "avg");
  const p95Ms = readMetricValue(summary, "http_req_duration", "p(95)");
  const failRate =
    readMetricValue(summary, "http_req_failed", "rate") ??
    readMetricValue(summary, "http_req_failed", "value");

  if (avgMs === null) {
    logMissingMetric(routeName, "http_req_duration", "avg", summaryPathForLog);
  }

  if (p95Ms === null) {
    logMissingMetric(routeName, "http_req_duration", "p(95)", summaryPathForLog);
  }

  if (failRate === null) {
    console.error(
      `[post-deploy-perf] Missing k6 metric "http_req_failed.rate" or "http_req_failed.value" for ${routeName} in ${summaryPathForLog}`,
    );
  }

  if (process.env.CI && !hasLoggedCiMetricDebug) {
    console.log(
      `[post-deploy-perf] CI metric debug ${routeName} avg=${formatMs(avgMs)} p95=${formatMs(p95Ms)} failRate=${formatRate(failRate)}`,
    );
    hasLoggedCiMetricDebug = true;
  }

  return {
    avgMs,
    p95Ms,
    failRate,
  };
}

async function runK6Route(
  route: RouteSpec,
  outputFile: string,
): Promise<number> {
  const env = {
    ...process.env,
    BASE_URL: baseUrl,
    ...(route.env ?? {}),
  };

  return new Promise((resolve, reject) => {
    const child = spawn(
      "k6",
      ["run", "--summary-export", outputFile, route.script],
      {
        cwd: process.cwd(),
        env,
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function parseRouteResult(
  route: RouteSpec,
  outputFile: string,
  exitCode: number,
): Promise<PerfRouteResult> {
  let summary: K6Summary | null = null;

  try {
    const raw = await readFile(outputFile, "utf8");
    summary = JSON.parse(raw) as K6Summary;
  } catch {
    summary = null;
  }

  const { avgMs, p95Ms, failRate } = extractRouteMetrics(
    summary,
    route.name,
    outputFile,
  );

  const thresholdPassed =
    exitCode === 0 &&
    p95Ms !== null &&
    failRate !== null &&
    p95Ms <= route.thresholdMs &&
    failRate < 0.01;

  return {
    name: route.name,
    script: route.script,
    thresholdMs: route.thresholdMs,
    avgMs,
    p95Ms,
    failRate,
    thresholdPassed,
    exitCode,
    summaryPath: outputFile,
  };
}

function writeStepSummary(results: PerfRouteResult[]) {
  const rollup = buildSummaryRollup(results);
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY?.trim();
  if (!stepSummaryPath) {
    return Promise.resolve();
  }

  const lines = [
    `## Post-deploy ${selectedSuite} performance verification`,
    "",
    "| Route | Avg | p95 | Fail rate | Threshold | Status |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...results.map((result) => {
      const status = result.thresholdPassed ? "PASS" : "FAIL";
      return `| ${result.name} | ${formatMs(result.avgMs)} | ${formatMs(result.p95Ms)} | ${formatRate(result.failRate)} | ${result.thresholdMs}ms | ${status} |`;
    }),
    "",
    `- Overall status: ${rollup.status.toUpperCase()}`,
    `- Passed routes: ${rollup.passedRouteCount}/${results.length}`,
    `- Failed routes: ${rollup.failedRouteCount}`,
    `- Worst p95 route: ${rollup.worstP95Route ? `${rollup.worstP95Route.name} (${formatMs(rollup.worstP95Route.p95Ms)} / ${rollup.worstP95Route.thresholdMs}ms budget)` : "n/a"}`,
    `- Nearest budget route: ${rollup.nearestBudgetRoute ? `${rollup.nearestBudgetRoute.name} (${formatMs(rollup.nearestBudgetRoute.p95Ms)}, headroom ${formatHeadroom(rollup.nearestBudgetRoute.headroomMs)})` : "n/a"}`,
    "",
  ];

  return writeFile(stepSummaryPath, `${lines.join("\n")}\n`, { flag: "a" });
}

function buildSummaryRollup(results: PerfRouteResult[]): PerfSummaryRollup {
  const passedRouteCount = results.filter((result) => result.thresholdPassed).length;
  const failedRouteCount = results.length - passedRouteCount;

  const routesWithP95 = results.filter((result) => result.p95Ms !== null);
  const worstP95Route = routesWithP95.reduce<PerfSummaryRollup["worstP95Route"]>(
    (currentWorst, result) => {
      if (result.p95Ms === null) {
        return currentWorst;
      }
      if (!currentWorst || result.p95Ms > (currentWorst.p95Ms ?? -Infinity)) {
        return {
          name: result.name,
          p95Ms: result.p95Ms,
          thresholdMs: result.thresholdMs,
        };
      }
      return currentWorst;
    },
    null,
  );

  const nearestBudgetRoute = routesWithP95.reduce<PerfSummaryRollup["nearestBudgetRoute"]>(
    (currentNearest, result) => {
      if (result.p95Ms === null) {
        return currentNearest;
      }
      const headroomMs = result.thresholdMs - result.p95Ms;
      if (!currentNearest || headroomMs < (currentNearest.headroomMs ?? Infinity)) {
        return {
          name: result.name,
          p95Ms: result.p95Ms,
          thresholdMs: result.thresholdMs,
          headroomMs,
        };
      }
      return currentNearest;
    },
    null,
  );

  return {
    status: failedRouteCount > 0 ? "fail" : "pass",
    passedRouteCount,
    failedRouteCount,
    worstP95Route,
    nearestBudgetRoute,
  };
}

async function main() {
  await mkdir(resultsDir, { recursive: true });
  await mkdir(path.dirname(summaryPath), { recursive: true });

  console.log(
    `[post-deploy-perf] Starting ${selectedSuite} production verification against ${baseUrl}`,
  );

  const routeSpecs = routeSpecsBySuite[selectedSuite];
  const results: PerfRouteResult[] = [];

  for (const route of routeSpecs) {
    const outputFile = path.join(resultsDir, `${route.name}.json`);
    console.log(`[post-deploy-perf] Running ${route.name} via ${route.script}`);

    const exitCode = await runK6Route(route, outputFile);
    const result = await parseRouteResult(route, outputFile, exitCode);
    results.push(result);

    const status = result.thresholdPassed ? "PASS" : "FAIL";
    console.log(
      `[post-deploy-perf] ${status} ${result.name} avg=${formatMs(result.avgMs)} p95=${formatMs(result.p95Ms)} failRate=${formatRate(result.failRate)} threshold=${result.thresholdMs}ms exitCode=${result.exitCode}`,
    );
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    workflowName: process.env.GITHUB_WORKFLOW ?? null,
    suite: selectedSuite,
    baseUrl,
    hotSlug,
    warmCacheCompleted: true,
    rollup: buildSummaryRollup(results),
    results,
  };

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeStepSummary(results);

  const failedRoutes = results.filter((result) => !result.thresholdPassed);

  if (failedRoutes.length > 0) {
    console.error(
      `[post-deploy-perf] Threshold failures: ${failedRoutes.map((result) => result.name).join(", ")}`,
    );
    process.exit(1);
  }

  console.log("[post-deploy-perf] All routes passed thresholds");
}

main().catch((error) => {
  console.error("[post-deploy-perf] Unexpected error", error);
  process.exit(1);
});

export {};
