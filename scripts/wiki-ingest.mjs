import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  countTokenOverlap,
  extractMarkdownLinkMap,
  extractSection,
  getWikiPageMetas,
  knowledgeRoot,
  mergeRelatedPageLinks,
  renderKnowledgeIndex,
  replaceSection,
  slugify,
  toPosixPath,
  tokenizeForSimilarity,
  wikiCategoryOrder,
} from "./lib/knowledge-wiki.mjs";

const availableBuckets = ["repo-docs", "product", "architecture", "design", "operations", "incidents", "research", "decisions"];
const rawRoot = path.join(knowledgeRoot, "raw");
const wikiRoot = path.join(knowledgeRoot, "wiki");
const knowledgeLogFile = path.join(knowledgeRoot, "log.md");
const knowledgeIndexFile = path.join(knowledgeRoot, "index.md");
const today = new Date().toISOString().slice(0, 10);

const { values } = parseArgs({
  options: {
    batch: { type: "string" },
    format: { type: "string", default: "text" },
    bucket: { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    summary: { type: "string", default: "TODO: summarize this source." },
    source: { type: "string" },
    "wiki-dir": { type: "string" },
    "wiki-slug": { type: "string" },
    "wiki-title": { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "enforce-policy": { type: "boolean", default: false },
    "report-file": { type: "string" },
  },
});

const outputFormat = values.format;
if (!["text", "json"].includes(outputFormat)) {
  fail(`--format must be one of: text, json`);
}

function fail(message) {
  console.error(`[wiki-ingest] ${message}`);
  process.exit(1);
}

function pushUniqueRelatedEntry(targetEntries, entry) {
  if (!targetEntries.some((candidate) => candidate.label === entry.label && candidate.target === entry.target)) {
    targetEntries.push(entry);
  }
}

function normalizeBatchTarget(rawTarget, index) {
  if (!rawTarget || typeof rawTarget !== "object" || Array.isArray(rawTarget)) {
    fail(`wikiTargets[${index}] must be an object.`);
  }

  return {
    id: rawTarget.id,
    wikiDir: rawTarget.wikiDir ?? rawTarget["wiki-dir"],
    wikiSlug: rawTarget.wikiSlug ?? rawTarget["wiki-slug"],
    wikiTitle: rawTarget.wikiTitle ?? rawTarget["wiki-title"],
  };
}

function normalizeBatchItem(rawItem, index) {
  if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
    fail(`Batch item ${index + 1} must be an object.`);
  }

  return {
    bucket: rawItem.bucket,
    slug: rawItem.slug,
    title: rawItem.title,
    summary: rawItem.summary ?? "TODO: summarize this source.",
    source: rawItem.source,
    skipRawCapture: rawItem.skipRawCapture ?? rawItem["skip-raw-capture"] ?? false,
    wikiDir: rawItem.wikiDir ?? rawItem["wiki-dir"],
    wikiSlug: rawItem.wikiSlug ?? rawItem["wiki-slug"],
    wikiTitle: rawItem.wikiTitle ?? rawItem["wiki-title"],
    wikiTargetId: rawItem.wikiTargetId ?? rawItem["wiki-target-id"],
  };
}

function normalizeBatchPolicy(rawPolicy) {
  if (!rawPolicy) {
    return null;
  }
  if (typeof rawPolicy !== "object" || Array.isArray(rawPolicy)) {
    fail("Batch policy must be an object.");
  }

  const normalizeLimit = (value, label) => {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Number.isInteger(value) || value < 0) {
      fail(`Batch policy ${label} must be a non-negative integer when provided.`);
    }
    return value;
  };

  return {
    allowExistingWikiUpdate: rawPolicy.allowExistingWikiUpdate ?? true,
    allowBacklinkSeeding: rawPolicy.allowBacklinkSeeding ?? true,
    allowSkipRawCapture: rawPolicy.allowSkipRawCapture ?? true,
    maxReviewItems: normalizeLimit(rawPolicy.maxReviewItems, "maxReviewItems"),
    maxReviewTargets: normalizeLimit(rawPolicy.maxReviewTargets, "maxReviewTargets"),
  };
}

function loadInput() {
  const hasBatch = Boolean(values.batch);
  const hasSingleItemArgs = Boolean(
    values.bucket ||
      values.slug ||
      values.title ||
      values.source ||
      values["wiki-dir"] ||
      values["wiki-slug"] ||
      values["wiki-title"],
  );

  if (hasBatch && hasSingleItemArgs) {
    fail("Use either single ingest flags or --batch <json-file>, not both.");
  }

  if (hasBatch) {
    const batchPath = path.resolve(process.cwd(), values.batch);
    if (!existsSync(batchPath)) {
      fail(`Batch file does not exist: ${toPosixPath(path.relative(process.cwd(), batchPath))}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(readFileSync(batchPath, "utf8"));
    } catch (error) {
      fail(`Could not parse batch JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items) || items.length === 0) {
      fail("Batch file must contain a non-empty array or an object with an `items` array.");
    }

    const wikiTargets = Array.isArray(parsed?.wikiTargets) ? parsed.wikiTargets : [];
    const policyOverrides = normalizeBatchPolicy(parsed?.policy);

    return {
      isBatchMode: true,
      items: items.map((item, index) => normalizeBatchItem(item, index)),
      wikiTargets: wikiTargets.map((target, index) => normalizeBatchTarget(target, index)),
      policyOverrides,
      batchPath,
    };
  }

  return {
    isBatchMode: false,
    items: [
      {
        bucket: values.bucket,
        slug: values.slug,
        title: values.title,
        summary: values.summary,
        source: values.source,
        skipRawCapture: false,
        wikiDir: values["wiki-dir"],
        wikiSlug: values["wiki-slug"],
        wikiTitle: values["wiki-title"],
        wikiTargetId: null,
      },
    ],
    wikiTargets: [],
    policyOverrides: null,
    batchPath: null,
  };
}

