import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightCliPath = require.resolve("@playwright/test/cli");
const forwardedArgs = process.argv.slice(2);
const originalHome = process.env.HOME ?? os.homedir();

const MAX_ATTEMPTS = Number(process.env.PLAYWRIGHT_LAUNCH_RETRY_ATTEMPTS ?? 3);
const BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH ??
  path.join(originalHome, "Library", "Caches", "ms-playwright");
const WEBKIT_FALLBACK_SPEC_PATTERNS = [
  /tests\/e2e\/settings-theme\.spec\.ts$/,
  /tests\/e2e\/auth-guards\.spec\.ts$/,
  /tests\/e2e\/navigation-shells\.spec\.ts$/,
];

function getSpecArgs() {
  return forwardedArgs.filter((arg) => /tests\/e2e\/.*\.spec\.ts$/.test(arg));
}

function isWebkitInstalled() {
  if (!existsSync(BROWSERS_PATH)) {
    return false;
  }

  return readdirSync(BROWSERS_PATH).some((entry) => entry.startsWith("webkit-"));
}

function resolveHeadlessShellExecutable() {
  if (!existsSync(BROWSERS_PATH)) {
    return null;
  }

  const bundleDir = readdirSync(BROWSERS_PATH)
    .filter((entry) => entry.startsWith("chromium_headless_shell-"))
    .sort()
    .at(-1);

  if (!bundleDir) {
    return null;
  }

  const executablePath = path.join(
    BROWSERS_PATH,
    bundleDir,
    "chrome-headless-shell-mac-arm64",
    "chrome-headless-shell",
  );

  return existsSync(executablePath) ? executablePath : null;
}

function shouldUseWebkitFallback() {
  const specArgs = getSpecArgs();
  return (
    specArgs.length > 0 &&
    specArgs.every((arg) =>
      WEBKIT_FALLBACK_SPEC_PATTERNS.some((pattern) => pattern.test(arg)),
    )
  );
}

function isHeadedRun() {
  return forwardedArgs.includes("--headed") || forwardedArgs.includes("--ui");
}

function buildArgs(attempt) {
  const args = [...forwardedArgs];

  const wantsWebkitFallback = attempt > 2 && shouldUseWebkitFallback();
  if (!wantsWebkitFallback) {
    return args;
  }

  const projectIndex = args.findIndex((arg) => arg === "--project");
  if (projectIndex !== -1 && projectIndex + 1 < args.length) {
    args[projectIndex + 1] = "webkit";
    return args;
  }

  const inlineProjectIndex = args.findIndex((arg) =>
    arg.startsWith("--project="),
  );
  if (inlineProjectIndex !== -1) {
    args[inlineProjectIndex] = "--project=webkit";
    return args;
  }

  return ["--project=webkit", ...args];
}

function looksLikeLaunchCrash(output) {
  const hasLaunchFailure = /browserType\.launch/i.test(output);
  const hasCrashSignal =
    /Crashpad/i.test(output) ||
    /Received signal 6/i.test(output) ||
    /signal=SIGABRT/i.test(output) ||
    /signal=SIGTRAP/i.test(output);
  const hasMacLaunchFatal =
    /MachPortRendezvousServer/i.test(output) ||
    /bootstrap_check_in/i.test(output) ||
    /Permission denied \(1100\)/i.test(output);

  return hasLaunchFailure && (hasCrashSignal || hasMacLaunchFatal);
}

function buildEnv(attempt) {
  const headlessShellExecutable = resolveHeadlessShellExecutable();

  return {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH,
    ...(attempt > 1 &&
    !isHeadedRun() &&
    headlessShellExecutable &&
    !process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { PLAYWRIGHT_EXECUTABLE_PATH: headlessShellExecutable }
      : {}),
    ...(attempt > 2 ? { PLAYWRIGHT_BROWSER_CHANNEL: "webkit-fallback" } : {}),
    PLAYWRIGHT_STABLE_RUNNER: "1",
    PLAYWRIGHT_STABLE_RUNNER_ATTEMPT: String(attempt),
  };
}

function runAttempt(attempt) {
  return new Promise((resolve) => {
    const env = buildEnv(attempt);
    const args = buildArgs(attempt);
    const child = spawn(
      process.execPath,
      [playwrightCliPath, ...args],
      {
        cwd: process.cwd(),
        env,
        stdio: ["inherit", "pipe", "pipe"],
      },
    );

    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(chunk);
    });

    child.on("exit", (code, signal) => {
      resolve({
        code: code ?? 1,
        signal: signal ?? null,
        combinedOutput,
      });
    });
  });
}

let lastExitCode = 1;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await runAttempt(attempt);
  lastExitCode = result.code;

  if (result.code === 0) {
    process.exit(0);
  }

  const canRetry =
    attempt < MAX_ATTEMPTS && looksLikeLaunchCrash(result.combinedOutput);

  if (!canRetry) {
    process.exit(lastExitCode);
  }

  if (attempt + 1 > 2 && (!shouldUseWebkitFallback() || !isWebkitInstalled())) {
    const missingReason = !shouldUseWebkitFallback()
      ? "No webkit-eligible spec set was detected for this run."
      : `WebKit browser bundle is not installed at ${BROWSERS_PATH}.`;
    process.stderr.write(
      `\n[playwright-stable] Launch crash detected, but webkit fallback is unavailable. ${missingReason}\n`,
    );
    process.exit(lastExitCode);
  }

  process.stderr.write(
    `\n[playwright-stable] Detected browser launch crash. Retrying${
      attempt + 1 > 2
        ? " and webkit fallback"
        : attempt + 1 > 1 &&
            !isHeadedRun() &&
            resolveHeadlessShellExecutable() &&
            !process.env.PLAYWRIGHT_EXECUTABLE_PATH
          ? " and headless-shell fallback"
          : ""
    } (${attempt}/${MAX_ATTEMPTS}).\n`,
  );
}

process.exit(lastExitCode);
