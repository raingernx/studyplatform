import { expect, test } from "@playwright/test";
import { PrismaClient, ResourceType } from "@prisma/client";
import { loginAsCreator } from "./helpers/auth";

test.describe.configure({ timeout: 180_000 });

const ROUTE_FAMILY_PREFIX = "Dashboard V2 route family probe";

async function cleanupRouteFamilyResources() {
  const prisma = new PrismaClient();
  try {
    await prisma.resource.deleteMany({
      where: {
        title: {
          startsWith: ROUTE_FAMILY_PREFIX,
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function seedResourceForOwner(options: {
  ownerEmail: string;
  label: string;
}) {
  const prisma = new PrismaClient();
  try {
    const owner = await prisma.user.findUnique({
      where: { email: options.ownerEmail },
      select: { id: true },
    });

    if (!owner) {
      throw new Error(`Missing auth fixture for ${options.ownerEmail}.`);
    }

    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const title = `${ROUTE_FAMILY_PREFIX} ${options.label}`;
    const slug = `dashboard-v2-route-family-${options.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${suffix}`;

    return await prisma.resource.create({
      data: {
        title,
        slug,
        description:
          "Seeded dashboard-v2 creator resource used for route-family auth and entry/exit verification.",
        type: ResourceType.PDF,
        status: "DRAFT",
        isFree: true,
        price: 0,
        authorId: owner.id,
      },
      select: { id: true, title: true },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test("dashboard-v2 creator editor routes redirect unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard-v2/creator/resources/new", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(
    /\/auth\/login\?next=%2Fdashboard-v2%2Fcreator%2Fresources%2Fnew$/,
  );

  await page.goto("/dashboard-v2/creator/resources/route-family-probe-edit", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(
    /\/auth\/login\?next=%2Fdashboard-v2%2Fcreator%2Fresources%2Froute-family-probe-edit$/,
  );
});

test("dashboard-v2 creator editor route family keeps inventory, new, and edit flows inside dashboard-v2", async ({
  page,
}) => {
  await cleanupRouteFamilyResources();
  const owned = await seedResourceForOwner({
    ownerEmail: "demo.instructor@krukraft.dev",
    label: "entry-exit",
  });

  try {
    await loginAsCreator(page, "/dashboard-v2/creator/resources");

    await expect(
      page.getByRole("heading", { name: /^Creator resources$/i }),
    ).toBeVisible();

    const newResourceLink = page
      .locator('a[href="/dashboard-v2/creator/resources/new"]')
      .first();
    await expect(newResourceLink).toBeVisible();
    await expect(newResourceLink).toHaveAttribute(
      "href",
      "/dashboard-v2/creator/resources/new",
    );
    await page.goto("/dashboard-v2/creator/resources/new", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/dashboard-v2\/creator\/resources\/new$/);
    await expect(
      page.getByRole("heading", { name: /^New resource$/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(page).toHaveURL(/\/dashboard-v2\/creator\/resources$/);

    const ownedRow = page.locator("tbody tr", {
      has: page.getByRole("link", { name: owned.title, exact: true }),
    });
    await expect(ownedRow).toBeVisible();
    const editLink = ownedRow.getByRole("link", { name: /^Edit$/i });
    await expect(editLink).toHaveAttribute(
      "href",
      `/dashboard-v2/creator/resources/${owned.id}`,
    );
    await page.goto(`/dashboard-v2/creator/resources/${owned.id}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(
      new RegExp(`/dashboard-v2/creator/resources/${owned.id}$`),
    );
    await expect(
      page.getByRole("heading", { name: /^Edit resource$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^Back to resources$/i }).first(),
    ).toBeVisible();

    await page.getByRole("link", { name: /^Back to resources$/i }).click();
    await expect(page).toHaveURL(/\/dashboard-v2\/creator\/resources$/);
  } finally {
    await cleanupRouteFamilyResources();
  }
});

test("dashboard-v2 creator edit route shows forbidden state for non-owned resources", async ({
  page,
}) => {
  await cleanupRouteFamilyResources();
  const notOwned = await seedResourceForOwner({
    ownerEmail: "demo.user@krukraft.dev",
    label: "forbidden",
  });

  try {
    await loginAsCreator(page, `/dashboard-v2/creator/resources/${notOwned.id}`);

    await expect(
      page.getByRole("heading", { name: /^You cannot edit this resource$/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/This resource is not owned by the current creator account/i).first(),
    ).toBeVisible();

    await page.getByRole("link", { name: /^Open resource inventory$/i }).click();
    await expect(page).toHaveURL(/\/dashboard-v2\/creator\/resources$/);
  } finally {
    await cleanupRouteFamilyResources();
  }
});

test("dashboard-v2 creator edit route shows not-found state for stale resource ids", async ({
  page,
}) => {
  await cleanupRouteFamilyResources();

  await loginAsCreator(page, "/dashboard-v2/creator/resources/missing-route-family-resource");

  await expect(
    page.getByRole("heading", { name: /^Resource not found$/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/It may have been removed or the link is outdated/i).first(),
  ).toBeVisible();

  await page.getByRole("link", { name: /^Open resource inventory$/i }).click();
  await expect(page).toHaveURL(/\/dashboard-v2\/creator\/resources$/);
});