function resolveSourcePath(sourceValue) {
  if (!sourceValue) {
    return null;
  }

  const absolutePath = path.resolve(process.cwd(), sourceValue);
  return existsSync(absolutePath) ? absolutePath : null;
}

function normalizePlanItem(inputItem, index) {
  const skipRawCapture = Boolean(inputItem.skipRawCapture);

  if (!skipRawCapture && (!inputItem.bucket || !availableBuckets.includes(inputItem.bucket))) {
    fail(`Item ${index + 1}: bucket is required and must be one of: ${availableBuckets.join(", ")}`);
  }

  if (!inputItem.title) {
    fail(`Item ${index + 1}: title is required.`);
  }

  const rawSlug = inputItem.slug ? slugify(inputItem.slug) : slugify(inputItem.title);
  if (!rawSlug) {
    fail(`Item ${index + 1}: could not derive a valid slug. Pass slug explicitly.`);
  }

  const hasInlineWikiConfig = Boolean(inputItem.wikiDir || inputItem.wikiSlug || inputItem.wikiTitle);
  if (inputItem.wikiTargetId && hasInlineWikiConfig) {
    fail(`Item ${index + 1}: use either wikiTargetId or inline wikiDir/wikiSlug/wikiTitle, not both.`);
  }

  const sourcePath = resolveSourcePath(inputItem.source);
  if (skipRawCapture && !sourcePath) {
    fail(`Item ${index + 1}: skipRawCapture items require a valid source path.`);
  }
  if (skipRawCapture && !inputItem.wikiTargetId && !hasInlineWikiConfig) {
    fail(`Item ${index + 1}: skipRawCapture items require wikiTargetId or inline wiki target config.`);
  }

  const rawDir = skipRawCapture ? null : path.join(rawRoot, inputItem.bucket);
  const rawFile = skipRawCapture ? null : path.join(rawDir, `${rawSlug}.md`);
  const rawRelativePath = rawFile ? toPosixPath(path.relative(knowledgeRoot, rawFile)) : null;
  const sourceRelativeFromRaw = rawDir && sourcePath ? toPosixPath(path.relative(rawDir, sourcePath)) : null;

  return {
    index,
    bucket: inputItem.bucket ?? null,
    slug: rawSlug,
    title: inputItem.title,
    summary: inputItem.summary ?? "TODO: summarize this source.",
    skipRawCapture,
    sourcePath,
    sourceRelativeFromRaw,
    sourceRepoRelativePath: sourcePath ? toPosixPath(path.relative(process.cwd(), sourcePath)) : null,
    rawDir,
    rawFile,
    rawRelativePath,
    rawAlreadyExists: rawFile ? existsSync(rawFile) : false,
    wikiTargetId: inputItem.wikiTargetId ?? null,
    inlineWikiConfig: hasInlineWikiConfig
      ? {
          wikiDir: inputItem.wikiDir,
          wikiSlug: inputItem.wikiSlug,
          wikiTitle: inputItem.wikiTitle ?? inputItem.title,
        }
      : null,
  };
}

function normalizeWikiTargetDefinition(rawTarget, targetIndex) {
  if (!rawTarget.id) {
    fail(`wikiTargets[${targetIndex}] must include id.`);
  }
  if (!rawTarget.wikiDir || !wikiCategoryOrder.includes(rawTarget.wikiDir)) {
    fail(`wikiTargets[${targetIndex}] must include wikiDir from: ${wikiCategoryOrder.join(", ")}`);
  }

  const wikiSlug = rawTarget.wikiSlug ? slugify(rawTarget.wikiSlug) : slugify(rawTarget.wikiTitle ?? rawTarget.id);
  if (!wikiSlug) {
    fail(`wikiTargets[${targetIndex}] could not derive a valid wiki slug.`);
  }

  const wikiTitle = rawTarget.wikiTitle ?? rawTarget.id;
  if (!wikiTitle) {
    fail(`wikiTargets[${targetIndex}] must include wikiTitle.`);
  }

  const wikiDir = path.join(wikiRoot, rawTarget.wikiDir);
  const wikiFile = path.join(wikiDir, `${wikiSlug}.md`);
  const wikiRelativePath = toPosixPath(path.relative(knowledgeRoot, wikiFile));

  return {
    id: rawTarget.id,
    wikiDir,
    wikiFile,
    wikiRelativePath,
    wikiTitle,
    wikiCategory: rawTarget.wikiDir,
    wikiAlreadyExists: existsSync(wikiFile),
    items: [],
  };
}

function scoreWikiTargets(leftTarget, rightTarget) {
  let score = 0;
  score += countTokenOverlap(leftTarget.titleTokens, rightTarget.titleTokens) * 6;
  score += countTokenOverlap(leftTarget.sourceTokens, rightTarget.sourceTokens) * 3;
  if (leftTarget.wikiCategory === rightTarget.wikiCategory) {
    score += 1;
  }
  return score;
}

function scoreExistingWikiSuggestion(target, meta) {
  let score = 0;
  score += countTokenOverlap(target.titleTokens, meta.titleTokens) * 6;
  score += countTokenOverlap(target.sourceTokens, meta.referenceTokens) * 3;
  if (target.sourceRepoRelativePaths.some((reference) => meta.references.includes(reference))) {
    score += 12;
  }
  if (target.wikiCategory === meta.category) {
    score += 1;
  }
  return score;
}

function mergeSectionLinks(content, heading, linksToAdd) {
  const currentSection = extractSection(content, heading);
  const existingLinks = extractMarkdownLinkMap(currentSection);
  const merged = new Map(existingLinks.map((link) => [link.key, link]));

  for (const link of linksToAdd) {
    merged.set(`${link.label}::${link.target}`, link);
  }

  const mergedLinks = [...merged.values()].sort((left, right) => left.label.localeCompare(right.label));
  const body = mergedLinks.length > 0
    ? mergedLinks.map((link) => `- [${link.label}](${link.target})`).join("\n")
    : "- TODO";

  return replaceSection(content, heading, body);
}

