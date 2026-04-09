import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { expect } from "@playwright/test";
import { chromium, webkit, type Browser, type BrowserContext, type Page } from "playwright";

import { collectRuntimeErrors } from "../tests/e2e/helpers/browser";
import { loginAsAdmin, loginAsCreator } from "../tests/e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS !== "0";
const ALLOW_READY_TIMEOUT = process.env.BROWSER_PROBE_ALLOW_READY_TIMEOUT === "1";
const DISABLE_WEBKIT_FALLBACK =
  process.env.PLAYWRIGHT_DISABLE_WEBKIT_FALLBACK === "1";
const OUTPUT_DIR = path.join(process.cwd(), "test-results", "browser-probe");
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_INTERVAL_MS = 2_000;
const CREATOR_EMAIL = "demo.instructor@krukraft.dev";
const execFileAsync = promisify(execFile);

type ProbeScenarioName =
  | "launch"
  | "resources-to-library"
  | "library-to-resources"
  | "resources-account-menu-pages"
  | "dashboard-avatar-menu-pages"
  | "listing-filter-pages"
  | "admin-resource-editor-pages"
  | "dashboard-overview-refresh-shell"
  | "dashboard-library-refresh-shell"
  | "dashboard-downloads-refresh-shell"
  | "dashboard-purchases-refresh-shell"
  | "dashboard-settings-refresh-shell"
  | "dashboard-subscription-refresh-shell"
  | "admin-overview-refresh-shell"
  | "admin-analytics-refresh-shell"
  | "dark-theme-logo"
  | "settings-theme"
  | "public-product-pages"
  | "admin-core-pages"
  | "admin-analytics-pages"
  | "creator-management-pages"
  | "creator-refresh-shell"
  | "creator-editor-refresh-shell"
  | "dashboard-to-downloads"
  | "dashboard-to-purchases"
  | "dashboard-to-settings";

type ProbeContext = {
  browserName: "chromium" | "webkit";
  browser: Browser;
};

type NavSample = {
  href: string;
  ts: number;
  hasMain: boolean;
  mainChildren: number;
  mainTextLength: number;
  loadingScopes: string[];
};

type ThemeLogoLayerState = {
  opacity: number | null;
  src: string | null;
  currentSrc: string | null;
};

type ThemeLogoProbeState = {
  theme: string | null;
  light: ThemeLogoLayerState;
  dark: ThemeLogoLayerState;
} | null;

type RefreshSample = {
  href: string;
  ts: number;
  rootLoadingVisible: boolean;
  dashboardShellVisible: boolean;
  routeReady: string[];
};

const VALID_SCENARIOS: ProbeScenarioName[] = [
  "launch",
  "resources-to-library",
  "library-to-resources",
  "resources-account-menu-pages",
  "dashboard-avatar-menu-pages",
  "listing-filter-pages",
  "admin-resource-editor-pages",
  "dashboard-overview-refresh-shell",
  "dashboard-library-refresh-shell",
  "dashboard-downloads-refresh-shell",
  "dashboard-purchases-refresh-shell",
  "dashboard-settings-refresh-shell",
  "dashboard-subscription-refresh-shell",
  "admin-overview-refresh-shell",
  "admin-analytics-refresh-shell",
  "dark-theme-logo",
  "settings-theme",
  "public-product-pages",
  "admin-core-pages",
  "admin-analytics-pages",
  "creator-management-pages",
  "creator-refresh-shell",
  "creator-editor-refresh-shell",
  "dashboard-to-downloads",
  "dashboard-to-purchases",
  "dashboard-to-settings",
];

function parseScenarioNames(argv: string[]) {
  const requested = argv.filter((arg) => !arg.startsWith("--"));
  if (requested.length === 0) {
    return VALID_SCENARIOS;
  }

  const invalid = requested.filter(
    (arg): arg is string => !VALID_SCENARIOS.includes(arg as ProbeScenarioName),
  );
  if (invalid.length > 0) {
    throw new Error(
      `Unknown browser probe scenario(s): ${invalid.join(", ")}. Valid values: ${VALID_SCENARIOS.join(", ")}`,
    );
  }

  return requested as ProbeScenarioName[];
}

async function ensureServerReady() {
  const readyUrl = `${BASE_URL}/api/internal/ready`;
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(readyUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // Fall through to the curl-based probe below.
    }

    try {
      const { stdout } = await execFileAsync("curl", ["-fsS", readyUrl], {
        timeout: 5_000,
      });
      if (stdout.includes('"status":"ok"')) {
        return;
      }
    } catch {
      // Keep polling until the deadline is reached.
    }

    await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
  }

  if (ALLOW_READY_TIMEOUT) {
    console.warn(
      `[browser-probe] Ready check timed out at ${readyUrl} after ${READY_TIMEOUT_MS}ms; continuing because BROWSER_PROBE_ALLOW_READY_TIMEOUT=1.`,
    );
    return;
  }

  throw new Error(`Timed out waiting for dev server readiness at ${readyUrl} after ${READY_TIMEOUT_MS}ms.`);
}

