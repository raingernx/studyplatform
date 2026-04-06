import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const requiredRootFiles = [
  "knowledge/index.md",
  "knowledge/log.md",
  "knowledge/glossary.md",
  "knowledge/open-questions.md",
  "knowledge/raw/README.md",
];

const requiredSchemaFiles = [
  "knowledge/schema/wiki-rules.md",
  "knowledge/schema/source-priority.md",
  "knowledge/schema/ingest-rules.md",
  "knowledge/schema/query-rules.md",
  "knowledge/schema/lint-rules.md",
  "knowledge/schema/page-template.md",
];

const requiredWikiHeadings = [
  "## Summary",
  "## Current Truth",
  "## Why It Matters",
  "## Key Files",
  "## Flows",
  "## Invariants",
  "## Known Risks",
  "## Related Pages",
  "## Sources",
  "## Last Reviewed",
];

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walk(full));
      continue;
    }
    entries.push(full);
  }
  return entries;
}

function fail(message) {
  console.error(`[wiki-lint] ${message}`);
  process.exitCode = 1;
}

for (const file of [...requiredRootFiles, ...requiredSchemaFiles]) {
  if (!existsSync(path.join(repoRoot, file))) {
    fail(`Missing required knowledge file: ${file}`);
  }
}

const wikiDir = path.join(repoRoot, "knowledge", "wiki");
const wikiFiles = existsSync(wikiDir)
  ? walk(wikiDir).filter((file) => file.endsWith(".md"))
  : [];

if (wikiFiles.length === 0) {
  fail("No wiki pages found under knowledge/wiki.");
}

const indexPath = path.join(repoRoot, "knowledge", "index.md");
const indexContent = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";

for (const file of wikiFiles) {
  const relativePath = path.relative(path.join(repoRoot, "knowledge"), file).replaceAll(path.sep, "/");
  const content = readFileSync(file, "utf8");

  for (const heading of requiredWikiHeadings) {
    if (!content.includes(heading)) {
      fail(`Wiki page ${relativePath} is missing heading: ${heading}`);
    }
  }

  if (!indexContent.includes(`(${relativePath})`)) {
    fail(`knowledge/index.md does not link to wiki page: ${relativePath}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(
  `[wiki-lint] OK: ${wikiFiles.length} wiki pages and ${requiredSchemaFiles.length} schema files passed structural checks.`,
);
