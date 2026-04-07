import { expect, test, type Page } from "@playwright/test";

import { loginAsCreator } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

const LIBRARY_NAV_TIMEOUT_MS = 15_000;

test.describe.configure({ timeout: 75_000 });

async function startNavigationProbe(page: Page) {
  await page.evaluate(() => {
    type NavSample = {
      href: string;
      ts: number;
      hasMain: boolean;
      mainChildren: number;
      mainTextLength: number;
      loadingScopes: string[];
    };

    const samples: NavSample[] = [];
    let stopped = false;
    let rafId = 0;

    const sample = () => {
      const main = document.querySelector("main");
      const loadingScopes = Array.from(
        document.querySelectorAll("[data-loading-scope]"),
      )
        .map((node) => node.getAttribute("data-loading-scope"))
        .filter((value): value is string => Boolean(value));

      samples.push({
        href: `${window.location.pathname}${window.location.search}`,
        ts: performance.now(),
        hasMain: Boolean(main),
        mainChildren: main?.children.length ?? 0,
        mainTextLength: main?.textContent?.trim().length ?? 0,
        loadingScopes,
      });

      if (!stopped) {
        rafId = window.requestAnimationFrame(sample);
      }
    };

    (window as Window & {
      __krukraftNavProbe?: {
        stop: () => NavSample[];
      };
    }).__krukraftNavProbe = {
      stop: () => {
        stopped = true;
        window.cancelAnimationFrame(rafId);
        return samples;
      },
    };

    rafId = window.requestAnimationFrame(sample);
  });
}

async function stopNavigationProbe(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await page.evaluate(() => {
        const probe = (window as Window & {
          __krukraftNavProbe?: {
            stop: () => Array<{
              href: string;
              ts: number;
              hasMain: boolean;
              mainChildren: number;
              mainTextLength: number;
              loadingScopes: string[];
            }>;
          };
        }).__krukraftNavProbe;

        return probe?.stop() ?? [];
      });
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

function expectNoBlankGap(
  samples: Array<{
    href: string;
    hasMain: boolean;
    mainChildren: number;
    mainTextLength: number;
    loadingScopes: string[];
  }>,
  targetPathPattern: RegExp,
) {
  const targetSamples = samples.filter((sample) =>
    targetPathPattern.test(sample.href),
  );

  const blankSample = targetSamples.find(
    (sample) =>
      sample.loadingScopes.length === 0 &&
      (!sample.hasMain ||
        (sample.mainChildren === 0 && sample.mainTextLength === 0)),
  );

  expect(blankSample).toBeUndefined();
}

async function openLibraryFromResources(page: Page) {
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
      { timeout: LIBRARY_NAV_TIMEOUT_MS },
    )
    .toBeTruthy();

  if (await directLibraryLink.isVisible().catch(() => false)) {
    await clickForNavigation(page, directLibraryLink, /\/dashboard\/library$/);
    return;
  }

  await expect(accountButton).toBeVisible({ timeout: LIBRARY_NAV_TIMEOUT_MS });
  await accountButton.click();

  const menuLibraryLink = page
    .locator('[role="menu"] a[href="/dashboard/library"]:visible, a[href="/dashboard/library"]:visible')
    .last();
  await expect(menuLibraryLink).toBeVisible({ timeout: LIBRARY_NAV_TIMEOUT_MS });

  await clickForNavigation(page, menuLibraryLink, /\/dashboard\/library$/);
}

async function clickForNavigation(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  targetUrl: RegExp,
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await locator.click();

    try {
      await page.waitForURL(targetUrl, {
        timeout: 5_000,
        waitUntil: "commit",
      });
      return;
    } catch {
      // Retry once when the first click loses the race to hydration or route
      // registration in CI. The follow-up attempt reuses the same visible node.
    }
  }

  await page.waitForURL(targetUrl, {
    timeout: LIBRARY_NAV_TIMEOUT_MS,
    waitUntil: "commit",
  });
}

test("resources to dashboard library does not expose a blank gap during transition", async ({
  page,
}) => {
  await loginAsCreator(page, "/resources");
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expect(page).toHaveURL(/\/resources$/, {
    timeout: LIBRARY_NAV_TIMEOUT_MS,
  });

  await startNavigationProbe(page);

  await openLibraryFromResources(page);

  await expect(page).toHaveURL(/\/dashboard\/library$/, {
    timeout: LIBRARY_NAV_TIMEOUT_MS,
  });
  await expect(page.locator("main").first()).toBeVisible();

  const samples = await stopNavigationProbe(page);
  expect(samples.some((sample) => sample.loadingScopes.includes("dashboard-group"))).toBeTruthy();
  expectNoBlankGap(samples, /\/dashboard\/library$/);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("dashboard library back to resources keeps shell coverage during transition", async ({
  page,
}) => {
  await loginAsCreator(page, "/dashboard/library");
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expect(page).toHaveURL(/\/dashboard\/library$/, {
    timeout: LIBRARY_NAV_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("link", { name: /Browse resources/i }).first(),
  ).toBeVisible({ timeout: LIBRARY_NAV_TIMEOUT_MS });

  await startNavigationProbe(page);

  await clickForNavigation(
    page,
    page.getByRole("link", { name: /Browse resources/i }).first(),
    /\/resources$/,
  );

  await expect(page).toHaveURL(/\/resources$/, {
    timeout: LIBRARY_NAV_TIMEOUT_MS,
  });
  await expect(page.locator("main").first()).toBeVisible();
  await page.waitForLoadState("domcontentloaded");

  const samples = await stopNavigationProbe(page);
  expect(
    samples.some(
      (sample) =>
        sample.loadingScopes.includes("resources-browse") ||
        sample.loadingScopes.includes("resource-detail"),
    ),
  ).toBeTruthy();
  expectNoBlankGap(samples, /\/resources$/);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
