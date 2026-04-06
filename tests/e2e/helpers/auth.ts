import { expect, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
  CreatorApplicationStatus,
  CreatorStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

type LoginCredentials = {
  email: string;
  password: string;
};

const AUTH_NAVIGATION_TIMEOUT_MS = 120_000;
const AUTH_LOGIN_ATTEMPT_TIMEOUT_MS = 20_000;
const LOGIN_ERROR_TEXT = "Invalid email or password. Please try again.";

const ADMIN_CREDENTIALS: LoginCredentials = {
  email: "admin@krukraft.dev",
  password: "admin123!",
};

const CREATOR_CREDENTIALS: LoginCredentials = {
  email: "demo.instructor@krukraft.dev",
  password: "Krukraft2024!",
};

let ensureAuthFixturesPromise: Promise<void> | null = null;

async function ensureAuthFixtures() {
  const prisma = new PrismaClient();
  const hashedAdminPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 12);
  const hashedCreatorPassword = await bcrypt.hash(CREATOR_CREDENTIALS.password, 12);
  const generatedCreatorSlug = `demo-instructor-smoke-${Date.now().toString(36)}`;

  try {
    await prisma.user.upsert({
      where: { email: ADMIN_CREDENTIALS.email },
      update: {
        hashedPassword: hashedAdminPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
      },
      create: {
        name: "Admin User",
        email: ADMIN_CREDENTIALS.email,
        hashedPassword: hashedAdminPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
      },
    });

    await prisma.user.upsert({
      where: { email: CREATOR_CREDENTIALS.email },
      update: {
        hashedPassword: hashedCreatorPassword,
        role: UserRole.INSTRUCTOR,
        emailVerified: new Date(),
        creatorDisplayName: "Kru Mint",
        creatorEnabled: true,
        creatorStatus: CreatorStatus.ACTIVE,
        creatorApplicationStatus: CreatorApplicationStatus.APPROVED,
      },
      create: {
        name: "Kru Mint",
        email: CREATOR_CREDENTIALS.email,
        hashedPassword: hashedCreatorPassword,
        role: UserRole.INSTRUCTOR,
        emailVerified: new Date(),
        creatorDisplayName: "Kru Mint",
        creatorSlug: generatedCreatorSlug,
        creatorEnabled: true,
        creatorStatus: CreatorStatus.ACTIVE,
        creatorApplicationStatus: CreatorApplicationStatus.APPROVED,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureAuthFixturesOnce() {
  if (!ensureAuthFixturesPromise) {
    ensureAuthFixturesPromise = ensureAuthFixtures();
  }

  await ensureAuthFixturesPromise;
}

async function loginWithCredentials(
  page: Page,
  credentials: LoginCredentials,
  nextPath: string,
) {
  await ensureAuthFixturesOnce();
  const loginUrl = `/auth/login?next=${encodeURIComponent(nextPath)}`;
  const targetUrlPattern = new RegExp(
    `${nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\?)`,
  );
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(loginUrl, {
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: /Welcome back/i }),
    ).toBeVisible({
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
    });
    const form = page.locator("form").first();
    await expect(form).toBeVisible({ timeout: AUTH_NAVIGATION_TIMEOUT_MS });
    await expect(form).toHaveAttribute("data-auth-form-ready", "true", {
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
    });

    await page.getByLabel("Email address").fill(credentials.email);
    await page.getByLabel("Password").fill(credentials.password);

    const submitButton = form.getByRole("button", { name: /^Sign in$/ });
    const loginError = page.getByText(LOGIN_ERROR_TEXT);

    await expect(submitButton).toBeEnabled({
      timeout: AUTH_NAVIGATION_TIMEOUT_MS,
    });

    await submitButton.click();

    try {
      await page.waitForURL(targetUrlPattern, {
        timeout: AUTH_LOGIN_ATTEMPT_TIMEOUT_MS,
        waitUntil: "commit",
      });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(500);

      if (targetUrlPattern.test(page.url())) {
        return;
      }

      lastError = new Error(
        `Credential login landed on ${page.url()} after briefly matching ${nextPath}.`,
      );
    } catch (error) {
      lastError = error;
    }

    const visibleLoginError = (await loginError.isVisible().catch(() => false))
      ? await loginError.textContent()
      : null;
    const currentUrl = page.url();
    const buttonEnabled = await submitButton.isEnabled().catch(() => false);
    const isStillOnLogin = /\/auth\/login(?:\?|$)/.test(currentUrl);

    if (visibleLoginError || !isStillOnLogin || attempt === 1) {
      throw new Error(
        [
          `Credential login did not navigate to ${nextPath}.`,
          `Current URL: ${currentUrl}.`,
          `Visible login error: ${visibleLoginError?.trim() ?? "none"}.`,
          `Submit button enabled: ${buttonEnabled}.`,
          `Attempt: ${attempt + 1}/2.`,
          `Underlying error: ${
            lastError instanceof Error ? lastError.message : String(lastError)
          }`,
        ].join(" "),
      );
    }
  }
}

export async function loginAsAdmin(page: Page, nextPath: string) {
  await loginWithCredentials(page, ADMIN_CREDENTIALS, nextPath);
}

export async function loginAsCreator(page: Page, nextPath: string) {
  await loginWithCredentials(page, CREATOR_CREDENTIALS, nextPath);
}
