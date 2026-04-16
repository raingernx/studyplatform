import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { loginAsCreator } from "./helpers/auth";

const CREATOR_EMAIL = "demo.instructor@krukraft.dev";
const DASHBOARD_SETTINGS_HEADING = /Account settings/i;

async function setUserThemePreference(email: string, theme: "light" | "dark" | "system") {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new Error(`User not found for theme preference seed: ${email}`);
    }

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: { theme },
      create: {
        userId: user.id,
        language: "th",
        theme,
        currency: "USD",
        timezone: "UTC",
        emailNotifications: true,
        purchaseReceipts: true,
        productUpdates: true,
        marketingEmails: false,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test("settings follows system runtime theme when DB preference differs from stored preference", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await setUserThemePreference(CREATOR_EMAIL, "dark");
  await page.emulateMedia({ colorScheme: "light" });

  await page.addInitScript(() => {
    window.localStorage.removeItem("user_theme");
  });

  await loginAsCreator(page, "/resources");

  await expect(page).toHaveURL(/\/resources$/);
  await expect
    .poll(() => page.locator("html").getAttribute("data-theme"), {
      timeout: 20_000,
    })
    .toBe("light");

  await page.goto("/dashboard-v2/settings", { waitUntil: "commit" }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ERR_ABORTED")) {
      throw error;
    }
  });

  await expect(page).toHaveURL(/\/dashboard-v2\/settings$/);
  await expect(page.getByRole("heading", { name: DASHBOARD_SETTINGS_HEADING })).toBeVisible();
  await expect
    .poll(() => page.locator("html").getAttribute("data-theme"), {
      timeout: 20_000,
    })
    .toBe("light");
  await expect(page.locator("#preference-theme")).toHaveValue("dark");
  await expect(page.locator("#settings-preferences")).not.toContainText(/Language/i);
});
