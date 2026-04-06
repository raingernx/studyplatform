import { expect, test } from "@playwright/test";
import { collectRuntimeErrors } from "./helpers/browser";
import { expectImageLoaded } from "./helpers/images";

test("resource detail renders preview media or the empty preview state without refresh", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/resources/english-vocabulary-flashcards-500-essential-words");

  await expect(page).toHaveURL(
    /\/resources\/english-vocabulary-flashcards-500-essential-words$/,
  );

  const heading = page.locator("main h1").first();
  await expect(heading).toBeVisible();
  await expect(heading).not.toHaveText("");

  const primaryPreview = page
    .locator("main")
    .locator('button[aria-label="Enlarge preview"] img')
    .first();
  const emptyPreviewState = page.getByText("No preview images").first();

  await expect
    .poll(
      async () => {
        if (await primaryPreview.count()) {
          return "image";
        }

        if (await emptyPreviewState.count()) {
          return "empty";
        }

        return "pending";
      },
      { timeout: 20_000 },
    )
    .not.toBe("pending");

  if (await primaryPreview.count()) {
    await expectImageLoaded(primaryPreview);
  } else {
    await expect(emptyPreviewState).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
