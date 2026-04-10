import { expect, test, type Page } from "@playwright/test";

import { loginAsCreator, loginAsUser } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

test.describe.configure({ timeout: 180_000 });

const DASHBOARD_FULL_SHELL_SCOPES = [
  "dashboard-group",
  "dashboard-overview",
  "dashboard-library",
  "dashboard-downloads",
  "dashboard-purchases",
  "dashboard-settings",
  "dashboard-subscription",
  "dashboard-creator-layout",
  "dashboard-creator-overview",
  "dashboard-creator-analytics",
  "dashboard-creator-resources",
  "dashboard-creator-sales",
  "dashboard-creator-profile",
  "dashboard-creator-resource-editor",
  "dashboard-creator-apply",
] as const;

async function expectNoDashboardGroupOverlay(page: Page) {
  await expect(page.locator('[data-loading-scope="dashboard-group"]:visible')).toHaveCount(0, {
    timeout: 20_000,
  });
}

async function expectNoDashboardShellStack(page: Page) {
  const visibleScopes = (await page.evaluate(`
    (() => {
      const knownScopes = ${JSON.stringify([...DASHBOARD_FULL_SHELL_SCOPES])};
      return Array.from(document.querySelectorAll("[data-loading-scope]"))
        .filter((node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          const style = window.getComputedStyle(node);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          ) {
            return false;
          }

          const rect = node.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
          );
        })
        .map((node) => node.getAttribute("data-loading-scope"))
        .filter((value) => typeof value === "string" && value.length > 0)
        .filter((scope) => knownScopes.includes(scope));
    })()
  `)) as string[];

  expect(Array.from(new Set(visibleScopes)).length).toBeLessThanOrEqual(1);
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
    await expectNoDashboardShellStack(page);
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
    await expectNoDashboardShellStack(page);
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("creator apply clears dashboard overlays without shell stacking for regular users", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsUser(page, "/resources");
  await page.goto("/dashboard/creator/apply", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/dashboard\/creator\/apply$/);
  await expect(page.locator('[data-route-shell-ready="dashboard-creator-apply"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: /^Become a Creator$/i }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expectNoDashboardGroupOverlay(page);
  await expectNoDashboardShellStack(page);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
