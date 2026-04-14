import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { chromium, webkit, type Browser, type BrowserContext, type Page } from "playwright";
import { expect } from "@playwright/test";

import { loginAsCreator } from "../tests/e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS !== "0";
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_INTERVAL_MS = 2_000;
const PAGE_GOTO_TIMEOUT_MS = 60_000;
const OUTPUT_DIR = path.join(process.cwd(), "test-results", "dashboard-geometry-proof");
const execFileAsync = promisify(execFile);

type Surface = {
  name: string;
  previewPath: string;
  previewSelector: string;
  finalPath: string;
  finalSelector: string;
};

type ProbeContext = {
  browserName: "chromium" | "webkit";
  browser: Browser;
};

const SURFACES: Surface[] = [
  {
    name: "dashboard-subscription",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="dashboard-subscription"]',
    finalPath: "/dashboard-v2/membership",
    finalSelector: '[data-route-shell-ready="dashboard-subscription"]',
  },
  {
    name: "dashboard-library",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="dashboard-library"]',
    finalPath: "/dashboard-v2/library",
    finalSelector: '[data-route-shell-ready="dashboard-library"]',
  },
  {
    name: "dashboard-downloads",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="dashboard-downloads"]',
    finalPath: "/dashboard-v2/downloads",
    finalSelector: '[data-route-shell-ready="dashboard-downloads"]',
  },
  {
    name: "dashboard-purchases",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="dashboard-purchases"]',
    finalPath: "/dashboard-v2/purchases",
    finalSelector: '[data-route-shell-ready="dashboard-purchases"]',
  },
  {
    name: "dashboard-settings",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="settings-page"]',
    finalPath: "/dashboard-v2/settings",
    finalSelector: '[data-route-shell-ready="dashboard-settings"]',
  },
  {
    name: "creator-dashboard-overview",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="creator-dashboard-overview"]',
    finalPath: "/dashboard-v2/creator",
    finalSelector: '[data-route-shell-ready="dashboard-creator-overview"]',
  },
  {
    name: "creator-dashboard-analytics",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="creator-dashboard-analytics"]',
    finalPath: "/dashboard-v2/creator/analytics",
    finalSelector: '[data-route-shell-ready="dashboard-creator-analytics"]',
  },
  {
    name: "creator-dashboard-resources",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="creator-dashboard-resources"]',
    finalPath: "/dashboard-v2/creator/resources",
    finalSelector: '[data-route-shell-ready="dashboard-creator-resources"]',
  },
  {
    name: "creator-dashboard-sales",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="creator-dashboard-sales"]',
    finalPath: "/dashboard-v2/creator/sales",
    finalSelector: '[data-route-shell-ready="dashboard-creator-sales"]',
  },
  {
    name: "creator-dashboard-profile",
    previewPath: "/dev/dashboard-geometry?subscriptionVariant=free&libraryVariant=empty",
    previewSelector: '[data-bones-preview="creator-dashboard-profile"]',
    finalPath: "/dashboard-v2/creator/profile",
    finalSelector: '[data-route-shell-ready="dashboard-creator-profile"]',
  },
];

function getSelectedSurfaces() {
  const requestedNames = process.argv.slice(2);
  if (requestedNames.length === 0) {
    return SURFACES;
  }

  const requestedNameSet = new Set(requestedNames);
  const selected = SURFACES.filter((surface) => requestedNameSet.has(surface.name));
  const missing = requestedNames.filter(
    (name) => !SURFACES.some((surface) => surface.name === name),
  );

  if (missing.length > 0) {
    throw new Error(
      `Unknown dashboard geometry surface(s): ${missing.join(", ")}. Available: ${SURFACES.map((surface) => surface.name).join(", ")}`,
    );
  }

  return selected;
}