async function launchBrowser() {
  const attempts: Array<{
    name: "chromium" | "webkit";
    launch: () => Promise<Browser>;
  }> = [
    {
      name: "chromium",
      launch: () => chromium.launch({ headless: HEADLESS }),
    },
    ...(DISABLE_WEBKIT_FALLBACK
      ? []
      : [
          {
            name: "webkit" as const,
            launch: () => webkit.launch({ headless: HEADLESS }),
          },
        ]),
  ];

  const failures: string[] = [];

  for (const attempt of attempts) {
    try {
      const browser = await attempt.launch();
      return {
        browserName: attempt.name,
        browser,
      } satisfies ProbeContext;
    } catch (error) {
      failures.push(`${attempt.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`All browser probe launch attempts failed.\n${failures.join("\n")}`);
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

async function saveFailureScreenshot(page: Page, scenario: ProbeScenarioName) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const targetPath = path.join(OUTPUT_DIR, `${scenario}-failure.png`);
  await page.screenshot({ path: targetPath, fullPage: true }).catch(() => undefined);
  return targetPath;
}

async function startNavigationProbe(page: Page) {
  await page.evaluate(`
    (() => {
      const samples = [];
      let stopped = false;
      let rafId = 0;

      const sample = () => {
        const main = document.querySelector("main");
        const loadingScopes = Array.from(document.querySelectorAll("[data-loading-scope]"))
          .map((node) => node.getAttribute("data-loading-scope"))
          .filter(Boolean);

        samples.push({
          href: window.location.pathname + window.location.search,
          ts: performance.now(),
          hasMain: Boolean(main),
          mainChildren: main ? main.children.length : 0,
          mainTextLength: main && main.textContent ? main.textContent.trim().length : 0,
          loadingScopes,
        });

        if (!stopped) {
          rafId = window.requestAnimationFrame(sample);
        }
      };

      window.__krukraftNavProbe = {
        stop: () => {
          stopped = true;
          window.cancelAnimationFrame(rafId);
          return samples;
        },
      };

      rafId = window.requestAnimationFrame(sample);
    })()
  `);
}

async function stopNavigationProbe(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return (await page.evaluate(`
        (() => {
          const probe = window.__krukraftNavProbe;
          return probe ? probe.stop() : [];
        })()
      `)) as NavSample[];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Execution context was destroyed") || attempt === 3) {
        throw error;
      }
      await page.waitForLoadState("domcontentloaded");
    }
  }

  return [];
}

function expectNoBlankGap(samples: NavSample[], targetPathPattern: RegExp) {
  const targetSamples = samples.filter((sample) => targetPathPattern.test(sample.href));
  const blankSample = targetSamples.find(
    (sample) =>
      sample.loadingScopes.length === 0 &&
      (!sample.hasMain || (sample.mainChildren === 0 && sample.mainTextLength === 0)),
  );

  expect(blankSample).toBeUndefined();
}

function expectTargetSamples(
  samples: NavSample[],
  targetPathPattern: RegExp,
  scenario: ProbeScenarioName,
) {
  const targetSamples = samples.filter((sample) => targetPathPattern.test(sample.href));

  expect(
    targetSamples.length,
    `${scenario} probe did not capture any target-route samples for ${targetPathPattern}`,
  ).toBeGreaterThan(0);
}

function expectLoadingScope(
  samples: NavSample[],
  scopes: readonly string[],
  scenario: ProbeScenarioName,
) {
  const sawExpectedScope = samples.some((sample) =>
    scopes.some((scope) => sample.loadingScopes.includes(scope)),
  );
  const uniqueScopes = Array.from(
    new Set(samples.flatMap((sample) => sample.loadingScopes)),
  ).sort();
  const sampleSummary = {
    sampleCount: samples.length,
    uniqueScopes,
    firstHref: samples[0]?.href ?? null,
    lastHref: samples.at(-1)?.href ?? null,
    targetSampleCount: samples.filter((sample) =>
      scenario === "resources-to-library"
        ? /\/dashboard\/library$/.test(sample.href)
        : /\/resources$/.test(sample.href)
    ).length,
  };

  expect(
    sawExpectedScope,
    `${scenario} probe did not capture any of the expected loading scopes: ${scopes.join(", ")}. ${JSON.stringify(sampleSummary)}`,
  ).toBeTruthy();
}

async function openLibraryFromResources(page: Page) {
  const libraryHref = () => new URL("/dashboard/library", page.url()).toString();
  const directLibraryLink = page.locator('header a[href="/dashboard/library"]:visible').first();
  const accountButton = page
    .locator(
      'header button[aria-label="เปิดเมนูบัญชี"]:visible, header button[aria-label="Open account menu"]:visible',
    )
    .first();

  await page.getByRole("banner").first().hover();
  await expect
    .poll(
      async () =>
        (await directLibraryLink.isVisible().catch(() => false)) ||
        (await accountButton.isVisible().catch(() => false)),
      { timeout: 15_000 },
    )
    .toBeTruthy();

  if (await accountButton.isVisible().catch(() => false)) {
    await expect(accountButton).toBeVisible({ timeout: 15_000 });
    await accountButton.click();

    const menuLibraryLink = page
      .locator('[role="menu"] a[href="/dashboard/library"]:visible, a[href="/dashboard/library"]:visible')
      .last();
    await expect(menuLibraryLink).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/\/dashboard\/library$/, {
        timeout: 15_000,
        waitUntil: "commit",
      }),
      menuLibraryLink.click(),
    ]).catch(() => undefined);
  } else if (await directLibraryLink.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForURL(/\/dashboard\/library$/, {
        timeout: 15_000,
        waitUntil: "commit",
      }),
      directLibraryLink.click(),
    ]).catch(() => undefined);
  }

  if (!/\/dashboard\/library$/.test(page.url())) {
    await page.goto(libraryHref(), {
      timeout: 15_000,
      waitUntil: "domcontentloaded",
    });
  }

  await expect(page).toHaveURL(/\/dashboard\/library$/);
}

async function openPublicAccountMenu(page: Page) {
  const accountButton = page
    .locator(
      'header button[aria-label="เปิดเมนูบัญชี"]:visible, header button[aria-label="Open account menu"]:visible',
    )
    .first();

  await expect(accountButton).toBeVisible({ timeout: 15_000 });
  await accountButton.hover();
  await accountButton.click();
  await expect(page.locator('a[href="/settings"]:visible')).toBeVisible({ timeout: 15_000 });
}

async function navigateViaPublicAccountMenu(
  page: Page,
  target: { href: string; heading: RegExp },
) {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/resources(?:\?.*)?$/);

  await openPublicAccountMenu(page);

  const link = page.locator(`a[href="${target.href}"]:visible`).first();

  await expect(link).toBeVisible({ timeout: 15_000 });

  await Promise.all([
    page.waitForURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`), {
      timeout: 20_000,
      waitUntil: "commit",
    }),
    link.click(),
  ]);

  await expect(page).toHaveURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`));
  await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function openDashboardAvatarMenu(page: Page) {
  const avatarButton = page
    .locator('[data-dashboard-account-trigger="true"]:visible')
    .first();

  await expect(avatarButton).toBeVisible({ timeout: 15_000 });
  await avatarButton.hover();
  await avatarButton.click();

  await expect(
    page.locator(
      '[data-dashboard-account-menu="true"] [data-dashboard-account-link="/dashboard/library"]:visible',
    ),
  ).toBeVisible({ timeout: 15_000 });
}

async function navigateViaDashboardAvatarMenu(
  page: Page,
  target: { href: string; heading: RegExp },
) {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i }).first()).toBeVisible({
    timeout: 20_000,
  });

  await openDashboardAvatarMenu(page);

  const link = page
    .locator(
      `[data-dashboard-account-menu="true"] [data-dashboard-account-link="${target.href}"]:visible`,
    )
    .first();
  await expect(link).toBeVisible({ timeout: 15_000 });

  await Promise.all([
    page.waitForURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`), {
      timeout: 20_000,
      waitUntil: "commit",
    }),
    link.click(),
  ]);

  await expect(page).toHaveURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`));
  await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function findSeededAdminResourceId() {
  const prisma = new PrismaClient();

  try {
    const resource = await prisma.resource.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!resource) {
      throw new Error("No seeded resource found for admin-resource-editor-pages probe");
    }

    return resource.id;
  } finally {
    await prisma.$disconnect();
  }
}

async function setUserThemePreference(email: string, theme: "light" | "dark" | "system") {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new Error(`User not found for theme preference seed: ${email}`);
    }

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: { theme },
      create: {
        userId: user.id,
        language: "en",
        theme,
        currency: "USD",
        timezone: "UTC",
        emailNotifications: true,
        purchaseReceipts: true,
        productUpdates: true,
        marketingEmails: false,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function runLaunchScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();

  try {
    const response = await page.goto("/api/internal/ready", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok()).toBeTruthy();
  } finally {
    await closeContext(context);
  }
}

async function runResourcesToLibraryScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, "/resources");
    await expect(page).toHaveURL(/\/resources$/);
    await startNavigationProbe(page);

    await openLibraryFromResources(page);

    await expect(page).toHaveURL(/\/dashboard\/library$/);
    await expect(page.getByRole("heading", { name: /My Library/i })).toBeVisible();
    await expect(page.locator("main").first()).toBeVisible();
    await page.waitForLoadState("domcontentloaded");

    const samples = await stopNavigationProbe(page);
    expectLoadingScope(samples, ["dashboard-group"], "resources-to-library");
    expectNoBlankGap(samples, /\/dashboard\/library$/);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "resources-to-library");
    throw new Error(
      `resources-to-library probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runLibraryToResourcesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, "/dashboard/library");
    await expect(page).toHaveURL(/\/dashboard\/library$/);
    await startNavigationProbe(page);

    const browseLink = page.getByRole("link", { name: /Browse resources/i }).first();
    await expect(browseLink).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/resources$/, {
        timeout: 15_000,
        waitUntil: "commit",
      }),
      browseLink.click(),
    ]);

    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.locator("main").first()).toBeVisible();
    await page.waitForLoadState("domcontentloaded");

    const samples = await stopNavigationProbe(page);
    expectTargetSamples(samples, /\/resources$/, "library-to-resources");
    expectNoBlankGap(samples, /\/resources$/);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "library-to-resources");
    throw new Error(
      `library-to-resources probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runResourcesAccountMenuPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const targets: Array<{ href: string; heading: RegExp }> = [
    { href: "/dashboard", heading: /Welcome back/i },
    { href: "/dashboard/purchases", heading: /^Purchases$/i },
    { href: "/settings", heading: /^Settings$/i },
  ];

  try {
    await loginAsCreator(page, "/resources");
    await expect(page).toHaveURL(/\/resources(?:\?.*)?$/);

    for (const target of targets) {
      await navigateViaPublicAccountMenu(page, target);
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "resources-account-menu-pages");
    throw new Error(
      `resources-account-menu-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runDashboardAvatarMenuPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const targets: Array<{ href: string; heading: RegExp }> = [
    { href: "/dashboard/library", heading: /^My Library$/i },
    { href: "/dashboard/purchases", heading: /^Purchases$/i },
    { href: "/settings", heading: /^Settings$/i },
  ];

  try {
    await loginAsCreator(page, "/dashboard");
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);

    for (const target of targets) {
      await navigateViaDashboardAvatarMenu(page, target);
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "dashboard-avatar-menu-pages");
    throw new Error(
      `dashboard-avatar-menu-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runListingFilterPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const targets = [
    "/resources?category=art-creativity",
    "/resources?category=science",
    "/resources?search=worksheet",
  ];

  try {
    await loginAsCreator(page, "/resources");
    await expect(page).toHaveURL(/\/resources(?:\?.*)?$/);

    for (const target of targets) {
      await page.goto(target, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(
        new RegExp(`${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      );
      await expect(page.locator('[data-route-shell-ready="resources-browse"]').first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        page.getByRole("heading", { name: /The resource library could not load\./i }),
      ).toHaveCount(0);
      await expect
        .poll(
          async () =>
            page.locator('main a[href^="/resources/"]:visible').count(),
          { timeout: 20_000 },
        )
        .toBeGreaterThan(0);
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "listing-filter-pages");
    throw new Error(
      `listing-filter-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runAdminResourceEditorPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    const resourceId = await findSeededAdminResourceId();

    await loginAsAdmin(page, "/admin/resources/new");
    await expect(page).toHaveURL(/\/admin\/resources\/new$/);
    await expect(page.getByRole("heading", { name: /^Create Resource$/i }).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.goto(`/admin/resources/${resourceId}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/admin/resources/${resourceId}(?:\\?.*)?$`));
    await expect(page.getByRole("heading", { name: /^Edit Resource$/i }).first()).toBeVisible({
      timeout: 20_000,
    });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "admin-resource-editor-pages");
    throw new Error(
      `admin-resource-editor-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runDashboardRouteScenario(
  { browser }: ProbeContext,
  options: {
    scenario: ProbeScenarioName;
    linkName: RegExp;
    headingName: RegExp;
    urlPattern: RegExp;
  },
) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, "/dashboard/library");
    await expect(page).toHaveURL(/\/dashboard\/library$/);
    await expect(page.getByRole("heading", { name: /My Library/i })).toBeVisible();

    const navLink = page.getByRole("link", { name: options.linkName }).first();
    await expect(navLink).toBeVisible();

    await Promise.all([page.waitForURL(options.urlPattern), navLink.click()]);

    await expect(page).toHaveURL(options.urlPattern);
    await expect(page.getByRole("heading", { name: options.headingName }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, options.scenario);
    throw new Error(
      `${options.scenario} probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runPublicProductPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const pages: Array<{ path: string; heading: RegExp }> = [
    { path: "/membership", heading: /Simple, transparent pricing/i },
    { path: "/privacy", heading: /^Privacy Policy$/i },
    { path: "/terms", heading: /^Terms of Service$/i },
    { path: "/cookies", heading: /^Cookie Policy$/i },
    { path: "/support", heading: /Need help with your purchase or account\?/i },
    { path: "/checkout/success", heading: /You'?re all set!/i },
    { path: "/checkout/cancel", heading: /No worries/i },
  ];

  try {
    for (const target of pages) {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${target.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "public-product-pages");
    throw new Error(
      `public-product-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runAdminCorePagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const pages: Array<{ path: string; heading: RegExp }> = [
    { path: "/admin", heading: /^Admin dashboard$/i },
    { path: "/admin/activity", heading: /^Activity Log$/i },
    { path: "/admin/audit", heading: /^Audit Trail$/i },
    { path: "/admin/categories", heading: /^Categories$/i },
    { path: "/admin/orders", heading: /^Orders$/i },
    { path: "/admin/reviews", heading: /^Reviews$/i },
    { path: "/admin/tags", heading: /^Tag Management$/i },
    { path: "/admin/users", heading: /^Users$/i },
  ];

  try {
    await loginAsAdmin(page, "/admin");
    await expect(page).toHaveURL(/\/admin$/);

    for (const target of pages) {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(
        new RegExp(`${target.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      );
      await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "admin-core-pages");
    throw new Error(
      `admin-core-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runAdminAnalyticsPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const pages: Array<{ path: string; heading: RegExp }> = [
    { path: "/admin/analytics", heading: /^Analytics$/i },
    { path: "/admin/analytics/recommendations", heading: /^Recommendation Experiment$/i },
  ];

  try {
    await loginAsAdmin(page, "/admin/analytics");
    await expect(page).toHaveURL(/\/admin\/analytics$/);

    for (const target of pages) {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(
        new RegExp(`${target.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      );
      await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "admin-analytics-pages");
    throw new Error(
      `admin-analytics-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runCreatorManagementPagesScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const pages: Array<{
    path: string;
    assert: (page: Page) => Promise<void>;
  }> = [
    {
      path: "/dashboard/creator/resources",
      assert: (page) =>
        expect(page.getByRole("heading", { name: /^Resource management$/i }).first()).toBeVisible(),
    },
    {
      path: "/dashboard/creator/resources/new",
      assert: (page) =>
        expect(
          page.getByRole("heading", { name: /^(Create your first resource|New resource)$/i }).first(),
        ).toBeVisible(),
    },
    {
      path: "/dashboard/creator/profile",
      assert: (page) =>
        expect(page.getByRole("heading", { name: /^Creator Profile$/i }).first()).toBeVisible(),
    },
    {
      path: "/dashboard/creator/analytics",
      assert: async (page) => {
        await expect(page).toHaveURL(/\/dashboard\/creator\/analytics(?:\?.*)?$/);
        await expect(
          page.locator("main").getByText(/Gross revenue/i).first(),
        ).toBeVisible({ timeout: 20_000 });
        await expect(
          page.locator("main").getByText(/Creator share/i).first(),
        ).toBeVisible({ timeout: 20_000 });
        await expect(
          page.locator("main").getByText(/Total downloads/i).first(),
        ).toBeVisible({ timeout: 20_000 });
      },
    },
  ];

  try {
    await loginAsCreator(page, "/dashboard/creator/resources");
    await expect(page).toHaveURL(/\/dashboard\/creator\/resources$/);

    for (const target of pages) {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(
        new RegExp(`${target.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      );
      await target.assert(page);
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "creator-management-pages");
    throw new Error(
      `creator-management-pages probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function startRefreshProbe(page: Page) {
  const refreshProbeScript = `
    (() => {
      const storageKey = "__krukraftRefreshProbeSamples";

      const readSamples = () => {
        try {
          const raw = window.sessionStorage.getItem(storageKey);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      };

      const writeSamples = (samples) => {
        window.sessionStorage.setItem(storageKey, JSON.stringify(samples));
      };

      let stopped = false;
      let rafId = 0;

      const sample = () => {
        const samples = readSamples();
        samples.push({
          href: window.location.pathname + window.location.search,
          ts: performance.now(),
          rootLoadingVisible: Boolean(document.querySelector("[data-app-root-loading='true']")),
          dashboardShellVisible: Boolean(document.querySelector("[data-route-shell-ready='dashboard']")),
          routeReady: Array.from(document.querySelectorAll("[data-route-shell-ready]"))
            .map((node) => node.getAttribute("data-route-shell-ready"))
            .filter(Boolean),
        });
        writeSamples(samples);

        if (!stopped) {
          rafId = window.requestAnimationFrame(sample);
        }
      };

      window.sessionStorage.removeItem(storageKey);
      window.__krukraftRefreshProbe = {
        stop: () => {
          stopped = true;
          window.cancelAnimationFrame(rafId);
          return readSamples();
        },
      };

      sample();
      rafId = window.requestAnimationFrame(sample);
    })();
  `;

  await page.addInitScript(refreshProbeScript);
  await page.evaluate(refreshProbeScript);
}

async function stopRefreshProbe(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return (await page.evaluate(`
        (() => {
          const probe = window.__krukraftRefreshProbe;
          if (probe) {
            return probe.stop();
          }

          try {
            const raw = window.sessionStorage.getItem("__krukraftRefreshProbeSamples");
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })()
      `)) as RefreshSample[];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Execution context was destroyed") || attempt === 3) {
        throw error;
      }
      await page.waitForLoadState("domcontentloaded");
    }
  }

  return [];
}

async function runCreatorRefreshShellScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, "/dashboard/creator/resources");
    await expect(page).toHaveURL(/\/dashboard\/creator\/resources$/);
    await expect(
      page.getByRole("heading", { name: /^Resource management$/i }).first(),
    ).toBeVisible();

    await startRefreshProbe(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/creator\/resources$/);
    await expect(
      page.getByRole("heading", { name: /^Resource management$/i }).first(),
    ).toBeVisible();
    await page.waitForTimeout(500);

    const samples = await stopRefreshProbe(page);
    const creatorSamples = samples.filter((sample) =>
      /\/dashboard\/creator\/resources(?:\?.*)?$/.test(sample.href),
    );

    expect(
      creatorSamples.length,
      "creator-refresh-shell probe did not capture creator route samples after reload",
    ).toBeGreaterThan(0);

    const wrongFamilyRouteSample = creatorSamples.find((sample) =>
      sample.routeReady.some(
        (marker) =>
          marker !== "dashboard" &&
          !marker.startsWith("dashboard-creator"),
      ),
    );
    expect(wrongFamilyRouteSample).toBeUndefined();

    const creatorShellSample = creatorSamples.find(
      (sample) =>
        sample.dashboardShellVisible ||
        sample.routeReady.some((marker) => marker.startsWith("dashboard-creator")),
    );
    expect(
      creatorShellSample,
      "creator-refresh-shell probe did not observe creator/dashboard shell readiness after reload",
    ).toBeDefined();

    expect(creatorSamples.at(-1)?.rootLoadingVisible).not.toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "creator-refresh-shell");
    throw new Error(
      `creator-refresh-shell probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

type DashboardRefreshShellOptions = {
  scenario:
    | "dashboard-overview-refresh-shell"
    | "dashboard-library-refresh-shell"
    | "dashboard-downloads-refresh-shell"
    | "dashboard-purchases-refresh-shell"
    | "dashboard-settings-refresh-shell"
    | "dashboard-subscription-refresh-shell";
  initialPath: string;
  urlPattern: RegExp;
  headingName: RegExp;
  expectedRouteReady: string;
};

type AdminRefreshShellOptions = {
  scenario:
    | "admin-overview-refresh-shell"
    | "admin-analytics-refresh-shell";
  initialPath: string;
  urlPattern: RegExp;
  headingName: RegExp;
  expectedRouteReady: string;
};

async function runDashboardRefreshShellScenario(
  probeContext: ProbeContext,
  options: DashboardRefreshShellOptions,
) {
  const context = await createContext(probeContext.browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, options.initialPath);
    await expect(page).toHaveURL(options.urlPattern);
    await expect(page.getByRole("heading", { name: options.headingName }).first()).toBeVisible();

    await startRefreshProbe(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(options.urlPattern);
    await expect(page.getByRole("heading", { name: options.headingName }).first()).toBeVisible();
    await page.waitForTimeout(500);

    const samples = await stopRefreshProbe(page);
    const routeSamples = samples.filter((sample) => options.urlPattern.test(sample.href));

    expect(
      routeSamples.length,
      `${options.scenario} probe did not capture route samples after reload`,
    ).toBeGreaterThan(0);

    const wrongFamilyRouteSample = routeSamples.find((sample) =>
      sample.routeReady.some(
        (marker) => marker !== "dashboard" && marker !== options.expectedRouteReady,
      ),
    );
    expect(wrongFamilyRouteSample).toBeUndefined();

    const dashboardShellSample = routeSamples.find(
      (sample) =>
        sample.routeReady.includes(options.expectedRouteReady) ||
        sample.dashboardShellVisible,
    );
    expect(
      dashboardShellSample,
      `${options.scenario} probe did not observe ${options.expectedRouteReady} readiness after reload`,
    ).toBeDefined();

    expect(routeSamples.at(-1)?.rootLoadingVisible).not.toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, options.scenario);
    throw new Error(
      `${options.scenario} probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runAdminRefreshShellScenario(
  probeContext: ProbeContext,
  options: AdminRefreshShellOptions,
) {
  const context = await createContext(probeContext.browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsAdmin(page, options.initialPath);
    await expect(page).toHaveURL(options.urlPattern);
    await expect(page.getByRole("heading", { name: options.headingName }).first()).toBeVisible();

    await startRefreshProbe(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(options.urlPattern);
    await expect(page.getByRole("heading", { name: options.headingName }).first()).toBeVisible();
    await page.waitForTimeout(500);

    const samples = await stopRefreshProbe(page);
    const routeSamples = samples.filter((sample) => options.urlPattern.test(sample.href));

    expect(
      routeSamples.length,
      `${options.scenario} probe did not capture route samples after reload`,
    ).toBeGreaterThan(0);

    const wrongFamilyRouteSample = routeSamples.find((sample) =>
      sample.routeReady.some(
        (marker) => marker !== "dashboard" && marker !== options.expectedRouteReady,
      ),
    );
    expect(wrongFamilyRouteSample).toBeUndefined();

    const readySample = routeSamples.find((sample) =>
      sample.routeReady.includes(options.expectedRouteReady),
    );
    expect(
      readySample,
      `${options.scenario} probe did not observe ${options.expectedRouteReady} readiness after reload`,
    ).toBeDefined();

    expect(routeSamples.at(-1)?.rootLoadingVisible).not.toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, options.scenario);
    throw new Error(
      `${options.scenario} probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runDashboardLibraryRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-library-refresh-shell",
      initialPath: "/dashboard/library",
      urlPattern: /\/dashboard\/library(?:\?.*)?$/,
      headingName: /^My Library$/i,
      expectedRouteReady: "dashboard-library",
    },
  );
}

async function runDashboardOverviewRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-overview-refresh-shell",
      initialPath: "/dashboard",
      urlPattern: /\/dashboard(?:\?.*)?$/,
      headingName: /Welcome back/i,
      expectedRouteReady: "dashboard-overview",
    },
  );
}

async function runDashboardDownloadsRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-downloads-refresh-shell",
      initialPath: "/dashboard/downloads",
      urlPattern: /\/dashboard\/downloads(?:\?.*)?$/,
      headingName: /Download history/i,
      expectedRouteReady: "dashboard-downloads",
    },
  );
}

async function runDashboardPurchasesRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-purchases-refresh-shell",
      initialPath: "/dashboard/purchases",
      urlPattern: /\/dashboard\/purchases(?:\?.*)?$/,
      headingName: /^Purchases$/i,
      expectedRouteReady: "dashboard-purchases",
    },
  );
}

async function runDashboardSettingsRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-settings-refresh-shell",
      initialPath: "/settings",
      urlPattern: /\/settings(?:\?.*)?$/,
      headingName: /^Settings$/i,
      expectedRouteReady: "dashboard-settings",
    },
  );
}

async function runDashboardSubscriptionRefreshShellScenario(context: ProbeContext) {
  return runDashboardRefreshShellScenario(
    context,
    {
      scenario: "dashboard-subscription-refresh-shell",
      initialPath: "/subscription",
      urlPattern: /\/subscription(?:\?.*)?$/,
      headingName: /^Membership$/i,
      expectedRouteReady: "dashboard-subscription",
    },
  );
}

async function runAdminOverviewRefreshShellScenario(context: ProbeContext) {
  return runAdminRefreshShellScenario(
    context,
    {
      scenario: "admin-overview-refresh-shell",
      initialPath: "/admin",
      urlPattern: /\/admin(?:\?.*)?$/,
      headingName: /^Admin dashboard$/i,
      expectedRouteReady: "admin-overview",
    },
  );
}

async function runAdminAnalyticsRefreshShellScenario(context: ProbeContext) {
  return runAdminRefreshShellScenario(
    context,
    {
      scenario: "admin-analytics-refresh-shell",
      initialPath: "/admin/analytics",
      urlPattern: /\/admin\/analytics(?:\?.*)?$/,
      headingName: /^Analytics$/i,
      expectedRouteReady: "admin-analytics",
    },
  );
}

async function runCreatorEditorRefreshShellScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  try {
    await loginAsCreator(page, "/dashboard/creator/resources/new");
    await expect(page).toHaveURL(/\/dashboard\/creator\/resources\/new$/);
    await expect(
      page.getByRole("heading", { name: /Create your first resource|New resource/i }).first(),
    ).toBeVisible();

    await startRefreshProbe(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard\/creator\/resources\/new$/);
    await expect(
      page.getByRole("heading", { name: /Create your first resource|New resource/i }).first(),
    ).toBeVisible();
    await page.waitForTimeout(500);

    const samples = await stopRefreshProbe(page);
    const editorSamples = samples.filter((sample) =>
      /\/dashboard\/creator\/resources\/new(?:\?.*)?$/.test(sample.href),
    );

    expect(
      editorSamples.length,
      "creator-editor-refresh-shell probe did not capture editor route samples after reload",
    ).toBeGreaterThan(0);

    const wrongFamilyRouteSample = editorSamples.find((sample) =>
      sample.routeReady.some(
        (marker) =>
          marker !== "dashboard" &&
          marker !== "dashboard-creator-resource-editor" &&
          !marker.startsWith("dashboard-creator"),
      ),
    );
    expect(wrongFamilyRouteSample).toBeUndefined();

    const editorShellSample = editorSamples.find(
      (sample) =>
        sample.routeReady.includes("dashboard-creator-resource-editor") ||
        sample.dashboardShellVisible,
    );
    expect(
      editorShellSample,
      "creator-editor-refresh-shell probe did not observe editor/dashboard shell readiness after reload",
    ).toBeDefined();

    expect(editorSamples.at(-1)?.rootLoadingVisible).not.toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "creator-editor-refresh-shell");
    throw new Error(
      `creator-editor-refresh-shell probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runDarkThemeLogoScenario({ browser }: ProbeContext) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.addInitScript(() => {
    window.localStorage.setItem("user_theme", "dark");
  });

  await page.route("**/*", async (route) => {
    const url = route.request().url();
    const isDarkLogoRequest =
      url.includes("/brand-assets/full-logo-dark") ||
      url.includes("/brand-assets/icon-logo-dark") ||
      (url.includes("/_next/image") &&
        (url.includes("krukraft-logo-dark") || url.includes("krukraft-mark-dark")));

    if (isDarkLogoRequest) {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    }

    await route.continue();
  });

  try {
    await page.goto("/resources", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const logoStack = page.locator("header .theme-logo-stack").first();
    await expect(logoStack).toBeVisible();

    const state = (await page.evaluate(`
      (() => {
        const node = document.querySelector("header .theme-logo-stack");
        if (!node) {
          return null;
        }

        const readLayer = (selector) => {
          const layer = node.querySelector(selector);
          const image = layer ? layer.querySelector("img") : null;
          const style = layer ? window.getComputedStyle(layer) : null;

          return {
            opacity: style ? Number.parseFloat(style.opacity) : null,
            src: image ? image.getAttribute("src") : null,
            currentSrc: image instanceof HTMLImageElement ? image.currentSrc : null,
          };
        };

        return {
          theme: document.documentElement.dataset.theme ?? null,
          light: readLayer(".theme-logo-layer--light"),
          dark: readLayer(".theme-logo-layer--dark"),
        };
      })()
    `)) as ThemeLogoProbeState;

    expect(state).not.toBeNull();
    if (!state) {
      throw new Error("theme-logo-stack was not found during dark-theme-logo probe");
    }

    expect(state.theme).toBe("dark");
    expect((state.dark.opacity ?? 0) > 0.5).toBeTruthy();
    expect((state.light.opacity ?? 1) < 0.1).toBeTruthy();

    const darkSrc = `${state.dark.src ?? ""} ${state.dark.currentSrc ?? ""}`;
    expect(/krukraft-(logo|mark)-dark/i.test(darkSrc)).toBeTruthy();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "dark-theme-logo");
    throw new Error(
      `dark-theme-logo probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

async function runSettingsThemeScenario({ browser }: ProbeContext) {
  await setUserThemePreference(CREATOR_EMAIL, "dark");

  const context = await createContext(browser);
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.removeItem("user_theme");
  });

  try {
    await loginAsCreator(page, "/resources");
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.goto("/settings", { waitUntil: "commit" });

    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#preference-theme")).toHaveValue("dark");
  } catch (error) {
    const screenshot = await saveFailureScreenshot(page, "settings-theme");
    throw new Error(
      `settings-theme probe failed. Screenshot: ${screenshot}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    await closeContext(context);
  }
}

const scenarioHandlers: Record<ProbeScenarioName, (context: ProbeContext) => Promise<void>> = {
  launch: runLaunchScenario,
  "resources-to-library": runResourcesToLibraryScenario,
  "library-to-resources": runLibraryToResourcesScenario,
  "resources-account-menu-pages": runResourcesAccountMenuPagesScenario,
  "dashboard-avatar-menu-pages": runDashboardAvatarMenuPagesScenario,
  "listing-filter-pages": runListingFilterPagesScenario,
  "admin-resource-editor-pages": runAdminResourceEditorPagesScenario,
  "dashboard-overview-refresh-shell": runDashboardOverviewRefreshShellScenario,
  "dashboard-library-refresh-shell": runDashboardLibraryRefreshShellScenario,
  "dashboard-downloads-refresh-shell": runDashboardDownloadsRefreshShellScenario,
  "dashboard-purchases-refresh-shell": runDashboardPurchasesRefreshShellScenario,
  "dashboard-settings-refresh-shell": runDashboardSettingsRefreshShellScenario,
  "dashboard-subscription-refresh-shell": runDashboardSubscriptionRefreshShellScenario,
  "admin-overview-refresh-shell": runAdminOverviewRefreshShellScenario,
  "admin-analytics-refresh-shell": runAdminAnalyticsRefreshShellScenario,
  "dashboard-to-downloads": (context) =>
    runDashboardRouteScenario(context, {
      scenario: "dashboard-to-downloads",
      linkName: /^Downloads$/,
      headingName: /Download history/i,
      urlPattern: /\/dashboard\/downloads$/,
    }),
  "dashboard-to-purchases": (context) =>
    runDashboardRouteScenario(context, {
      scenario: "dashboard-to-purchases",
      linkName: /^Purchases$/,
      headingName: /^Purchases$/,
      urlPattern: /\/dashboard\/purchases$/,
    }),
  "dashboard-to-settings": (context) =>
    runDashboardRouteScenario(context, {
      scenario: "dashboard-to-settings",
      linkName: /^Settings$/,
      headingName: /^Settings$/,
      urlPattern: /\/settings$/,
    }),
  "public-product-pages": runPublicProductPagesScenario,
  "admin-core-pages": runAdminCorePagesScenario,
  "admin-analytics-pages": runAdminAnalyticsPagesScenario,
  "creator-management-pages": runCreatorManagementPagesScenario,
  "creator-refresh-shell": runCreatorRefreshShellScenario,
  "creator-editor-refresh-shell": runCreatorEditorRefreshShellScenario,
  "dark-theme-logo": runDarkThemeLogoScenario,
  "settings-theme": runSettingsThemeScenario,
};

async function main() {
  const scenarios = parseScenarioNames(process.argv.slice(2));
  console.log(`[browser-probe] Waiting for server readiness at ${BASE_URL}/api/internal/ready ...`);
  await ensureServerReady();
  console.log("[browser-probe] Server ready. Launching browser ...");
  const probeContext = await launchBrowser();

  console.log(
    `[browser-probe] Using ${probeContext.browserName} (${HEADLESS ? "headless" : "headed"}) against ${BASE_URL}`,
  );

  try {
    for (const scenario of scenarios) {
      console.log(`[browser-probe] Running ${scenario}...`);
      await scenarioHandlers[scenario](probeContext);
      console.log(`[browser-probe] ${scenario} passed.`);
    }
  } finally {
    await probeContext.browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(
    `[browser-probe] ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
  );
  process.exit(1);
});