function updateLastReviewed(content) {
  return replaceSection(content, "## Last Reviewed", `- ${today}`);
}

function buildWikiSources(target) {
  const sourceLinks = [];
  for (const item of target.items) {
    if (item.rawFile) {
      sourceLinks.push({
        label: item.title,
        target: toPosixPath(path.relative(target.wikiDir, item.rawFile)),
      });
      continue;
    }

    if (item.sourcePath && item.sourceRepoRelativePath) {
      sourceLinks.push({
        label: item.title,
        target: toPosixPath(path.relative(target.wikiDir, item.sourcePath)),
      });
    }
  }

  for (const item of target.items) {
    if (item.skipRawCapture || !item.sourcePath || !item.sourceRepoRelativePath) {
      continue;
    }
    sourceLinks.push({
      label: `Canonical source: ${item.sourceRepoRelativePath}`,
      target: toPosixPath(path.relative(target.wikiDir, item.sourcePath)),
    });
  }

  return sourceLinks;
}

function buildWikiDraft(target) {
  const relatedPageLines = target.relatedPages.length > 0
    ? target.relatedPages.map((page) => `- [${page.label}](${page.target})`)
    : ["- TODO"];
  const sourceLines = target.sourceLinks.length > 0
    ? target.sourceLinks.map((link) => `- [${link.label}](${link.target})`)
    : ["- TODO"];

  return `# ${target.wikiTitle}

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
`;
}

function buildRawDraft(item) {
  if (item.skipRawCapture) {
    return null;
  }

  return [
    `# ${item.title}`,
    "",
    "## Summary",
    "",
    item.summary,
    "",
    "## Source Reference",
    "",
    item.sourceRelativeFromRaw ? `- [Canonical source](${item.sourceRelativeFromRaw})` : "- Manual capture / no canonical source path supplied yet.",
    "",
    "## Notes",
    "",
    "- TODO",
    "",
    "## Related Wiki Pages",
    "",
    ...(item.relatedWikiEntries.length > 0
      ? item.relatedWikiEntries.map((entry) => `- [${entry.label}](${entry.target})`)
      : ["- TODO"]),
    "",
    "## Captured At",
    "",
    `- ${today}`,
    "",
  ].join("\n");
}

function formatLogEntry(item) {
  const details = [];

  if (item.rawRelativePath) {
    const titleLink = `[${item.title}](${item.rawRelativePath})`;
    details.push(`captured ${titleLink} in \`${item.bucket}\``);
  } else {
    details.push(`referenced \`${item.sourceRepoRelativePath}\` as "${item.title}"`);
  }

  if (item.sourceRepoRelativePath) {
    if (item.rawRelativePath) {
      details.push(`from \`${item.sourceRepoRelativePath}\``);
    }
  }

  if (item.wikiTarget) {
    details.push(`and ${item.wikiTarget.wikiAlreadyExists ? "updated" : "seeded"} [${item.wikiTarget.wikiTitle}](${item.wikiTarget.wikiRelativePath})`);
  }

  if (item.totalSuggestionCount > 0) {
    details.push(`with ${item.totalSuggestionCount} related-page suggestion${item.totalSuggestionCount === 1 ? "" : "s"}`);
  }

  return `- ${details.join(" ")}.`;
}