async function ensureServerReady() {
  const readyUrl = `${BASE_URL}/api/internal/ready`;
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const { stdout } = await execFileAsync("curl", ["-fsS", readyUrl], {
        timeout: 5_000,
      });
      if (stdout.includes('"status":"ok"')) return;
    } catch {
      // Keep polling.
    }

    await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out waiting for dev server readiness at ${readyUrl}`);
}

async function launchBrowser(): Promise<ProbeContext> {
  const attempts: Array<{
    name: "chromium" | "webkit";
    launch: () => Promise<Browser>;
  }> = [
    { name: "chromium", launch: () => chromium.launch({ headless: HEADLESS }) },
    { name: "webkit", launch: () => webkit.launch({ headless: HEADLESS }) },
  ];

  const failures: string[] = [];
  for (const attempt of attempts) {
    try {
      return {
        browserName: attempt.name,
        browser: await attempt.launch(),
      };
    } catch (error) {
      failures.push(
        `${attempt.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(`All browser launch attempts failed.\n${failures.join("\n")}`);
}

async function createContext(browser: Browser) {
  return browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 960 },
  });
}

async function closeContext(context: BrowserContext) {
  await context.close().catch(() => undefined);
}

async function expectNoDashboardOverlay(page: Page) {
  await expect(
    page.locator('[data-loading-scope="dashboard-group"]:visible'),
  ).toHaveCount(0, {
    timeout: 20_000,
  });
}

type GeometryMask = {
  width: number;
  height: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
};

async function captureGeometryMask(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 30_000 });

  return page.evaluate(`
    (() => {
      const targetSelector = ${JSON.stringify(selector)};
      const target = document.querySelector(targetSelector);
      if (!target) {
        throw new Error("Missing geometry target: " + targetSelector);
      }

      const targetRect = target.getBoundingClientRect();
      const width = Math.ceil(targetRect.width);
      const height = Math.ceil(targetRect.height);

      const isVisible = (rect, style) => {
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (Number(style.opacity) === 0) return false;
        if (rect.width < 4 || rect.height < 4) return false;
        if (
          rect.right <= targetRect.left ||
          rect.left >= targetRect.right ||
          rect.bottom <= targetRect.top ||
          rect.top >= targetRect.bottom
        ) {
          return false;
        }
        return true;
      };

      const rects = [];
      const candidates = [target, ...Array.from(target.querySelectorAll("*"))];

      for (const element of candidates) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        if (!isVisible(rect, style)) {
          continue;
        }

        const borderWidth =
          parseFloat(style.borderTopWidth) +
          parseFloat(style.borderRightWidth) +
          parseFloat(style.borderBottomWidth) +
          parseFloat(style.borderLeftWidth);
        const hasBackground =
          style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          style.backgroundColor !== "transparent";
        const isTextLike =
          /^(P|SPAN|H1|H2|H3|H4|H5|H6|A|BUTTON|LABEL|LI|DT|DD|TH|TD)$/.test(
            element.tagName,
          ) && (element.textContent?.trim().length ?? 0) > 0;
        const isInteractive = /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(element.tagName);

        if (!hasBackground && borderWidth === 0 && !isTextLike && !isInteractive) {
          continue;
        }

        rects.push({
          x: Math.max(0, Math.floor(rect.left - targetRect.left)),
          y: Math.max(0, Math.floor(rect.top - targetRect.top)),
          width: Math.min(width, Math.ceil(rect.width)),
          height: Math.min(height, Math.ceil(rect.height)),
        });
      }

      return { width, height, rects };
    })()
  `) as Promise<GeometryMask>;
}

function renderMask(mask: GeometryMask) {
  const png = new PNG({
    width: mask.width,
    height: mask.height,
    colorType: 6,
  });

  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 255;
  }

  for (const rect of mask.rects) {
    const xEnd = Math.min(mask.width, rect.x + rect.width);
    const yEnd = Math.min(mask.height, rect.y + rect.height);
    for (let y = rect.y; y < yEnd; y += 1) {
      for (let x = rect.x; x < xEnd; x += 1) {
        const index = (mask.width * y + x) * 4;
        png.data[index] = 255;
        png.data[index + 1] = 255;
        png.data[index + 2] = 255;
        png.data[index + 3] = 255;
      }
    }
  }

  return png;
}

