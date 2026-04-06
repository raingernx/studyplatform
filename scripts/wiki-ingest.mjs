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

    return {
      isBatchMode: true,
      items: items.map((item, index) => normalizeBatchItem(item, index)),
      wikiTargets: wikiTargets.map((target, index) => normalizeBatchTarget(target, index)),
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

function serializeDryRunPlan(plan, input) {
  return {
    mode: input.isBatchMode ? "batch" : "single",
    batchPath: input.batchPath ? toPosixPath(path.relative(process.cwd(), input.batchPath)) : null,
    items: plan.items.map((item) => ({
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
      existingSuggestions: item.wikiTarget ? item.wikiTarget.existingSuggestions.map((page) => page.relativePath) : [],
      batchSuggestions: item.wikiTarget ? item.wikiTarget.plannedBatchSuggestions.map((page) => page.wikiRelativePath) : [],
      totalSuggestionCount: item.totalSuggestionCount,
    })),
    wikiTargets: plan.wikiTargets.map((target) => ({
      id: target.id,
      relativePath: target.wikiRelativePath,
      exists: target.wikiAlreadyExists,
      sourceItems: target.items.map((item) => item.rawRelativePath ?? item.sourceRepoRelativePath ?? item.title),
      existingSuggestions: target.existingSuggestions.map((page) => page.relativePath),
      batchSuggestions: target.plannedBatchSuggestions.map((page) => page.wikiRelativePath),
    })),
    backlinkPlan: plan.backlinkPlans.map((entry) => ({
      wikiPage: entry.wikiPage,
      label: entry.label,
      target: entry.target,
    })),
    summary: {
      rawNotes: plan.items.filter((item) => !item.skipRawCapture).length,
      wikiTargets: plan.wikiTargets.length,
      backlinkWrites: plan.backlinkPlans.length,
      knowledgeLogEntries: plan.logEntries.length,
    },
  };
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
  if (outputFormat === "json") {
    console.log(JSON.stringify(serializeDryRunPlan(plan, input), null, 2));
  } else {
    printDryRun(plan, input.isBatchMode);
  }
  process.exit(0);
}

writePlan(plan);
console.log(
  `[wiki-ingest] Wrote ${plan.items.filter((item) => !item.skipRawCapture).length} raw note${
    plan.items.filter((item) => !item.skipRawCapture).length === 1 ? "" : "s"
  } and updated ${
    plan.wikiTargets.length
  } wiki target${plan.wikiTargets.length === 1 ? "" : "s"}.`,
);
