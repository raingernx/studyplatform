const DEFAULT_BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const DEFAULT_RETRIES = Number.parseInt(process.env.SMOKE_RETRIES ?? "6", 10);
const DEFAULT_RETRY_DELAY_MS = Number.parseInt(
  process.env.SMOKE_RETRY_DELAY_MS ?? "750",
  10,
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(pathname, init = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt += 1) {
    try {
      const response = await fetch(new URL(pathname, DEFAULT_BASE_URL), init);
      return response;
    } catch (error) {
      lastError = error;

      if (attempt === DEFAULT_RETRIES) {
        break;
      }

      await sleep(DEFAULT_RETRY_DELAY_MS);
    }
  }

  throw new Error(
    `Failed to fetch ${pathname} from ${DEFAULT_BASE_URL} after ${DEFAULT_RETRIES} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function readText(pathname) {
  const response = await fetchWithRetry(pathname);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Expected 200 for ${pathname}, got ${response.status}`);
  }

  return text;
}

async function readJson(pathname) {
  const response = await fetchWithRetry(pathname, {
    headers: {
      Accept: "application/json",
    },
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Expected 200 for ${pathname}, got ${response.status}`);
  }

  return {
    response,
    json,
  };
}

function assertIncludes(text, expected, label) {
  const missing = expected.filter((token) => !text.includes(token));

  if (missing.length > 0) {
    throw new Error(`${label} is missing expected markers: ${missing.join(", ")}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`[smoke] Base URL: ${DEFAULT_BASE_URL}`);

  const { json: readyJson } = await readJson("/api/internal/ready");
  assert(readyJson.data?.status === "ok", "readiness endpoint did not report ok");
  console.log("[smoke] Readiness endpoint OK");

  const listingHtml = await readText("/resources?search=worksheet");
  assertIncludes(
    listingHtml,
    ["Search results", "Sorted by Best match", "Showing results for"],
    "search results page",
  );
  console.log("[smoke] Search results page OK");

  const noResultsHtml = await readText("/resources?search=zzzznotfound123");
  assertIncludes(
    noResultsHtml,
    ["Search results", "Try these searches", "ยังไม่พบผลลัพธ์", "Return to discover"],
    "no-results page",
  );
  console.log("[smoke] No-results recovery page OK");

  const { response: searchResponse, json: searchJson } = await readJson("/api/search?q=flashcard");
  assert(Array.isArray(searchJson.data), "/api/search did not return a data array");
  assert(
    searchResponse.headers.get("content-type")?.includes("application/json"),
    "/api/search did not return JSON content-type",
  );
  console.log(`[smoke] Search API OK (${searchJson.data.length} results)`);

  const { json: suggestionsJson } = await readJson("/api/search?q=flashcard&view=suggestions&limit=6");
  assert(Array.isArray(suggestionsJson.data), "search suggestions payload is missing data array");
  assert(
    suggestionsJson.data.every((item) => !("_count" in item)),
    "search suggestions payload should stay lightweight and omit _count",
  );
  console.log("[smoke] Search suggestions API OK");

  const { json: recoveryJson } = await readJson("/api/search?q=zzzznotfound123&recovery=1");
  assert(Array.isArray(recoveryJson.data), "search recovery payload is missing data array");
  assert(
    recoveryJson.recovery && Array.isArray(recoveryJson.recovery.suggestedQueries),
    "search recovery payload is missing recovery suggestions",
  );
  console.log("[smoke] Search recovery API OK");

  const { response: authViewerResponse, json: authViewerJson } = await readJson("/api/auth/viewer");
  assert(
    typeof authViewerJson.data?.authenticated === "boolean",
    "/api/auth/viewer did not return authenticated boolean",
  );
  assert(
    authViewerResponse.headers.get("cache-control")?.includes("no-store"),
    "/api/auth/viewer should remain private/no-store",
  );
  console.log("[smoke] Auth viewer API OK");

  console.log("[smoke] All search/auth smoke checks passed");
}

main().catch((error) => {
  console.error("[smoke] FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