function padToCanvas(source: PNG, width: number, height: number) {
  const png = new PNG({ width, height, colorType: 6 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 255;
  }

  PNG.bitblt(source, png, 0, 0, source.width, source.height, 0, 0);
  return png;
}

async function writePng(filePath: string, png: PNG) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, PNG.sync.write(png));
}

async function capturePreviewMask(page: Page, surface: Surface) {
  await page.goto(surface.previewPath, {
    waitUntil: "domcontentloaded",
    timeout: PAGE_GOTO_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("heading", { name: /Targeted dashboard skeleton previews/i }),
  ).toBeVisible({
    timeout: 30_000,
  });

  return captureGeometryMask(page, surface.previewSelector);
}

async function captureFinalMask(page: Page, surface: Surface) {
  await page.goto(surface.finalPath, {
    waitUntil: "domcontentloaded",
    timeout: PAGE_GOTO_TIMEOUT_MS,
  });
  await expectNoDashboardOverlay(page);
  return captureGeometryMask(page, surface.finalSelector);
}

async function main() {
  const surfaces = getSelectedSurfaces();
  console.log(`[dashboard-geometry-proof] Waiting for server at ${BASE_URL}`);
  await ensureServerReady();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log("[dashboard-geometry-proof] Launching browser...");
  const { browserName, browser } = await launchBrowser();
  console.log(`[dashboard-geometry-proof] Using ${browserName} against ${BASE_URL}`);

  const previewContext = await createContext(browser);
  const finalContext = await createContext(browser);
  const previewPage = await previewContext.newPage();
  const finalPage = await finalContext.newPage();

  try {
    console.log("[dashboard-geometry-proof] Logging in as creator...");
    await loginAsCreator(previewPage, "/dashboard-v2/creator");
    await loginAsCreator(finalPage, "/dashboard-v2/creator");

    const results: Array<{
      name: string;
      mismatchPixels: number;
      totalPixels: number;
      mismatchRatio: number;
      previewPath: string;
      finalPath: string;
      diffPath: string;
    }> = [];

    for (const surface of surfaces) {
      console.log(`[dashboard-geometry-proof] Capturing ${surface.name} preview...`);
      const previewMask = await capturePreviewMask(previewPage, surface);
      console.log(`[dashboard-geometry-proof] Capturing ${surface.name} final...`);
      const finalMask = await captureFinalMask(finalPage, surface);
      const width = Math.max(previewMask.width, finalMask.width);
      const height = Math.max(previewMask.height, finalMask.height);

      const previewPng = padToCanvas(renderMask(previewMask), width, height);
      const finalPng = padToCanvas(renderMask(finalMask), width, height);
      const diffPng = new PNG({ width, height, colorType: 6 });

      const mismatchPixels = pixelmatch(
        previewPng.data,
        finalPng.data,
        diffPng.data,
        width,
        height,
        {
          threshold: 0.1,
        },
      );

      const totalPixels = width * height;
      const mismatchRatio = mismatchPixels / totalPixels;
      const previewPath = path.join(OUTPUT_DIR, `${surface.name}-preview-mask.png`);
      const finalPath = path.join(OUTPUT_DIR, `${surface.name}-final-mask.png`);
      const diffPath = path.join(OUTPUT_DIR, `${surface.name}-diff.png`);

      await writePng(previewPath, previewPng);
      await writePng(finalPath, finalPng);
      await writePng(diffPath, diffPng);

      results.push({
        name: surface.name,
        mismatchPixels,
        totalPixels,
        mismatchRatio,
        previewPath,
        finalPath,
        diffPath,
      });
    }

    const reportPath = path.join(OUTPUT_DIR, "report.json");
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

    for (const result of results) {
      console.log(
        `[dashboard-geometry-proof] ${result.name}: diff=${(result.mismatchRatio * 100).toFixed(2)}% (${result.mismatchPixels}/${result.totalPixels})`,
      );
    }
    console.log(`[dashboard-geometry-proof] Report: ${reportPath}`);
  } finally {
    await closeContext(previewContext);
    await closeContext(finalContext);
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
