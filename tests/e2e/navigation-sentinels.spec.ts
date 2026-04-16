import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { loginAsAdmin, loginAsCreator } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

test.describe.configure({ timeout: 90_000 });

const DASHBOARD_SETTINGS_HEADING = /Account settings/i;

async function waitForResourcesShell(page: Page) {
  await expect(page).toHaveURL(/\/resources(?:\?.*)?$/, { timeout: 30_000 });
  await expect(page.locator('[data-route-shell-ready="resources-browse"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.locator('[data-loading-scope="resources-browse"][data-resources-overlay]:visible'),
  ).toHaveCount(0, {
    timeout: 30_000,
  });
}

async function returnToResources(page: Page) {
  await page.goto("/resources", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await waitForResourcesShell(page);
}

async function openAccountMenu(page: Page, trigger: Locator) {
  const menu = page.locator('[data-dashboard-account-menu="true"]:visible').first();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await trigger.scrollIntoViewIfNeeded().catch(() => undefined);
    await trigger.click({ timeout: 5_000 });

    try {
      await expect(menu).toBeVisible({ timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }

      await page.keyboard.press("Escape").catch(() => undefined);
    }
  }
}

async function clickAccountMenuTargetWithRetry(
  page: Page,
  trigger: Locator,
  href: string,
) {
  const visibleMenu = page.locator('[data-dashboard-account-menu="true"]:visible').first();
  const urlPattern = new RegExp(
    `${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`,
  );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await openAccountMenu(page, trigger);

    const item = page
      .locator(
        `[data-dashboard-account-menu="true"] [data-dashboard-account-link="${href}"]:visible`,
      )
      .first();
    await expect(item).toBeVisible({ timeout: 20_000 });
    await item.scrollIntoViewIfNeeded().catch(() => undefined);
    await item.click();

    try {
      await expect(page).toHaveURL(urlPattern, { timeout: 20_000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }

      await page.keyboard.press("Escape").catch(() => undefined);
      await expect(visibleMenu).toHaveCount(0, { timeout: 2_000 }).catch(() => undefined);
    }
  }
}

async function findSeededResourceId() {
  const prisma = new PrismaClient();

  try {
    const resource = await prisma.resource.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!resource) {
      throw new Error("No seeded resource found for navigation sentinel tests.");
    }

    return resource.id;
  } finally {
    await prisma.$disconnect();
  }
}

test("public account dropdown reaches dashboard routes without shell hangs", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/resources");
  await expect(page).toHaveURL(/\/resources(?:\?.*)?$/);

  const accountButton = page
    .locator(
      'header button[data-dashboard-account-trigger="true"][data-dashboard-account-ready="true"]',
    )
    .first();

  await expect(accountButton).toBeVisible({ timeout: 30_000 });

  const targets: Array<{ href: string; heading: RegExp; routeReady: string }> = [
    { href: "/dashboard-v2", heading: /Welcome back/i, routeReady: "dashboard-overview" },
    {
      href: "/dashboard-v2/membership",
      heading: /^(Membership|Subscription)$/i,
      routeReady: "dashboard-subscription",
    },
    {
      href: "/dashboard-v2/settings",
      heading: DASHBOARD_SETTINGS_HEADING,
      routeReady: "dashboard-settings",
    },
    {
      href: "/dashboard-v2/creator",
      heading: /^Workspace$/i,
      routeReady: "dashboard-creator-overview",
    },
    {
      href: "/dashboard-v2/creator/resources",
      heading: /^Creator resources$/i,
      routeReady: "dashboard-creator-resources",
    },
    {
      href: "/dashboard-v2/creator/sales",
      heading: /^Earnings$/i,
      routeReady: "dashboard-creator-sales",
    },
  ];

  for (const target of targets) {
    await returnToResources(page);
    await expect(accountButton).toBeVisible({ timeout: 30_000 });
    await clickAccountMenuTargetWithRetry(page, accountButton, target.href);

    await expect(page.locator(`[data-route-shell-ready="${target.routeReady}"]`).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-loading-scope="dashboard-group"]:visible')).toHaveCount(0, {
      timeout: 20_000,
    });
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("dashboard avatar menu reaches home membership and settings", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/dashboard-v2");
  await expect(page).toHaveURL(/\/dashboard-v2(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i }).first()).toBeVisible({
    timeout: 20_000,
  });

  const avatarButton = page
    .locator(
      'header button[data-dashboard-account-trigger="true"][data-dashboard-account-ready="true"]:visible',
    )
    .first();

  await expect(avatarButton).toBeVisible({ timeout: 20_000 });

  const targets: Array<{ href: string; heading: RegExp; routeReady: string }> = [
    { href: "/dashboard-v2", heading: /Welcome back/i, routeReady: "dashboard-overview" },
    {
      href: "/dashboard-v2/membership",
      heading: /^Membership$/i,
      routeReady: "dashboard-subscription",
    },
    {
      href: "/dashboard-v2/settings",
      heading: DASHBOARD_SETTINGS_HEADING,
      routeReady: "dashboard-settings",
    },
  ];

  for (const target of targets) {
    await page.goto("/dashboard-v2", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Welcome back/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-loading-scope="dashboard-group"]:visible')).toHaveCount(0, {
      timeout: 20_000,
    });

    await openAccountMenu(page, avatarButton);

    const link = page
      .locator(
        `[data-dashboard-account-menu="true"] [data-dashboard-account-link="${target.href}"]:visible`,
      )
      .first();
    await expect(link).toBeVisible({ timeout: 20_000 });

    await link.click();
    await expect(page).toHaveURL(
      new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`),
      { timeout: 20_000 },
    );

    await expect(page.locator(`[data-route-shell-ready="${target.routeReady}"]`).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-loading-scope="dashboard-group"]:visible')).toHaveCount(0, {
      timeout: 20_000,
    });
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("filtered and search listing sentinels render shell without route error card", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/resources");

  const targets = [
    "/resources?category=art-creativity",
    "/resources?category=science",
    "/resources?search=worksheet",
  ];

  for (const target of targets) {
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator('[data-route-shell-ready="resources-browse"]').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("heading", { name: /The resource library could not load\./i }),
    ).toHaveCount(0);
    await expect(page.locator('main a[href^="/resources/"]:visible').first()).toBeVisible({
      timeout: 20_000,
    });
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("admin resource editor sentinel routes render create and edit shells", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const resourceId = await findSeededResourceId();

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
});
