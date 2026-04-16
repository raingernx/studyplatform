import { expect, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
  CreatorApplicationStatus,
  CreatorStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

export type LoginCredentials = {
  email: string;
  password: string;
};

const AUTH_NAVIGATION_TIMEOUT_MS = 120_000;
const AUTH_CALLBACK_RETRY_LIMIT = 3;
const AUTH_GOTO_RETRY_LIMIT = 3;
const TEST_BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:3000";

const ADMIN_CREDENTIALS: LoginCredentials = {
  email: "admin@krukraft.dev",
  password: "admin123!",
};

const CREATOR_CREDENTIALS: LoginCredentials = {
  email: "demo.instructor@krukraft.dev",
  password: "Krukraft2024!",
};

const USER_CREDENTIALS: LoginCredentials = {
  email: "demo.user@krukraft.dev",
  password: "Krukraft2024!",
};

let ensureAuthFixturesPromise: Promise<void> | null = null;

function isRetryableAuthGotoError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /ERR_ABORTED|ERR_CONNECTION_REFUSED|Timeout .* exceeded|frame was detached/i.test(
    message,
  );
}

async function ensureAuthFixtures() {
  const prisma = new PrismaClient();
  const hashedAdminPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 12);
  const hashedCreatorPassword = await bcrypt.hash(CREATOR_CREDENTIALS.password, 12);
  const hashedUserPassword = await bcrypt.hash(USER_CREDENTIALS.password, 12);
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

    await prisma.user.upsert({
      where: { email: USER_CREDENTIALS.email },
      update: {
        hashedPassword: hashedUserPassword,
        role: UserRole.STUDENT,
        emailVerified: new Date(),
        creatorEnabled: false,
        creatorStatus: CreatorStatus.INACTIVE,
        creatorApplicationStatus: CreatorApplicationStatus.NOT_APPLIED,
      },
      create: {
        name: "Demo Learner",
        email: USER_CREDENTIALS.email,
        hashedPassword: hashedUserPassword,
        role: UserRole.STUDENT,
        emailVerified: new Date(),
        creatorEnabled: false,
        creatorStatus: CreatorStatus.INACTIVE,
        creatorApplicationStatus: CreatorApplicationStatus.NOT_APPLIED,
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

export async function loginWithCredentials(
  page: Page,
  credentials: LoginCredentials,
  nextPath: string,
) {
  await ensureAuthFixturesOnce();
  const targetUrlPattern = new RegExp(
    `${nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\?)`,
  );
  const request = page.context().request;

  const csrfResponse = await request.get(`${TEST_BASE_URL}/api/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();
  const csrfPayload = (await csrfResponse.json()) as { csrfToken?: string };
  const csrfToken = csrfPayload.csrfToken;

  if (!csrfToken) {
    throw new Error("Credentials login did not receive a csrf token.");
  }

  let callbackResponse: Awaited<ReturnType<typeof request.post>> | null = null;
  let callbackError: unknown = null;

  for (let attempt = 0; attempt < AUTH_CALLBACK_RETRY_LIMIT; attempt += 1) {
    try {
      callbackResponse = await request.post(
        `${TEST_BASE_URL}/api/auth/callback/credentials`,
        {
          form: {
            csrfToken,
            email: credentials.email,
            password: credentials.password,
            callbackUrl: `${TEST_BASE_URL}${nextPath}`,
            json: "true",
          },
        },
      );
      callbackError = null;
      break;
    } catch (error) {
      callbackError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isRetryable = /ECONNRESET|socket hang up|fetch failed|network/i.test(
        message,
      );

      if (!isRetryable || attempt === AUTH_CALLBACK_RETRY_LIMIT - 1) {
        throw error;
      }

      await page.waitForTimeout(250 * (attempt + 1));
    }
  }

  if (!callbackResponse) {
    throw callbackError instanceof Error
      ? callbackError
      : new Error("Credentials callback failed before a response was returned.");
  }

  if (!callbackResponse.ok()) {
    throw new Error(
      `Credentials callback failed with ${callbackResponse.status()} ${callbackResponse.statusText()}.`,
    );
  }

  await expect
    .poll(
      async () => {
        const sessionResponse = await request.get(`${TEST_BASE_URL}/api/auth/session`);
        if (!sessionResponse.ok()) {
          return false;
        }
        const session = (await sessionResponse.json()) as {
          user?: { email?: string | null };
        };
        return session.user?.email === credentials.email;
      },
      { timeout: AUTH_NAVIGATION_TIMEOUT_MS },
    )
    .toBeTruthy();

  await request.get(`${TEST_BASE_URL}/api/auth/viewer`).catch(() => null);

  for (let attempt = 0; attempt < AUTH_GOTO_RETRY_LIMIT; attempt += 1) {
    try {
      await page.goto(nextPath, {
        timeout: AUTH_NAVIGATION_TIMEOUT_MS,
        waitUntil: "commit",
      });
      break;
    } catch (error) {
      if (!isRetryableAuthGotoError(error) || attempt === AUTH_GOTO_RETRY_LIMIT - 1) {
        throw error;
      }

      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  await expect(page).toHaveURL(targetUrlPattern, {
    timeout: AUTH_NAVIGATION_TIMEOUT_MS,
  });
}

export async function loginAsAdmin(page: Page, nextPath: string) {
  await loginWithCredentials(page, ADMIN_CREDENTIALS, nextPath);
}

export async function loginAsCreator(page: Page, nextPath: string) {
  await loginWithCredentials(page, CREATOR_CREDENTIALS, nextPath);
}

export async function loginAsUser(page: Page, nextPath: string) {
  await loginWithCredentials(page, USER_CREDENTIALS, nextPath);
}
