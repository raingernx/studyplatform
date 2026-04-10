import fs from "node:fs";
import path from "node:path";

const APP_ROOT = path.join(process.cwd(), "src", "app");
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DASHBOARD_LOADING_OWNERSHIP_ROOTS = [
  path.join("src", "app", "(dashboard-lite)"),
  path.join("src", "app", "(dashboard)", "dashboard", "creator", "(protected)"),
  path.join("src", "app", "(dashboard)", "dashboard", "creator", "apply"),
];
const DISALLOWED_DASHBOARD_FALLBACKS = new Set([
  "DashboardLibraryResultsSuspenseFallback",
  "DashboardDownloadsResultsSkeleton",
  "DashboardPurchasesResultsSkeleton",
  "DashboardSubscriptionResultsSuspenseFallback",
  "CreatorDashboardOverviewResultsSkeleton",
  "CreatorDashboardAnalyticsResultsSkeleton",
  "CreatorDashboardResourcesResultsSkeleton",
  "CreatorDashboardSalesResultsSkeleton",
  "CreatorDashboardProfileFormSkeleton",
  "CreatorResourceFormLoadingShell",
  "CreatorApplyPanelSkeleton",
]);
const PATTERNS = [
  {
    type: "function",
    regex:
      /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Z][A-Za-z0-9]*(?:Skeleton|Fallback))\b/gm,
  },
  {
    type: "const",
    regex:
      /^\s*(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*(?:Skeleton|Fallback))\b/gm,
  },
];
const SUSPENSE_FALLBACK_REGEX =
  /<Suspense[\s\S]*?fallback=\{\s*<([A-Z][A-Za-z0-9]*)\b[\s\S]*?\}\s*>/gm;
const DYNAMIC_LOADING_REGEX =
  /loading:\s*\(\)\s*=>\s*<([A-Z][A-Za-z0-9]*)\b/gm;

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (FILE_EXTENSIONS.has(path.extname(entry.name)) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

const violations = [];

for (const filePath of walk(APP_ROOT)) {
  const source = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);

  for (const { regex, type } of PATTERNS) {
    for (const match of source.matchAll(regex)) {
      if (match.index == null) continue;

      violations.push({
        file: relativePath,
        line: getLineNumber(source, match.index),
        name: match[1],
        type,
      });
    }
  }

  const isDashboardOwnershipFile = DASHBOARD_LOADING_OWNERSHIP_ROOTS.some((root) =>
    relativePath.startsWith(root),
  );

  if (!isDashboardOwnershipFile) {
    continue;
  }

  for (const match of source.matchAll(SUSPENSE_FALLBACK_REGEX)) {
    if (match.index == null) continue;
    const componentName = match[1];
    if (!DISALLOWED_DASHBOARD_FALLBACKS.has(componentName)) {
      continue;
    }

    violations.push({
      file: relativePath,
      line: getLineNumber(source, match.index),
      name: componentName,
      type: "dashboard-loading-ownership",
    });
  }

  for (const match of source.matchAll(DYNAMIC_LOADING_REGEX)) {
    if (match.index == null) continue;
    const componentName = match[1];
    if (!DISALLOWED_DASHBOARD_FALLBACKS.has(componentName)) {
      continue;
    }

    violations.push({
      file: relativePath,
      line: getLineNumber(source, match.index),
      name: componentName,
      type: "dashboard-dynamic-loading",
    });
  }
}

if (violations.length > 0) {
  console.error(
    "App-layer skeleton contract violations found. Inline skeleton/fallback components are not allowed in src/app, and dashboard-family pages must not reintroduce disallowed main-body fallback owners.",
  );

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.type} ${violation.name}`,
    );
  }

  process.exit(1);
}

console.log("No inline app-level skeleton or fallback components found.");
