import { expect, test } from "@playwright/test";

import { collectRuntimeErrors } from "./helpers/browser";
import { loginAsCreator } from "./helpers/auth";

test("public membership page renders DS pricing flow without runtime errors", async ({
  page,
}) => {
  test.setTimeout(90_000);

  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/membership");

  await expect(page).toHaveURL(/\/membership$/);
  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Monthly" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Annual/i })).toBeVisible();
  const pricingSection = page.locator("#pricing-cards");
  await expect(
    pricingSection.getByRole("link", { name: "Browse resources" }),
  ).toBeVisible();
  await expect(
    pricingSection.getByRole("button", { name: "Choose Pro" }),
  ).toBeVisible();
  await expect(
    pricingSection.getByRole("button", { name: "Choose Team" }),
  ).toBeVisible();
  await expect(page.getByText("Need help with billing or seats?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
  await expect(page.getByText("Can I switch plans later?")).toBeVisible();

  const proCard = page.locator('[data-membership-tier="pro"]').first();

  await expect(proCard).toContainText("THB 189");

  await page.getByRole("button", { name: "Monthly" }).click();

  await expect(proCard).toContainText("THB 249");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("public membership page keeps authenticated navbar state for signed-in viewers", async ({
  page,
}) => {
  test.setTimeout(90_000);

  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsCreator(page, "/membership");

  await expect(page).toHaveURL(/\/membership$/);
  await expect(
    page.locator(
      'header button[data-dashboard-account-trigger="true"][data-dashboard-account-ready="true"]',
    ).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "เข้าสู่ระบบ" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "เริ่มต้นใช้งาน" }),
  ).toHaveCount(0);

  const proCheckoutPayloads: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("/api/stripe/checkout") &&
      request.method() === "POST"
    ) {
      proCheckoutPayloads.push(request.postData() ?? "");
    }
  });
  await page
    .locator('[data-membership-tier="pro"]')
    .first()
    .getByRole("button", { name: "Choose Pro" })
    .click({ noWaitAfter: true });

  await expect
    .poll(
      () => proCheckoutPayloads.some((payload) => payload.includes("\"plan\":\"pro_annual\"")),
      { timeout: 15_000 },
    )
    .toBeTruthy();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
