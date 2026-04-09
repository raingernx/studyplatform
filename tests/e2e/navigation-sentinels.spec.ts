import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { loginAsAdmin, loginAsCreator } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

test.describe.configure({ timeout: 90_000 });

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
      'header button[aria-label="เปิดเมนูบัญชี"]:visible, header button[aria-label="Open account menu"]:visible',
    )
    .first();

  await expect(accountButton).toBeVisible({ timeout: 20_000 });

  const targets: Array<{ href: string; heading: RegExp }> = [
    { href: "/dashboard", heading: /Welcome back/i },
    { href: "/dashboard/purchases", heading: /^Purchases$/i },
    { href: "/settings", heading: /^Settings$/i },
  ];

  for (const target of targets) {
    await page.goto("/resources", { waitUntil: "domcontentloaded" });
    await accountButton.click();

    const link = page.locator(`a[href="${target.href}"]:visible`).first();
    await expect(link).toBeVisible({ timeout: 20_000 });

    await Promise.all([
      page.waitForURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`)),
      link.click(),
    ]);

    await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("dashboard avatar menu reaches library purchases and settings", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/dashboard");
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i }).first()).toBeVisible();

  const avatarButton = page
    .locator('header button[data-dashboard-account-trigger="true"]:visible')
    .first();

  await expect(avatarButton).toBeVisible({ timeout: 20_000 });

  const targets: Array<{ href: string; heading: RegExp }> = [
    { href: "/dashboard/library", heading: /^My Library$/i },
    { href: "/dashboard/purchases", heading: /^Purchases$/i },
    { href: "/settings", heading: /^Settings$/i },
  ];

  for (const target of targets) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Welcome back/i }).first()).toBeVisible({
      timeout: 20_000,
    });

    await avatarButton.click();

    const link = page
      .locator(
        `header [data-dashboard-account-menu="true"] a[data-dashboard-account-link="${target.href}"]:visible`,
      )
      .first();
    await expect(link).toBeVisible({ timeout: 20_000 });

    await Promise.all([
      page.waitForURL(new RegExp(`${target.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`)),
      link.click(),
    ]);

    await expect(page.getByRole("heading", { name: target.heading }).first()).toBeVisible({
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
