import { expect, test } from "@playwright/test";
import { collectRuntimeErrors } from "./helpers/browser";

test("dashboard-v2 redirects unauthenticated visitors to login with next param", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/dashboard-v2", { waitUntil: "domcontentloaded" });

  await page.waitForURL(/\/auth\/login\?next=%2Fdashboard-v2(?:$|&)/, {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("admin redirects unauthenticated visitors to login with next param", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/admin", { waitUntil: "domcontentloaded" });

  await page.waitForURL(/\/auth\/login\?next=%2Fadmin(?:$|&)/, {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
