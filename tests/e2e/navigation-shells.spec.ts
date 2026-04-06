import { expect, test, type Page } from "@playwright/test";

import { loginAsCreator } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

const LIBRARY_NAV_TIMEOUT_MS = 15_000;

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
  return page.evaluate(() => {
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
  const directLibraryLink = page
    .getByRole("link", { name: /^(คลังของฉัน|My Library)$/ })
    .first();

  await page.getByRole("banner").hover();

  if (await directLibraryLink.isVisible({ timeout: LIBRARY_NAV_TIMEOUT_MS }).catch(() => false)) {
    await Promise.all([
      page.waitForURL(/\/dashboard\/library$/),
      directLibraryLink.click(),
    ]);
    return;
  }

  const accountButton = page.getByRole("button", { name: "เปิดเมนูบัญชี" });
  await expect(accountButton).toBeVisible({ timeout: LIBRARY_NAV_TIMEOUT_MS });
  await accountButton.click();

  await Promise.all([
    page.waitForURL(/\/dashboard\/library$/),
    page.getByRole("link", { name: /^My Library$/ }).click(),
  ]);
}

test("resources to dashboard library does not expose a blank gap during transition", async ({
  page,
}) => {
  await loginAsCreator(page, "/resources");
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expect(page).toHaveURL(/\/resources$/);

  await startNavigationProbe(page);

  await openLibraryFromResources(page);

  await expect(page).toHaveURL(/\/dashboard\/library$/);
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

  await expect(page).toHaveURL(/\/dashboard\/library$/);
  await expect(
    page.getByRole("link", { name: /Browse resources/i }).first(),
  ).toBeVisible();

  await startNavigationProbe(page);

  await Promise.all([
    page.waitForURL(/\/resources$/),
    page.getByRole("link", { name: /Browse resources/i }).first().click(),
  ]);

  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.locator("main").first()).toBeVisible();

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
