import { execFileSync } from "node:child_process";

const REMOTE_NAME = process.env.CPD_REMOTE ?? "origin";
const TARGET_BRANCH = process.env.CPD_BRANCH ?? "main";
const CANONICAL_REMOTE =
  process.env.CPD_CANONICAL_REMOTE ?? "https://github.com/raingernx/KRUKRAFT.git";

function run(command, args) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizeRemote(url) {
  return url
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function parseGitHubRepo(url) {
  const normalized = normalizeRemote(url);
  const prefix = "https://github.com/";
  if (!normalized.startsWith(prefix)) {
    throw new Error(`Unsupported remote URL for GitHub deployment checks: ${url}`);
  }

  const path = normalized.slice(prefix.length);
  const [owner, repo] = path.split("/");

  if (!owner || !repo) {
    throw new Error(`Could not parse owner/repo from remote URL: ${url}`);
  }

  return { owner, repo };
}

function fail(message) {
  console.error(`[cpd-verify] FAIL: ${message}`);
  process.exit(1);
}

const headSha = run("git", ["rev-parse", "HEAD"]);
const upstreamSha = run("git", ["rev-parse", `${REMOTE_NAME}/${TARGET_BRANCH}`]);
const remoteUrl = run("git", ["remote", "get-url", REMOTE_NAME]);
const normalizedRemote = normalizeRemote(remoteUrl);
const normalizedCanonicalRemote = normalizeRemote(CANONICAL_REMOTE);

if (normalizedRemote !== normalizedCanonicalRemote) {
  fail(
    `${REMOTE_NAME} points to ${remoteUrl} instead of ${CANONICAL_REMOTE}. Update the remote before calling CPD complete.`,
  );
}

if (headSha !== upstreamSha) {
  fail(
    `HEAD (${headSha.slice(0, 7)}) does not match ${REMOTE_NAME}/${TARGET_BRANCH} (${upstreamSha.slice(0, 7)}). Push has not completed.`,
  );
}

const { owner, repo } = parseGitHubRepo(CANONICAL_REMOTE);
const deploymentJson = run("gh", [
  "api",
  `repos/${owner}/${repo}/deployments?sha=${headSha}`,
]);

let deployments;
try {
  deployments = JSON.parse(deploymentJson);
} catch (error) {
  fail(`Could not parse GitHub deployment response for ${headSha.slice(0, 7)}.`);
}

if (!Array.isArray(deployments) || deployments.length === 0) {
  fail(
    `No GitHub deployment exists yet for ${headSha.slice(0, 7)}. Do not mark CPD complete until deployment evidence appears.`,
  );
}

const latestDeployment = deployments[0];

console.log(
  JSON.stringify(
    {
      ok: true,
      remote: remoteUrl,
      headSha,
      deploymentId: latestDeployment.id,
      environment: latestDeployment.environment,
      createdAt: latestDeployment.created_at,
    },
    null,
    2,
  ),
);
