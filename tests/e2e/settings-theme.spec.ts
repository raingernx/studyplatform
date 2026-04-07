import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { loginAsCreator } from "./helpers/auth";

const CREATOR_EMAIL = "demo.instructor@krukraft.dev";

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
        language: "en",
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

test("settings does not flip runtime theme when DB preference differs from local default", async ({
  page,
}) => {
  test.setTimeout(60_000);

  await setUserThemePreference(CREATOR_EMAIL, "dark");

  await page.addInitScript(() => {
    window.localStorage.removeItem("user_theme");
  });

  await loginAsCreator(page, "/resources");

  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.goto("/settings", { waitUntil: "commit" }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ERR_ABORTED")) {
      throw error;
    }
  });

  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#preference-theme")).toHaveValue("dark");
});
