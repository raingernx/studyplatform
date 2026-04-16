import { expect, test } from "@playwright/test";

import { loginAsCreator } from "./helpers/auth";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nS8AAAAASUVORK5CYII=";

function assetKey(value: string) {
  try {
    const parsed = new URL(value, "http://127.0.0.1:3000");
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? value;
  } catch {
    return value.split("/").filter(Boolean).at(-1) ?? value;
  }
}

test("creator profile uploads store avatar and banner assets that reach the public page", async ({
  page,
}) => {
  test.setTimeout(300_000);

  await loginAsCreator(page, "/dashboard-v2/creator/profile");

  await expect(page.locator('[data-route-shell-ready="dashboard-creator-profile"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: /^Profile$/i }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.locator('[data-creator-profile-form-ready="true"]').first(),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: /save creator profile/i })).toBeVisible();

  const avatarBuffer = Buffer.from(TINY_PNG_BASE64, "base64");
  const bannerBuffer = Buffer.from(TINY_PNG_BASE64, "base64");

  await page.getByTestId("creator-avatar-upload-input").setInputFiles({
    name: "creator-avatar-test.png",
    mimeType: "image/png",
    buffer: avatarBuffer,
  });
  await expect(page.getByText(/Store avatar ready to save\./i)).toBeVisible({
    timeout: 30_000,
  });

  await page.getByTestId("creator-banner-upload-input").setInputFiles({
    name: "creator-banner-test.png",
    mimeType: "image/png",
    buffer: bannerBuffer,
  });
  await expect(page.getByText(/Banner ready to save\./i)).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: /save creator profile/i }).click();
  await expect(page.getByText(/Creator profile updated\./i)).toBeVisible({
    timeout: 30_000,
  });

  const profileResponse = await page.request.get("http://127.0.0.1:3000/api/creator/profile");
  expect(profileResponse.ok()).toBeTruthy();
  const profilePayload = (await profileResponse.json()) as {
    data?: {
      creatorAvatar?: string | null;
      creatorBanner?: string | null;
      creatorSlug?: string | null;
      creatorDisplayName?: string | null;
    };
  };

  const creatorAvatar = profilePayload.data?.creatorAvatar ?? null;
  const creatorBanner = profilePayload.data?.creatorBanner ?? null;
  const creatorSlug = profilePayload.data?.creatorSlug ?? null;

  expect(creatorAvatar).toBeTruthy();
  expect(creatorBanner).toBeTruthy();
  expect(creatorSlug).toBeTruthy();

  const avatarKey = assetKey(creatorAvatar!);
  const bannerKey = assetKey(creatorBanner!);

  await page.goto(`/creators/${creatorSlug}`);
  await expect(page).toHaveURL(new RegExp(`/creators/${creatorSlug}$`));
  await expect(
    page.getByRole("heading", {
      name: new RegExp(profilePayload.data?.creatorDisplayName ?? "Kru Mint", "i"),
    }),
  ).toBeVisible({
    timeout: 30_000,
  });

  const imgSources = await page.locator("img").evaluateAll((images) =>
    images
      .map((image) => image.getAttribute("src"))
      .filter((value): value is string => Boolean(value)),
  );

  expect(imgSources.some((src) => src.includes(avatarKey))).toBeTruthy();
  expect(imgSources.some((src) => src.includes(bannerKey))).toBeTruthy();
});
