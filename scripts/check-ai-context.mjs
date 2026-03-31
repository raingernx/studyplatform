import { execFileSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const mode = args.has("--worktree") ? "worktree" : "staged";
const strict = args.has("--strict");

const SYSTEM_LEVEL_MATCHERS = [
  {
    test: /^src\/app\/resources\//,
    docs: ["04-architecture.md", "05-features.md", "08-performance-audit.md", "09-todos.md"],
    reason: "resource marketplace or detail flow changed",
  },
  {
    test: /^src\/app\/categories\//,
    docs: ["04-architecture.md", "05-features.md", "08-performance-audit.md", "09-todos.md"],
    reason: "category route behavior changed",
  },
  {
    test: /^src\/app\/creators\//,
    docs: ["04-architecture.md", "05-features.md", "08-performance-audit.md", "09-todos.md"],
    reason: "creator public flow changed",
  },
  {
    test: /^src\/app\/auth\//,
    docs: ["04-architecture.md", "05-features.md", "09-todos.md"],
    reason: "authentication or account recovery flow changed",
  },
  {
    test: /^src\/app\/admin\//,
    docs: ["04-architecture.md", "05-features.md", "09-todos.md"],
    reason: "admin workflow changed",
  },
  {
    test: /^src\/services\//,
    docs: ["04-architecture.md", "05-features.md", "08-performance-audit.md", "09-todos.md"],
    reason: "service-layer behavior changed",
  },
  {
    test: /^src\/repositories\//,
    docs: ["04-architecture.md", "08-performance-audit.md", "09-todos.md"],
    reason: "repository or query behavior changed",
  },
  {
    test: /^src\/proxy\.ts$/,
    docs: ["04-architecture.md", "03-tech-stack.md", "09-todos.md"],
    reason: "request interception behavior changed",
  },
  {
    test: /^middleware\.ts$/,
    docs: ["04-architecture.md"],
    reason: "middleware compatibility or request entry changed",
  },
  {
    test: /^src\/env\.ts$/,
    docs: ["03-tech-stack.md", "04-architecture.md", "09-todos.md"],
    reason: "environment contract changed",
  },
  {
    test: /^package\.json$/,
    docs: ["03-tech-stack.md", "08-performance-audit.md", "09-todos.md"],
    reason: "build or script workflow changed",
  },
  {
    test: /^prisma\/schema\.prisma$/,
    docs: ["03-tech-stack.md", "04-architecture.md", "08-performance-audit.md", "09-todos.md"],
    reason: "database schema or operational requirements changed",
  },
  {
    test: /^\.github\/workflows\//,
    docs: ["03-tech-stack.md", "04-architecture.md", "08-performance-audit.md", "09-todos.md"],
    reason: "deployment or perf workflow changed",
  },
  {
    test: /^scripts\/(warm-cache|warm-public-cache|run-post-deploy-perf)\.(ts|mjs|js)$/,
    docs: ["03-tech-stack.md", "04-architecture.md", "08-performance-audit.md", "09-todos.md"],
    reason: "warm-cache or perf verification behavior changed",
  },
  {
    test: /^public\/brand\//,
    docs: ["02-brand-identity.md", "05-features.md", "09-todos.md"],
    reason: "brand assets changed",
  },
];

function getChangedFiles() {
  const command =
    mode === "worktree"
      ? ["status", "--porcelain"]
      : ["diff", "--cached", "--name-only", "--diff-filter=ACMRD"];

  const output = execFileSync("git", command, { encoding: "utf8" }).trim();

  if (!output) {
    return [];
  }

  if (mode === "worktree") {
    return output
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  }

  return output.split("\n").map((line) => line.trim()).filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

const changedFiles = getChangedFiles();
const changedContextFiles = changedFiles.filter((file) =>
  file.startsWith("krucraft-ai-contexts/"),
);

const matchedReasons = unique(
  changedFiles.flatMap((file) =>
    SYSTEM_LEVEL_MATCHERS.filter((matcher) => matcher.test.test(file)).map(
      (matcher) => matcher.reason,
    ),
  ),
);

const suggestedDocs = unique(
  changedFiles.flatMap((file) =>
    SYSTEM_LEVEL_MATCHERS.filter((matcher) => matcher.test.test(file)).flatMap(
      (matcher) => matcher.docs,
    ),
  ),
);

if (changedFiles.length === 0) {
  console.log("[context-check] No changed files detected.");
  process.exit(0);
}

if (matchedReasons.length === 0) {
  console.log(
    `[context-check] No system-level changes detected in ${mode} files. AI context update is probably not needed.`,
  );
  process.exit(0);
}

if (changedContextFiles.length > 0) {
  console.log("[context-check] AI context files were updated in this change set.");
  console.log(`[context-check] Changed context files: ${changedContextFiles.join(", ")}`);
  process.exit(0);
}

console.warn("[context-check] This change likely affects shared AI understanding.");
console.warn(`[context-check] Why: ${matchedReasons.join("; ")}`);
console.warn(
  `[context-check] Consider updating: ${suggestedDocs
    .map((doc) => `krucraft-ai-contexts/${doc}`)
    .join(", ")}`,
);
console.warn("[context-check] Run: npm run context:check:staged");

if (strict) {
  process.exit(1);
}

process.exit(0);
