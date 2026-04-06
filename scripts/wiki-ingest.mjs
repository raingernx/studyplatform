import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  getWikiPageMetas,
  knowledgeRoot,
  mergeRelatedPageLinks,
  renderKnowledgeIndex,
  slugify,
  suggestRelatedWikiPages,
  toPosixPath,
  wikiCategoryOrder,
} from "./lib/knowledge-wiki.mjs";

const { values } = parseArgs({
  options: {
    bucket: { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    summary: { type: "string", default: "TODO: summarize this source." },
    source: { type: "string" },
    "wiki-dir": { type: "string" },
    "wiki-slug": { type: "string" },
    "wiki-title": { type: "string" },
  },
});

const rawRoot = path.join(knowledgeRoot, "raw");
const availableBuckets = ["repo-docs", "product", "architecture", "design", "operations", "incidents", "research", "decisions"];

function fail(message) {
  console.error(`[wiki-ingest] ${message}`);
  process.exit(1);
}

if (!values.bucket || !availableBuckets.includes(values.bucket)) {
  fail(`--bucket is required and must be one of: ${availableBuckets.join(", ")}`);
}

if (!values.title) {
  fail("--title is required");
}

const rawSlug = values.slug ? slugify(values.slug) : slugify(values.title);
if (!rawSlug) {
  fail("Could not derive a valid slug. Pass --slug explicitly.");
}

const today = new Date().toISOString().slice(0, 10);
const rawDir = path.join(rawRoot, values.bucket);
const rawFile = path.join(rawDir, `${rawSlug}.md`);

if (existsSync(rawFile)) {
  fail(`Raw note already exists: ${toPosixPath(path.relative(process.cwd(), rawFile))}`);
}

mkdirSync(rawDir, { recursive: true });

const sourcePath = values.source ? path.resolve(process.cwd(), values.source) : null;
const sourceRelativeFromRaw =
  sourcePath && existsSync(sourcePath) ? toPosixPath(path.relative(rawDir, sourcePath)) : null;

const relatedWikiEntries = [];
let createdWikiRelativePath = null;
let suggestedWikiPages = suggestRelatedWikiPages({
  title: values.title,
  sourcePath: sourcePath && existsSync(sourcePath) ? sourcePath : null,
  preferredCategory: values["wiki-dir"] ?? null,
});

function pushUniqueRelatedEntry(targetEntries, entry) {
  if (!targetEntries.some((candidate) => candidate.label === entry.label && candidate.target === entry.target)) {
    targetEntries.push(entry);
  }
}

if (values["wiki-dir"] || values["wiki-slug"] || values["wiki-title"]) {
  if (!values["wiki-dir"] || !wikiCategoryOrder.includes(values["wiki-dir"])) {
    fail(`--wiki-dir is required with wiki options and must be one of: ${wikiCategoryOrder.join(", ")}`);
  }

  const wikiSlug = values["wiki-slug"] ? slugify(values["wiki-slug"]) : rawSlug;
  const wikiTitle = values["wiki-title"] ?? values.title;
  const wikiDir = path.join(knowledgeRoot, "wiki", values["wiki-dir"]);
  const wikiFile = path.join(wikiDir, `${wikiSlug}.md`);

  if (existsSync(wikiFile)) {
    fail(`Wiki page already exists: ${toPosixPath(path.relative(process.cwd(), wikiFile))}`);
  }

  mkdirSync(wikiDir, { recursive: true });
  createdWikiRelativePath = toPosixPath(path.relative(knowledgeRoot, wikiFile));
  const rawRelativeFromWiki = toPosixPath(path.relative(wikiDir, rawFile));
  suggestedWikiPages = suggestedWikiPages.filter((page) => page.relativePath !== createdWikiRelativePath);

  const sourceLines = [`- [${values.title}](${rawRelativeFromWiki})`];
  if (sourceRelativeFromRaw) {
    sourceLines.push(`- [Canonical source](${toPosixPath(path.relative(wikiDir, sourcePath))})`);
  }

  const relatedPageLines = suggestedWikiPages.length > 0
    ? suggestedWikiPages.map((page) => `- [${page.title}](${toPosixPath(path.relative(wikiDir, path.join(knowledgeRoot, page.relativePath)))})`)
    : ["- TODO"];

  writeFileSync(
    wikiFile,
    `# ${wikiTitle}

## Summary

TODO: summarize this topic.

## Current Truth

- TODO

## Why It Matters

TODO

## Key Files

- TODO

## Flows

- TODO

## Invariants

- TODO

## Known Risks

- TODO

## Related Pages

${relatedPageLines.join("\n")}

## Sources

${sourceLines.join("\n")}

## Last Reviewed

- ${today}
`,
    "utf8",
  );

  pushUniqueRelatedEntry(relatedWikiEntries, {
    label: wikiTitle,
    target: toPosixPath(path.relative(rawDir, wikiFile)),
  });

  for (const page of suggestedWikiPages) {
    const existingContent = readFileSync(page.file, "utf8");
    const backlinkTarget = toPosixPath(path.relative(path.dirname(page.file), wikiFile));
    const nextContent = mergeRelatedPageLinks(existingContent, [
      {
        label: wikiTitle,
        target: backlinkTarget,
      },
    ]);

    if (nextContent !== existingContent) {
      writeFileSync(page.file, nextContent, "utf8");
    }
  }
}

for (const page of suggestedWikiPages) {
  pushUniqueRelatedEntry(relatedWikiEntries, {
    label: page.title,
    target: toPosixPath(path.relative(rawDir, path.join(knowledgeRoot, page.relativePath))),
  });
}

const rawLines = [
  `# ${values.title}`,
  "",
  "## Summary",
  "",
  values.summary,
  "",
  "## Source Reference",
  "",
  sourceRelativeFromRaw ? `- [Canonical source](${sourceRelativeFromRaw})` : "- Manual capture / no canonical source path supplied yet.",
  "",
  "## Notes",
  "",
  "- TODO",
  "",
  "## Related Wiki Pages",
  "",
  ...(relatedWikiEntries.length > 0
    ? relatedWikiEntries.map((entry) => `- [${entry.label}](${entry.target})`)
    : ["- TODO"]),
  "",
  "## Captured At",
  "",
  `- ${today}`,
  "",
];

writeFileSync(rawFile, rawLines.join("\n"), "utf8");

const logPath = path.join(knowledgeRoot, "log.md");
const logContent = readFileSync(logPath, "utf8");
const rawRelativePath = toPosixPath(path.relative(knowledgeRoot, rawFile));
const logEntryParts = [`captured [${values.title}](${rawRelativePath}) in \`${values.bucket}\``];
if (createdWikiRelativePath) {
  logEntryParts.push(`seeded [wiki page](${createdWikiRelativePath})`);
}
if (suggestedWikiPages.length > 0) {
  logEntryParts.push(`linked ${suggestedWikiPages.length} related page suggestion${suggestedWikiPages.length === 1 ? "" : "s"}`);
}
const logEntry = `- ${logEntryParts.join(" and ")}.`;

let nextLogContent;
if (logContent.includes(`## ${today}`)) {
  nextLogContent = logContent.replace(`## ${today}\n`, `## ${today}\n\n${logEntry}\n`);
} else {
  nextLogContent = `${logContent.trimEnd()}\n\n## ${today}\n\n${logEntry}\n`;
}

writeFileSync(logPath, nextLogContent, "utf8");
writeFileSync(path.join(knowledgeRoot, "index.md"), renderKnowledgeIndex(), "utf8");

console.log(`[wiki-ingest] Created ${rawRelativePath}`);
if (createdWikiRelativePath) {
  console.log(`[wiki-ingest] Created ${createdWikiRelativePath}`);
}
if (suggestedWikiPages.length > 0) {
  console.log(
    `[wiki-ingest] Related wiki suggestions: ${suggestedWikiPages.map((page) => page.relativePath).join(", ")}`,
  );
}
console.log("[wiki-ingest] Rebuilt knowledge/index.md and updated knowledge/log.md");
