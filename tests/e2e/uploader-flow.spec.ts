import { expect, test, type Page } from "@playwright/test";
import { collectRuntimeErrors } from "./helpers/browser";
import { loginAsAdmin, loginAsCreator } from "./helpers/auth";
import { createTinyPngUpload } from "./helpers/images";

test.describe.configure({ timeout: 180_000 });

const TARGET_NAVIGATION_TIMEOUT_MS = 120_000;

type UploaderFlowConfig = {
  targetPath: string;
  headingName: RegExp;
  uploaderLabel: string;
  uploadRouteFragment: string;
};

async function verifyUploaderFlow(
  page: Page,
  config: UploaderFlowConfig,
) {
  await page.goto(config.targetPath, {
    timeout: TARGET_NAVIGATION_TIMEOUT_MS,
    waitUntil: "commit",
  });

  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  const uploaderRoot = page.getByTestId("preview-image-uploader");

  await expect(page).toHaveURL(
    new RegExp(config.targetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    { timeout: TARGET_NAVIGATION_TIMEOUT_MS },
  );
  await expect(page.getByRole("heading", { name: config.headingName })).toBeVisible({
    timeout: TARGET_NAVIGATION_TIMEOUT_MS,
  });

  const uploaderHeading = page.getByText(config.uploaderLabel).first();
  await uploaderHeading.scrollIntoViewIfNeeded();
  await expect(uploaderHeading).toBeVisible();
  await expect(uploaderRoot).toBeVisible();

  const imageFileInputs = uploaderRoot.locator('input[type="file"][accept="image/*"]');
  const beforeInputCount = await imageFileInputs.count();

  if (beforeInputCount === 0) {
    const lazyShell = uploaderRoot.getByRole("button", { name: "Load image uploader" }).first();
    const shellVisible = await lazyShell.isVisible({ timeout: 1_500 }).catch(
      () => false,
    );

    if (shellVisible) {
      await lazyShell.scrollIntoViewIfNeeded().catch(() => {});
      await lazyShell.hover().catch(() => {});
      await lazyShell.focus().catch(() => {});

      try {
        await expect
          .poll(async () => imageFileInputs.count(), { timeout: 5_000 })
          .toBeGreaterThan(0);
      } catch {
        try {
          await lazyShell.click({ timeout: 2_000 });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (
            !message.includes("detached from the DOM") &&
            !message.includes("waiting for locator") &&
            !message.includes("element is not attached") &&
            !message.includes("Target page, context or browser has been closed")
          ) {
            throw error;
          }
        }
      }
    }
  }

  await expect
    .poll(async () => imageFileInputs.count(), { timeout: 20_000 })
    .toBeGreaterThan(0);

  pageErrors.length = 0;
  consoleErrors.length = 0;

  const uploadResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes(config.uploadRouteFragment) &&
      response.request().method() === "POST"
    );
  });

  const uploaderInputCount = await imageFileInputs.count();
  await imageFileInputs
    .nth(Math.max(uploaderInputCount - 1, 0))
    .setInputFiles(createTinyPngUpload());

  const uploadResponse = await uploadResponsePromise;
  expect(uploadResponse.ok()).toBeTruthy();

  await expect(page.getByRole("button", { name: "Remove image" })).toHaveCount(1);
  await expect(page.getByText("Cover").first()).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

test("admin preview uploader activates lazily and uploads an image after login", async ({
  page,
}) => {
  await loginAsAdmin(page, "/resources");

  await verifyUploaderFlow(page, {
    targetPath: "/admin/resources/new",
    headingName: /Create Resource/i,
    uploaderLabel: "Preview images",
    uploadRouteFragment: "/api/admin/upload/image",
  });
});

test("creator preview uploader activates lazily and uploads an image after login", async ({
  page,
}) => {
  await loginAsCreator(page, "/resources");

  await verifyUploaderFlow(page, {
    targetPath: "/dashboard/creator/resources/new",
    headingName: /Create your first resource|New resource/i,
    uploaderLabel: "รูปภาพพรีวิว",
    uploadRouteFragment: "/api/creator/upload/image",
  });
});