function appendKnowledgeLog(logEntries) {
  const current = readFileSync(knowledgeLogFile, "utf8").replaceAll("\r\n", "\n");
  const lines = current.split("\n");
  const heading = `## ${today}`;
  const headingIndex = lines.findIndex((line) => line.trim() === heading);

  if (headingIndex !== -1) {
    let insertIndex = headingIndex + 1;
    while (insertIndex < lines.length && lines[insertIndex].trim() === "") {
      insertIndex += 1;
    }
    lines.splice(insertIndex, 0, ...logEntries, "");
    writeFileSync(knowledgeLogFile, `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`, "utf8");
    return;
  }

  const nextContent = [
    "# Knowledge Log",
    "",
    heading,
    "",
    ...logEntries,
    "",
    current.replace(/^# Knowledge Log\s*/, "").trimStart(),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  writeFileSync(knowledgeLogFile, `${nextContent}\n`, "utf8");
}

function buildPlan(input) {
  const items = input.items.map((item, index) => normalizePlanItem(item, index));
  const conflicts = [];

  const rawTargets = new Map();
  for (const item of items) {
    if (item.skipRawCapture) {
      continue;
    }
    if (item.rawAlreadyExists) {
      conflicts.push(`Raw note already exists for item ${item.index + 1}: ${item.rawRelativePath}`);
    }
    if (rawTargets.has(item.rawRelativePath)) {
      conflicts.push(
        `Duplicate raw note target in batch: ${item.rawRelativePath} (items ${rawTargets.get(item.rawRelativePath)} and ${item.index + 1})`,
      );
    } else {
      rawTargets.set(item.rawRelativePath, item.index + 1);
    }
  }

  const wikiTargetsById = new Map();
  const wikiTargetsByRelativePath = new Map();

  for (let index = 0; index < input.wikiTargets.length; index += 1) {
    const target = normalizeWikiTargetDefinition(input.wikiTargets[index], index);
    if (wikiTargetsById.has(target.id)) {
      conflicts.push(`Duplicate wiki target id in batch: ${target.id}`);
      continue;
    }
    if (wikiTargetsByRelativePath.has(target.wikiRelativePath)) {
      conflicts.push(
        `Duplicate wiki target path in batch: ${target.wikiRelativePath} (${wikiTargetsByRelativePath.get(target.wikiRelativePath)} and ${target.id})`,
      );
      continue;
    }
    wikiTargetsById.set(target.id, target);
    wikiTargetsByRelativePath.set(target.wikiRelativePath, target.id);
  }

  for (const item of items) {
    if (item.inlineWikiConfig) {
      const implicitTarget = normalizeWikiTargetDefinition(
        {
          id: `item-${item.index + 1}`,
          ...item.inlineWikiConfig,
        },
        item.index,
      );
      if (wikiTargetsByRelativePath.has(implicitTarget.wikiRelativePath)) {
        conflicts.push(
          `Duplicate wiki target path in batch: ${implicitTarget.wikiRelativePath} (${wikiTargetsByRelativePath.get(implicitTarget.wikiRelativePath)} and item-${item.index + 1})`,
        );
        continue;
      }
      wikiTargetsById.set(implicitTarget.id, implicitTarget);
      wikiTargetsByRelativePath.set(implicitTarget.wikiRelativePath, implicitTarget.id);
      item.wikiTargetId = implicitTarget.id;
    }

    if (item.wikiTargetId) {
      const target = wikiTargetsById.get(item.wikiTargetId);
      if (!target) {
        conflicts.push(`Item ${item.index + 1}: unknown wikiTargetId "${item.wikiTargetId}".`);
        continue;
      }
      target.items.push(item);
      item.wikiTarget = target;
    }
  }

  for (const [id, target] of wikiTargetsById) {
    if (target.items.length === 0) {
      conflicts.push(`Wiki target "${id}" is defined but no batch item references it.`);
    }
  }

  if (conflicts.length > 0) {
    return {
      items,
      wikiTargets: [],
      conflicts,
      backlinkPlans: [],
      groupedBacklinkPlans: new Map(),
      logEntries: [],
    };
  }

  const wikiTargets = [...wikiTargetsById.values()];
  const batchWikiRelativePaths = wikiTargets.map((target) => target.wikiRelativePath);
  const existingWikiMetas = getWikiPageMetas().filter((meta) => !batchWikiRelativePaths.includes(meta.relativePath));

  for (const target of wikiTargets) {
    target.titleTokens = tokenizeForSimilarity([target.wikiTitle, ...target.items.map((item) => item.title)].join(" "));
    target.sourceRepoRelativePaths = target.items
      .map((item) => item.sourceRepoRelativePath)
      .filter(Boolean);
    target.sourceTokens = [...new Set(target.sourceRepoRelativePaths.flatMap((reference) => tokenizeForSimilarity(reference)))];

    target.existingSuggestions = existingWikiMetas
      .map((meta) => ({
        ...meta,
        score: scoreExistingWikiSuggestion(target, meta),
      }))
      .filter((meta) => meta.score > 0)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, 3);
  }

  for (const target of wikiTargets) {
    target.plannedBatchSuggestions = wikiTargets
      .filter((candidate) => candidate.wikiRelativePath !== target.wikiRelativePath)
      .map((candidate) => ({
        ...candidate,
        score: scoreWikiTargets(target, candidate),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.wikiTitle.localeCompare(right.wikiTitle))
      .slice(0, 3);

    target.relatedPages = [];
    for (const page of target.existingSuggestions) {
      pushUniqueRelatedEntry(target.relatedPages, {
        label: page.title,
        target: toPosixPath(path.relative(target.wikiDir, path.join(knowledgeRoot, page.relativePath))),
        relativePath: page.relativePath,
        type: "existing",
      });
    }
    for (const page of target.plannedBatchSuggestions) {
      pushUniqueRelatedEntry(target.relatedPages, {
        label: page.wikiTitle,
        target: toPosixPath(path.relative(target.wikiDir, page.wikiFile)),
        relativePath: page.wikiRelativePath,
        type: "planned",
      });
    }

    target.sourceLinks = buildWikiSources(target);
    target.wikiDraft = target.wikiAlreadyExists ? null : buildWikiDraft(target);
  }

  const backlinkPlans = [];
  const groupedBacklinkPlans = new Map();

  for (const target of wikiTargets) {
    if (target.wikiAlreadyExists) {
      continue;
    }

    for (const page of target.existingSuggestions) {
      const backlinkTarget = toPosixPath(path.relative(path.dirname(page.file), target.wikiFile));
      const backlinkPlan = {
        wikiPage: page.relativePath,
        file: page.file,
        label: target.wikiTitle,
        target: backlinkTarget,
      };
      backlinkPlans.push(backlinkPlan);

      if (!groupedBacklinkPlans.has(page.file)) {
        groupedBacklinkPlans.set(page.file, []);
      }
      groupedBacklinkPlans.get(page.file).push({
        label: target.wikiTitle,
        target: backlinkTarget,
      });
    }
  }

  for (const item of items) {
    item.relatedWikiEntries = [];
    if (item.wikiTarget) {
      pushUniqueRelatedEntry(item.relatedWikiEntries, {
        label: item.wikiTarget.wikiTitle,
        target: item.rawDir
          ? toPosixPath(path.relative(item.rawDir, item.wikiTarget.wikiFile))
          : toPosixPath(path.relative(path.dirname(item.sourcePath), item.wikiTarget.wikiFile)),
      });

      for (const page of item.wikiTarget.existingSuggestions) {
        pushUniqueRelatedEntry(item.relatedWikiEntries, {
          label: page.title,
          target: item.rawDir
            ? toPosixPath(path.relative(item.rawDir, path.join(knowledgeRoot, page.relativePath)))
            : toPosixPath(path.relative(path.dirname(item.sourcePath), path.join(knowledgeRoot, page.relativePath))),
        });
      }

      for (const page of item.wikiTarget.plannedBatchSuggestions) {
        pushUniqueRelatedEntry(item.relatedWikiEntries, {
          label: page.wikiTitle,
          target: item.rawDir
            ? toPosixPath(path.relative(item.rawDir, page.wikiFile))
            : toPosixPath(path.relative(path.dirname(item.sourcePath), page.wikiFile)),
        });
      }

      item.totalSuggestionCount = item.wikiTarget.existingSuggestions.length + item.wikiTarget.plannedBatchSuggestions.length;
    } else {
      item.totalSuggestionCount = 0;
    }

    item.rawDraft = buildRawDraft(item);
  }

  return {
    items,
    wikiTargets,
    conflicts: [],
    backlinkPlans,
    groupedBacklinkPlans,
    logEntries: items.map((item) => formatLogEntry(item)),
  };
}

function printDryRun(plan, isBatchMode) {
  console.log("[wiki-ingest] Dry run: no files were written.");
  console.log(`[wiki-ingest] Mode: ${isBatchMode ? "batch" : "single"} (${plan.items.length} item${plan.items.length === 1 ? "" : "s"})`);

  for (const item of plan.items) {
  console.log(`[wiki-ingest] Item ${item.index + 1}: ${item.title}`);
    if (item.rawRelativePath) {
      console.log(`  raw: ${item.rawRelativePath}${item.rawAlreadyExists ? " (already exists)" : ""}`);
    } else {
      console.log("  raw: skipped (source-only merge)");
    }
    if (item.sourceRepoRelativePath) {
      console.log(`  source: ${item.sourceRepoRelativePath}`);
    }
    if (item.wikiTarget) {
      console.log(`  wiki target: ${item.wikiTarget.wikiRelativePath}${item.wikiTarget.wikiAlreadyExists ? " (existing)" : " (new)"}`);
      if (item.wikiTarget.items.length > 1) {
        console.log(`  wiki merge group: ${item.wikiTarget.items.length} items -> ${item.wikiTarget.wikiRelativePath}`);
      }
      if (item.wikiTarget.existingSuggestions.length > 0) {
        console.log(`  existing suggestions: ${item.wikiTarget.existingSuggestions.map((page) => page.relativePath).join(", ")}`);
      } else {
        console.log("  existing suggestions: none");
      }
      if (item.wikiTarget.plannedBatchSuggestions.length > 0) {
        console.log(`  batch suggestions: ${item.wikiTarget.plannedBatchSuggestions.map((page) => page.wikiRelativePath).join(", ")}`);
      } else if (isBatchMode) {
        console.log("  batch suggestions: none");
      }
    }
  }

  if (plan.wikiTargets.length > 0) {
    console.log("[wiki-ingest] Wiki merge targets:");
    for (const target of plan.wikiTargets) {
      console.log(
        `- ${target.wikiRelativePath}${target.wikiAlreadyExists ? " (existing)" : " (new)"} <= ${target.items
          .map((item) => item.rawRelativePath ?? item.sourceRepoRelativePath ?? item.title)
          .join(", ")}`,
      );
    }
  }

  console.log(
    `[wiki-ingest] Batch summary: ${plan.items.filter((item) => !item.skipRawCapture).length} raw note${
      plan.items.filter((item) => !item.skipRawCapture).length === 1 ? "" : "s"
    }, ${
      plan.wikiTargets.length
    } wiki target${plan.wikiTargets.length === 1 ? "" : "s"}, ${plan.backlinkPlans.length} backlink write${
      plan.backlinkPlans.length === 1 ? "" : "s"
    }, ${plan.logEntries.length} knowledge-log entr${plan.logEntries.length === 1 ? "y" : "ies"}.`,
  );

  if (plan.backlinkPlans.length > 0) {
    console.log("[wiki-ingest] Backlink plan:");
    for (const entry of plan.backlinkPlans) {
      console.log(`- ${entry.wikiPage} <= [${entry.label}](${entry.target})`);
    }
  }
}

function getItemDecision(item) {
  const actions = [];
  const reasons = [];

  if (item.skipRawCapture) {
    actions.push("skip_raw_capture");
    reasons.push("item merges canonical evidence directly into a wiki target");
  } else {
    actions.push("create_raw");
    reasons.push("item creates a durable raw note capture");
  }

  if (item.wikiTarget) {
    if (item.wikiTarget.wikiAlreadyExists) {
      actions.push("update_existing_wiki");
      reasons.push("wiki target already exists and will be refreshed");
    } else {
      actions.push("create_wiki");
      reasons.push("wiki target does not exist yet and will be seeded");
    }

    if (item.wikiTarget.items.length > 1) {
      actions.push("merge_into_shared_wiki");
      reasons.push(`wiki target merges ${item.wikiTarget.items.length} source items`);
    }

    if (!item.wikiTarget.wikiAlreadyExists && item.wikiTarget.existingSuggestions.length > 0) {
      actions.push("seed_backlinks");
      reasons.push("new wiki page will seed backlinks into suggested existing pages");
    }
  }

  if (item.totalSuggestionCount > 0) {
    actions.push("review_related_pages");
    reasons.push(`${item.totalSuggestionCount} related-page suggestion${item.totalSuggestionCount === 1 ? "" : "s"} detected`);
  }

  const severity = actions.some((action) =>
    ["update_existing_wiki", "merge_into_shared_wiki", "seed_backlinks", "review_related_pages"].includes(action),
  )
    ? "review"
    : "info";

  return { actions, reasons, severity };
}

function getWikiTargetDecision(target) {
  const actions = [target.wikiAlreadyExists ? "update_existing_wiki" : "create_wiki"];
  const reasons = [target.wikiAlreadyExists ? "target page already exists and will be refreshed" : "target page will be created from the ingest plan"];

  if (target.items.length > 1) {
    actions.push("merge_multiple_sources");
    reasons.push(`${target.items.length} source items converge on the same wiki target`);
  }

  const backlinkWrites = target.wikiAlreadyExists ? 0 : target.existingSuggestions.length;
  if (backlinkWrites > 0) {
    actions.push("seed_backlinks");
    reasons.push(`${backlinkWrites} existing page backlink${backlinkWrites === 1 ? "" : "s"} will be seeded`);
  }

  const suggestionCount = target.existingSuggestions.length + target.plannedBatchSuggestions.length;
  if (suggestionCount > 0) {
    actions.push("review_related_pages");
    reasons.push(`${suggestionCount} related-page suggestion${suggestionCount === 1 ? "" : "s"} attached to target`);
  }

  const severity = actions.some((action) =>
    ["update_existing_wiki", "merge_multiple_sources", "seed_backlinks", "review_related_pages"].includes(action),
  )
    ? "review"
    : "info";

  return { actions, reasons, severity };
}

function buildConfidence(level, reasons) {
  return { level, reasons };
}

function getItemConfidence(item, decision) {
  const reasons = [];
  let score = 0;

  if (item.sourceRepoRelativePath) {
    score += 1;
    reasons.push("item points to a canonical repo source");
  }

  if (!item.skipRawCapture) {
    score += 1;
    reasons.push("item preserves a durable raw capture");
  } else {
    reasons.push("item skips durable raw capture and relies on direct canonical merge");
  }

  if (item.wikiTarget?.wikiAlreadyExists) {
    score -= 1;
    reasons.push("item updates an existing wiki page");
  }

  if (item.wikiTarget && item.wikiTarget.items.length > 1) {
    score -= 1;
    reasons.push("item participates in a shared merge group");
  }

  if (item.totalSuggestionCount > 0) {
    score -= 1;
    reasons.push("item carries related-page suggestions that may need judgment");
  }

  if (decision.actions.includes("seed_backlinks")) {
    score -= 1;
    reasons.push("item seeds backlinks into existing pages");
  }

  if (score >= 2) {
    return buildConfidence("high", reasons);
  }
  if (score >= 0) {
    return buildConfidence("medium", reasons);
  }
  return buildConfidence("low", reasons);
}

function getWikiTargetConfidence(target, decision) {
  const reasons = [];
  let score = 0;

  if (!target.wikiAlreadyExists) {
    score += 1;
    reasons.push("target creates a new wiki page instead of mutating an existing one");
  } else {
    reasons.push("target mutates an existing wiki page");
  }

  if (target.items.length === 1) {
    score += 1;
    reasons.push("target has a single source item");
  } else {
    score -= 1;
    reasons.push("target merges multiple source items");
  }

  if (target.existingSuggestions.length === 0 && target.plannedBatchSuggestions.length === 0) {
    score += 1;
    reasons.push("target has no related-page suggestions to review");
  } else {
    score -= 1;
    reasons.push("target carries related-page suggestions");
  }

  if (decision.actions.includes("seed_backlinks")) {
    score -= 1;
    reasons.push("target will seed backlinks into existing pages");
  }

  if (score >= 2) {
    return buildConfidence("high", reasons);
  }
  if (score >= 0) {
    return buildConfidence("medium", reasons);
  }
  return buildConfidence("low", reasons);
}

function buildPolicy(status, reasons) {
  return {
    status,
    autoApply: status === "auto_apply_safe",
    requiresReview: status !== "auto_apply_safe",
    reasons,
    overrideViolations: [],
  };
}

function getItemPolicy(item, decision, confidence) {
  const reasons = [];

  if (decision.severity === "review") {
    reasons.push("decision severity requires review");
  }
  if (confidence.level !== "high") {
    reasons.push(`confidence is ${confidence.level}`);
  }
  if (item.wikiTarget?.wikiAlreadyExists) {
    reasons.push("existing wiki targets should be reviewed before apply");
  }
  if (item.wikiTarget && item.wikiTarget.items.length > 1) {
    reasons.push("shared wiki merges should be reviewed before apply");
  }
  if (item.skipRawCapture) {
    reasons.push("source-only merges should be reviewed before apply");
  }

  if (reasons.length === 0) {
    return buildPolicy("auto_apply_safe", ["new raw/wiki capture with high confidence and no review signals"]);
  }

  return buildPolicy("review_required", reasons);
}

function getWikiTargetPolicy(target, decision, confidence) {
  const reasons = [];

  if (decision.severity === "review") {
    reasons.push("decision severity requires review");
  }
  if (confidence.level !== "high") {
    reasons.push(`confidence is ${confidence.level}`);
  }
  if (target.wikiAlreadyExists) {
    reasons.push("existing wiki targets should be reviewed before apply");
  }
  if (target.items.length > 1) {
    reasons.push("multi-source wiki merges should be reviewed before apply");
  }
  if (decision.actions.includes("seed_backlinks")) {
    reasons.push("backlink seeding touches additional wiki pages");
  }

  if (reasons.length === 0) {
    return buildPolicy("auto_apply_safe", ["new wiki target with isolated source coverage and no backlink side effects"]);
  }

  return buildPolicy("review_required", reasons);
}

function applyPolicyOverrides(serializedItems, serializedTargets, serializedBacklinkPlan, policyOverrides) {
  if (!policyOverrides) {
    return { itemViolations: new Map(), targetViolations: new Map(), summaryViolations: [] };
  }

  const itemViolations = new Map();
  const targetViolations = new Map();
  const summaryViolations = [];

  const pushItemViolation = (index, reason) => {
    if (!itemViolations.has(index)) {
      itemViolations.set(index, []);
    }
    itemViolations.get(index).push(reason);
  };

  const pushTargetViolation = (id, reason) => {
    if (!targetViolations.has(id)) {
      targetViolations.set(id, []);
    }
    targetViolations.get(id).push(reason);
  };

  for (const item of serializedItems) {
    if (!policyOverrides.allowSkipRawCapture && item.skipRawCapture) {
      pushItemViolation(item.index, "skipRawCapture is disabled by batch policy");
    }
    if (!policyOverrides.allowExistingWikiUpdate && item.wikiTarget?.exists) {
      pushItemViolation(item.index, "existing wiki updates are disabled by batch policy");
    }
  }

  for (const target of serializedTargets) {
    if (!policyOverrides.allowExistingWikiUpdate && target.exists) {
      pushTargetViolation(target.id, "existing wiki updates are disabled by batch policy");
    }
    if (!policyOverrides.allowBacklinkSeeding && target.decision.actions.includes("seed_backlinks")) {
      pushTargetViolation(target.id, "backlink seeding is disabled by batch policy");
    }
  }

  if (!policyOverrides.allowBacklinkSeeding && serializedBacklinkPlan.length > 0) {
    summaryViolations.push(`${serializedBacklinkPlan.length} backlink write${serializedBacklinkPlan.length === 1 ? "" : "s"} exceed allowBacklinkSeeding=false`);
  }

  const reviewItemCount = serializedItems.filter((item) => item.policy.requiresReview).length;
  if (policyOverrides.maxReviewItems !== null && reviewItemCount > policyOverrides.maxReviewItems) {
    summaryViolations.push(`review-required items ${reviewItemCount} exceed maxReviewItems=${policyOverrides.maxReviewItems}`);
  }

  const reviewTargetCount = serializedTargets.filter((target) => target.policy.requiresReview).length;
  if (policyOverrides.maxReviewTargets !== null && reviewTargetCount > policyOverrides.maxReviewTargets) {
    summaryViolations.push(`review-required wiki targets ${reviewTargetCount} exceed maxReviewTargets=${policyOverrides.maxReviewTargets}`);
  }

  return { itemViolations, targetViolations, summaryViolations };
}

function buildDecisionSummary(plan) {
  const itemActions = {
    createRaw: 0,
    skipRawCapture: 0,
    attachToWikiTarget: 0,
    mergeIntoSharedWiki: 0,
    reviewRelatedPages: 0,
  };
  const targetActions = {
    createWiki: 0,
    updateExistingWiki: 0,
    mergeMultipleSources: 0,
    seedBacklinks: 0,
    reviewRelatedPages: 0,
  };

  for (const item of plan.items) {
    const decision = getItemDecision(item);
    for (const action of decision.actions) {
      if (action === "create_raw") itemActions.createRaw += 1;
      if (action === "skip_raw_capture") itemActions.skipRawCapture += 1;
      if (action === "create_wiki" || action === "update_existing_wiki") itemActions.attachToWikiTarget += 1;
      if (action === "merge_into_shared_wiki") itemActions.mergeIntoSharedWiki += 1;
      if (action === "review_related_pages") itemActions.reviewRelatedPages += 1;
    }
  }

  for (const target of plan.wikiTargets) {
    const decision = getWikiTargetDecision(target);
    for (const action of decision.actions) {
      if (action === "create_wiki") targetActions.createWiki += 1;
      if (action === "update_existing_wiki") targetActions.updateExistingWiki += 1;
      if (action === "merge_multiple_sources") targetActions.mergeMultipleSources += 1;
      if (action === "seed_backlinks") targetActions.seedBacklinks += 1;
      if (action === "review_related_pages") targetActions.reviewRelatedPages += 1;
    }
  }

  return { itemActions, targetActions };
}

function buildPolicySummary(serializedItems, serializedTargets, serializedBacklinkPlan, policyOverrides) {
  const itemPolicies = {
    autoApplySafe: serializedItems.filter((item) => item.policy.autoApply).length,
    reviewRequired: serializedItems.filter((item) => item.policy.requiresReview).length,
  };
  const targetPolicies = {
    autoApplySafe: serializedTargets.filter((target) => target.policy.autoApply).length,
    reviewRequired: serializedTargets.filter((target) => target.policy.requiresReview).length,
  };
  const globalReasons = [];

  if (itemPolicies.reviewRequired > 0) {
    globalReasons.push(`${itemPolicies.reviewRequired} item policy decision${itemPolicies.reviewRequired === 1 ? "" : "s"} require review`);
  }
  if (targetPolicies.reviewRequired > 0) {
    globalReasons.push(`${targetPolicies.reviewRequired} wiki target policy decision${targetPolicies.reviewRequired === 1 ? "" : "s"} require review`);
  }
  if (serializedBacklinkPlan.length > 0) {
    globalReasons.push(`${serializedBacklinkPlan.length} backlink write${serializedBacklinkPlan.length === 1 ? "" : "s"} will touch additional wiki pages`);
  }

  const { summaryViolations } = applyPolicyOverrides(serializedItems, serializedTargets, serializedBacklinkPlan, policyOverrides);
  const policyReasons = [...summaryViolations, ...globalReasons];

  return {
    status: summaryViolations.length > 0 ? "blocked_by_policy" : globalReasons.length === 0 ? "auto_apply_safe" : "review_required",
    autoApply: summaryViolations.length === 0 && globalReasons.length === 0,
    requiresReview: policyReasons.length > 0,
    reasons: policyReasons.length > 0 ? policyReasons : ["plan contains only high-confidence isolated writes"],
    overrideViolations: summaryViolations,
    itemPolicies,
    targetPolicies,
  };
}

function serializeDryRunPlan(plan, input) {
  const decisionSummary = buildDecisionSummary(plan);
  const serializedItems = plan.items.map((item) => {
    const decision = getItemDecision(item);
    const confidence = getItemConfidence(item, decision);

    return {
      index: item.index + 1,
      title: item.title,
      raw: item.rawRelativePath,
      rawAlreadyExists: item.rawAlreadyExists,
      skipRawCapture: item.skipRawCapture,
      source: item.sourceRepoRelativePath,
      wikiTarget: item.wikiTarget
        ? {
            id: item.wikiTarget.id,
            relativePath: item.wikiTarget.wikiRelativePath,
            exists: item.wikiTarget.wikiAlreadyExists,
            itemCount: item.wikiTarget.items.length,
          }
        : null,
      decision,
      confidence,
      policy: getItemPolicy(item, decision, confidence),
      existingSuggestions: item.wikiTarget ? item.wikiTarget.existingSuggestions.map((page) => page.relativePath) : [],
      batchSuggestions: item.wikiTarget ? item.wikiTarget.plannedBatchSuggestions.map((page) => page.wikiRelativePath) : [],
      totalSuggestionCount: item.totalSuggestionCount,
    };
  });

  const serializedTargets = plan.wikiTargets.map((target) => {
    const decision = getWikiTargetDecision(target);
    const confidence = getWikiTargetConfidence(target, decision);

    return {
      id: target.id,
      relativePath: target.wikiRelativePath,
      exists: target.wikiAlreadyExists,
      sourceItems: target.items.map((item) => item.rawRelativePath ?? item.sourceRepoRelativePath ?? item.title),
      decision,
      confidence,
      policy: getWikiTargetPolicy(target, decision, confidence),
      existingSuggestions: target.existingSuggestions.map((page) => page.relativePath),
      batchSuggestions: target.plannedBatchSuggestions.map((page) => page.wikiRelativePath),
    };
  });

  const serializedBacklinkPlan = plan.backlinkPlans.map((entry) => ({
    wikiPage: entry.wikiPage,
    label: entry.label,
    target: entry.target,
    action: "seed_backlink",
    severity: "review",
    policy: buildPolicy("review_required", ["backlink writes touch existing wiki pages"]),
  }));

  const { itemViolations, targetViolations } = applyPolicyOverrides(
    serializedItems,
    serializedTargets,
    serializedBacklinkPlan,
    input.policyOverrides,
  );

  for (const item of serializedItems) {
    const overrideViolations = itemViolations.get(item.index) ?? [];
    if (overrideViolations.length > 0) {
      item.policy.overrideViolations = overrideViolations;
      item.policy.status = "blocked_by_policy";
      item.policy.autoApply = false;
      item.policy.requiresReview = true;
      item.policy.reasons = [...item.policy.reasons, ...overrideViolations];
    }
  }

  for (const target of serializedTargets) {
    const overrideViolations = targetViolations.get(target.id) ?? [];
    if (overrideViolations.length > 0) {
      target.policy.overrideViolations = overrideViolations;
      target.policy.status = "blocked_by_policy";
      target.policy.autoApply = false;
      target.policy.requiresReview = true;
      target.policy.reasons = [...target.policy.reasons, ...overrideViolations];
    }
  }

  const policySummary = buildPolicySummary(
    serializedItems,
    serializedTargets,
    serializedBacklinkPlan,
    input.policyOverrides,
  );

  return {
    mode: input.isBatchMode ? "batch" : "single",
    batchPath: input.batchPath ? toPosixPath(path.relative(process.cwd(), input.batchPath)) : null,
    policyOverrides: input.policyOverrides,
    items: serializedItems,
    wikiTargets: serializedTargets,
    backlinkPlan: serializedBacklinkPlan,
    summary: {
      rawNotes: plan.items.filter((item) => !item.skipRawCapture).length,
      wikiTargets: plan.wikiTargets.length,
      backlinkWrites: plan.backlinkPlans.length,
      knowledgeLogEntries: plan.logEntries.length,
    },
    decisionSummary,
    policySummary,
  };
}

function enforcePolicyIfNeeded(serializedPlan) {
  if (!values["enforce-policy"]) {
    return;
  }

  if (serializedPlan.policySummary?.status === "blocked_by_policy") {
    if (outputFormat === "json" && !values["dry-run"]) {
      console.log(JSON.stringify(serializedPlan, null, 2));
    }
    console.error("[wiki-ingest] Dry-run plan is blocked by batch policy overrides.");
    process.exit(2);
  }
}

function writeSerializedPlanReport(serializedPlan) {
  if (!values["report-file"]) {
    return;
  }

  const reportPath = path.resolve(process.cwd(), values["report-file"]);
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(serializedPlan, null, 2)}\n`, "utf8");
}

function writePlan(plan) {
  for (const item of plan.items) {
    if (!item.skipRawCapture) {
      mkdirSync(item.rawDir, { recursive: true });
      writeFileSync(item.rawFile, `${item.rawDraft}\n`, "utf8");
    }
  }

  for (const target of plan.wikiTargets) {
    if (!target.wikiAlreadyExists) {
      mkdirSync(target.wikiDir, { recursive: true });
      writeFileSync(target.wikiFile, target.wikiDraft, "utf8");
      continue;
    }

    let current = readFileSync(target.wikiFile, "utf8");
    current = mergeRelatedPageLinks(current, target.relatedPages);
    current = mergeSectionLinks(current, "## Sources", target.sourceLinks);
    current = updateLastReviewed(current);
    writeFileSync(target.wikiFile, current, "utf8");
  }

  for (const [wikiFile, linksToAdd] of plan.groupedBacklinkPlans) {
    const current = readFileSync(wikiFile, "utf8");
    const next = mergeRelatedPageLinks(current, linksToAdd);
    if (next !== current) {
      writeFileSync(wikiFile, next, "utf8");
    }
  }

  appendKnowledgeLog(plan.logEntries);
  writeFileSync(knowledgeIndexFile, renderKnowledgeIndex(), "utf8");
}

const input = loadInput();
const plan = buildPlan(input);
const dryRun = values["dry-run"];

if (plan.conflicts.length > 0) {
  for (const conflict of plan.conflicts) {
    console.error(`[wiki-ingest] ${conflict}`);
  }
  process.exit(1);
}

if (dryRun) {
  const serializedPlan = serializeDryRunPlan(plan, input);
  writeSerializedPlanReport(serializedPlan);
  if (outputFormat === "json") {
    console.log(JSON.stringify(serializedPlan, null, 2));
  } else {
    printDryRun(plan, input.isBatchMode);
  }
  enforcePolicyIfNeeded(serializedPlan);
  process.exit(0);
}

const serializedPlan = serializeDryRunPlan(plan, input);
writeSerializedPlanReport(serializedPlan);
enforcePolicyIfNeeded(serializedPlan);

writePlan(plan);
console.log(
  `[wiki-ingest] Wrote ${plan.items.filter((item) => !item.skipRawCapture).length} raw note${
    plan.items.filter((item) => !item.skipRawCapture).length === 1 ? "" : "s"
  } and updated ${
    plan.wikiTargets.length
  } wiki target${plan.wikiTargets.length === 1 ? "" : "s"}.`,
);
