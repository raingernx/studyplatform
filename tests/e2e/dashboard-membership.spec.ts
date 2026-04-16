import { expect, test } from "@playwright/test";

import { collectRuntimeErrors } from "./helpers/browser";
import { loginAsCreator } from "./helpers/auth";

test("dashboard membership renders live route actions for free-plan users", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/dashboard-v2/membership");

  await expect(page).toHaveURL(/\/dashboard-v2\/membership$/);
  await expect(
    page.locator('[data-route-shell-ready="dashboard-subscription"]').first(),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: /^Membership$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Explore plans$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^View purchases$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Cancel renewal$/i })).toHaveCount(0);
  await expect(page.getByText(/^Free plan$/i).first()).toBeVisible();
  await expect(page.getByText(/No renewal scheduled/i).first()).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
