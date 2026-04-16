import { expect, test, type Page } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";
import { collectRuntimeErrors } from "./helpers/browser";

test.describe.configure({ timeout: 120_000 });

async function expectReadinessMarker(page: Page, url: string, marker: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator(`[${marker}="true"]`).first()).toBeVisible({
    timeout: 30_000,
  });
}

test("register form exposes readiness markers before enabling auth controls", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expectReadinessMarker(page, "/auth/register", "data-auth-register-form-ready");
  await expect(
    page.locator('[data-auth-register-google-ready="true"]').first(),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("#name")).toBeEnabled();
  await expect(page.locator("#email")).toBeEnabled();
  await expect(page.locator("#password")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Create account$/i }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Continue with Google$/i }),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("reset-password request form exposes readiness marker before enabling submit", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expectReadinessMarker(
    page,
    "/auth/reset-password",
    "data-auth-reset-password-form-ready",
  );
  await expect(page.locator("#email")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Send reset link$/i }),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("reset-password confirm form exposes readiness marker before enabling submit", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await expectReadinessMarker(
    page,
    "/auth/reset-password/confirm?token=test-token",
    "data-auth-reset-password-confirm-form-ready",
  );
  await expect(page.locator("#password")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Update password$/i }),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("admin tags create form exposes readiness marker before enabling input", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await loginAsAdmin(page, "/admin/tags");
  await expect(
    page.locator('[data-admin-tags-create-form-ready="true"]').first(),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByPlaceholder("Tag name, e.g. Exam Prep"),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
