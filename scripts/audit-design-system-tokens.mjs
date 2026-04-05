import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tokensDir = path.join(repoRoot, "src/design-system/tokens");
const tokenIndexPath = path.join(tokensDir, "index.ts");
const readmePath = path.join(repoRoot, "src/design-system/README.md");
const designSystemDocPath = path.join(repoRoot, "design-system.md");

const tokenFiles = readdirSync(tokensDir)
  .filter((entry) => entry.endsWith(".ts"))
  .filter((entry) => entry !== "index.ts")
  .sort();

const tokenBasenames = tokenFiles.map((entry) => path.basename(entry, ".ts"));

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function extractReadmeTokenList(markdown) {
  const match = markdown.match(/### Tokens\s+([\s\S]*?)\n### /);
  if (!match) {
    return [];
  }

  return uniqueSorted(
    match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- `") && line.endsWith("`"))
      .map((line) => line.replace(/^- `|`$/g, "")),
  );
}

function extractDesignSystemDocTokenPaths(markdown) {
  const match = markdown.match(/### Tokens\s+([\s\S]*?)\n### /);
  if (!match) {
    return [];
  }

  return uniqueSorted(
    match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- `src/design-system/tokens/"))
      .map((line) => line.replace(/^- `|`$/g, "")),
  );
}

function extractTokenIndexImports(source) {
  return uniqueSorted(
    [...source.matchAll(/from "\.\/([^"]+)"/g)].map((match) => match[1]),
  );
}

function extractDesignSystemTokenKeys(source) {
  const match = source.match(/export const designSystemTokens = \{([\s\S]*?)\} as const;/);
  if (!match) {
    return [];
  }

  return uniqueSorted(
    match[1]
      .split("\n")
      .map((line) => line.trim().replace(/,$/, ""))
      .filter(Boolean),
  );
}

function diff(expected, actual) {
  return {
    missing: expected.filter((value) => !actual.includes(value)),
    unexpected: actual.filter((value) => !expected.includes(value)),
  };
}

const tokenIndexSource = read(tokenIndexPath);
const readmeSource = read(readmePath);
const designSystemDocSource = read(designSystemDocPath);

const readmeTokens = extractReadmeTokenList(readmeSource);
const designSystemDocTokenPaths = extractDesignSystemDocTokenPaths(designSystemDocSource);
const tokenIndexImports = extractTokenIndexImports(tokenIndexSource);
const designSystemTokenKeys = extractDesignSystemTokenKeys(tokenIndexSource);

const expectedReadmeTokens = tokenFiles;
const expectedDesignSystemDocTokenPaths = tokenFiles.map(
  (entry) => `src/design-system/tokens/${entry}`,
);

const readmeDiff = diff(expectedReadmeTokens, readmeTokens);
const designSystemDocDiff = diff(expectedDesignSystemDocTokenPaths, designSystemDocTokenPaths);
const indexImportDiff = diff(tokenBasenames, tokenIndexImports);
const designSystemTokenKeyDiff = diff(tokenBasenames, designSystemTokenKeys);

const failed =
  readmeDiff.missing.length > 0 ||
  readmeDiff.unexpected.length > 0 ||
  designSystemDocDiff.missing.length > 0 ||
  designSystemDocDiff.unexpected.length > 0 ||
  indexImportDiff.missing.length > 0 ||
  indexImportDiff.unexpected.length > 0 ||
  designSystemTokenKeyDiff.missing.length > 0 ||
  designSystemTokenKeyDiff.unexpected.length > 0;

if (!failed) {
  console.log(
    `[tokens-audit] OK: ${tokenFiles.length} token files match the index export surface and DS docs.`,
  );
  process.exit(0);
}

function printDiff(label, valueDiff) {
  if (valueDiff.missing.length > 0) {
    console.error(`[tokens-audit] Missing ${label}:`);
    for (const value of valueDiff.missing) {
      console.error(`- ${value}`);
    }
  }

  if (valueDiff.unexpected.length > 0) {
    console.error(`[tokens-audit] Unexpected ${label}:`);
    for (const value of valueDiff.unexpected) {
      console.error(`- ${value}`);
    }
  }
}

printDiff("README token entries", readmeDiff);
printDiff("design-system.md token paths", designSystemDocDiff);
printDiff("token index imports", indexImportDiff);
printDiff("designSystemTokens keys", designSystemTokenKeyDiff);

process.exit(1);
