import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { expect } from "@playwright/test";
import { chromium, webkit, type Browser, type BrowserContext, type Page } from "playwright";

import { collectRuntimeErrors } from "../tests/e2e/helpers/browser";
import { loginAsAdmin, loginAsCreator } from "../tests/e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS !== "0";
const ALLOW_READY_TIMEOUT = process.env.BROWSER_PROBE_ALLOW_READY_TIMEOUT === "1";
const OUTPUT_DIR = path.join(process.cwd(), "test-results", "browser-probe");
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_INTERVAL_MS = 2_000;
const CREATOR_EMAIL = "demo.instructor@krukraft.dev";

type ProbeScenarioName =
  | "launch"
  | "resources-to-library"
  | "library-to-resources"
  | "settings-theme"
  | "public-product-pages"
  | "admin-core-pages"
  | "admin-analytics-pages"
  | "creator-management-pages"
  | "dashboard-to-downloads"
  | "dashboard-to-purchases"
  | "dashboard-to-settings";

type ProbeContext = {
  browserName: "chromium" | "webkit";
  browser: Browser;
};

const VALID_SCENARIOS: ProbeScenarioName[] = [
  "launch",
  "resources-to-library",
  "library-to-resources",
  "settings-theme",
  "public-product-pages",
  "admin-core-pages",
  "admin-analytics-pages",
  "creator-management-pages",
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
      const response = await fetch(readyUrl, { cache: "no-store" });
      if (response.ok) {
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
    {
      name: "webkit",
      launch: () => webkit.launch({ headless: HEADLESS }),
    },
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

async function openLibraryFromResources(page: Page) {
  const directLibraryLink = page
    .getByRole("link", { name: /^(คลังของฉัน|My Library)$/ })
    .first();
  const accountButton = page
    .getByRole("button", { name: /^(เปิดเมนูบัญชี|Open account menu)$/i })
    .first();

  await page.getByRole("banner").first().hover();
  await expect
    .poll(async () =>
      (await directLibraryLink.isVisible().catch(() => false)) ||
      (await accountButton.isVisible().catch(() => false)))
    .toBeTruthy();

  if (await directLibraryLink.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForURL(/\/dashboard\/library$/),
      directLibraryLink.click(),
    ]);
    return;
  }

  await expect(accountButton).toBeVisible();
  await accountButton.click();

  await Promise.all([
    page.waitForURL(/\/dashboard\/library$/),
    page.getByRole("link", { name: /^(คลังของฉัน|My Library)$/ }).click(),
  ]);
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

    await openLibraryFromResources(page);

    await expect(page).toHaveURL(/\/dashboard\/library$/);
    await expect(page.getByRole("heading", { name: /My Library/i })).toBeVisible();
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

    const browseLink = page.getByRole("link", { name: /Browse resources/i }).first();
    await expect(browseLink).toBeVisible();

    await Promise.all([page.waitForURL(/\/resources$/), browseLink.click()]);

    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.locator("main").first()).toBeVisible();
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
  "settings-theme": runSettingsThemeScenario,
};

async function main() {
  const scenarios = parseScenarioNames(process.argv.slice(2));
  await ensureServerReady();
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
