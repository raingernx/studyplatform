import { expect, test, type Page } from "@playwright/test";

import { loginAsCreator } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

test.describe.configure({ timeout: 180_000 });

async function expectNoDashboardGroupOverlay(page: Page) {
  await expect(page.locator('[data-loading-scope="dashboard-group"]:visible')).toHaveCount(0, {
    timeout: 20_000,
  });
}

test("creator workspace routes render creator shells without dashboard-in-dashboard flash", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  const creatorRoutes: Array<{
    path: string;
    routeReady: string;
    heading: RegExp;
  }> = [
    {
      path: "/dashboard/creator/resources",
      routeReady: "dashboard-creator-resources",
      heading: /^Resource management$/i,
    },
    {
      path: "/dashboard/creator/resources/new",
      routeReady: "dashboard-creator-resource-editor",
      heading: /^(Create your first resource|New resource)$/i,
    },
    {
      path: "/dashboard/creator/profile",
      routeReady: "dashboard-creator-profile",
      heading: /^Creator Profile$/i,
    },
    {
      path: "/dashboard/creator/analytics",
      routeReady: "dashboard-creator-analytics",
      heading: /^Analytics$/i,
    },
    {
      path: "/dashboard/creator/sales",
      routeReady: "dashboard-creator-sales",
      heading: /^Sales$/i,
    },
  ];

  await loginAsCreator(page, creatorRoutes[0].path);

  for (const route of creatorRoutes) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator(`[data-route-shell-ready="${route.routeReady}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expectNoDashboardGroupOverlay(page);
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("dashboard-lite account surfaces clear the dashboard overlay after shell readiness", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  const dashboardLiteRoutes: Array<{
    path: string;
    routeReady: string;
    heading: RegExp;
  }> = [
    {
      path: "/settings",
      routeReady: "dashboard-settings",
      heading: /^Settings$/i,
    },
    {
      path: "/subscription",
      routeReady: "dashboard-subscription",
      heading: /^(Membership|Subscription)$/i,
    },
  ];

  await loginAsCreator(page, "/dashboard");

  for (const route of dashboardLiteRoutes) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator(`[data-route-shell-ready="${route.routeReady}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expectNoDashboardGroupOverlay(page);
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
