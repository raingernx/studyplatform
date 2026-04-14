import { expect, test } from "@playwright/test";
import { PrismaClient, ResourceType } from "@prisma/client";
import { loginAsCreator } from "./helpers/auth";

test.describe.configure({ timeout: 180_000 });

const HARDENING_PREFIX = "Dashboard V2 hardening probe";
const EDIT_PREVIEW_URLS = [
  "https://example.com/preview-cover.webp",
  "https://example.com/preview-second.webp",
  "https://example.com/preview-third.webp",
];

async function waitForEditorHydration(page: Parameters<typeof loginAsCreator>[0]) {
  await page.waitForTimeout(3000);
}

async function cleanupHardeningResources() {
  const prisma = new PrismaClient();
  try {
    await prisma.resource.deleteMany({
      where: {
        title: {
          startsWith: HARDENING_PREFIX,
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function seedCreatorResource(options: {
  label: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  previewUrls?: string[];
}) {
  const prisma = new PrismaClient();
  try {
    const creator = await prisma.user.findUnique({
      where: { email: "demo.instructor@krukraft.dev" },
      select: { id: true },
    });

    if (!creator) {
      throw new Error("Missing creator auth fixture for hardening probe.");
    }

    const slugSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const title = `${HARDENING_PREFIX} ${options.label}`;
    const slug = `dashboard-v2-hardening-${options.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${slugSuffix}`;

    const resource = await prisma.resource.create({
      data: {
        title,
        slug,
        description:
          "This seeded dashboard-v2 editor resource is used to harden edit-route states and verify creator flows.",
        type: ResourceType.PDF,
        status: "DRAFT",
        isFree: true,
        price: 0,
        authorId: creator.id,
        fileKey: options.fileKey ?? null,
        fileName: options.fileName ?? null,
        fileSize: options.fileSize ?? null,
        mimeType: "application/pdf",
        fileUrl: options.fileUrl ?? null,
        previewUrl: options.previewUrls?.[0] ?? null,
        previews:
          options.previewUrls && options.previewUrls.length > 0
            ? {
                create: options.previewUrls.map((imageUrl, order) => ({
                  imageUrl,
                  order,
                })),
              }
            : undefined,
      },
      select: { id: true, slug: true },
    });

    return resource;
  } finally {
    await prisma.$disconnect();
  }
}

async function readResourceState(resourceId: string) {
  const prisma = new PrismaClient();
  try {
    return await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        fileKey: true,
        fileUrl: true,
        previews: {
          orderBy: { order: "asc" },
          select: { imageUrl: true },
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test("dashboard-v2 creator create editor keeps invalid external file URLs in warning state", async ({
  page,
}) => {
  await cleanupHardeningResources();

  await loginAsCreator(page, "/dashboard-v2/creator/resources/new");
  await waitForEditorHydration(page);

  await expect(page.getByRole("heading", { name: /^New resource$/i })).toBeVisible();

  const deliverySection = page.locator("section").filter({
    has: page.getByRole("heading", { name: /Delivery and previews/i }),
  });

  await deliverySection.getByRole("button", { name: /^Use link$/i }).click();

  const input = deliverySection.getByPlaceholder(/Paste an external file URL, e\.g\./i);
  await input.fill("notaurl");
  await input.press("Enter");

  await expect(
    deliverySection.getByText(/This URL can't be used yet/i),
  ).toBeVisible();
  await expect(input).toHaveValue("notaurl");
  await expect(deliverySection.getByRole("button", { name: /Open link/i })).toHaveCount(0);
});

test("dashboard-v2 creator edit editor can switch from uploaded file to external URL", async ({
  page,
}) => {
  await cleanupHardeningResources();
  const seeded = await seedCreatorResource({
    label: "switch-source",
    fileKey: "hardening-probe-uploaded.pdf",
    fileName: "hardening-probe-uploaded.pdf",
    fileSize: 2048,
  });

  try {
    await loginAsCreator(page, `/dashboard-v2/creator/resources/${seeded.id}`);
    await waitForEditorHydration(page);

    await expect(page.getByRole("heading", { name: /^Edit resource$/i })).toBeVisible();

    const deliverySection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Delivery and previews/i }),
    });

    await deliverySection.getByRole("button", { name: /^Use link$/i }).click();
    await expect(
      deliverySection.getByText(/Uploaded file is still active/i),
    ).toBeVisible();

    const removeResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/creator/resources/${seeded.id}/file`) &&
        response.request().method() === "DELETE"
      );
    });

    await deliverySection.getByRole("button", { name: /Remove uploaded file/i }).click();
    const removeResponse = await removeResponsePromise;
    expect(removeResponse.ok()).toBeTruthy();

    const input = deliverySection.getByPlaceholder(/Paste an external file URL, e\.g\./i);
    await expect(input).toBeVisible();

    const patchResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/creator/resources/${seeded.id}`) &&
        response.request().method() === "PATCH"
      );
    });

    await input.fill("https://example.com/worksheet.pdf");
    await input.press("Enter");

    const patchResponse = await patchResponsePromise;
    expect(patchResponse.ok()).toBeTruthy();

    await expect(deliverySection.getByText("example.com")).toBeVisible();
    await expect(deliverySection.getByRole("link", { name: /Open link/i })).toBeVisible();

    const resource = await readResourceState(seeded.id);
    expect(resource?.fileKey).toBeNull();
    expect(resource?.fileUrl).toBe("https://example.com/worksheet.pdf");
  } finally {
    await cleanupHardeningResources();
  }
});

test("dashboard-v2 creator edit editor persists cover reorder and preview removal", async ({
  page,
}) => {
  await cleanupHardeningResources();
  const seeded = await seedCreatorResource({
    label: "preview-persist",
    previewUrls: EDIT_PREVIEW_URLS,
  });

  try {
    await loginAsCreator(page, `/dashboard-v2/creator/resources/${seeded.id}`);
    await waitForEditorHydration(page);

    await expect(page.getByRole("heading", { name: /^Edit resource$/i })).toBeVisible();

    const deliverySection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Delivery and previews/i }),
    });

    const setCoverResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/creator/resources/${seeded.id}`) &&
        response.request().method() === "PATCH"
      );
    });

    await deliverySection.getByRole("button", { name: /Set as cover/i }).first().click();
    const setCoverResponse = await setCoverResponsePromise;
    expect(setCoverResponse.ok()).toBeTruthy();

    let resource = await readResourceState(seeded.id);
    expect(resource?.previews.map((preview) => preview.imageUrl)).toEqual([
      EDIT_PREVIEW_URLS[1],
      EDIT_PREVIEW_URLS[0],
      EDIT_PREVIEW_URLS[2],
    ]);

    const removeResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/creator/resources/${seeded.id}`) &&
        response.request().method() === "PATCH"
      );
    });

    await deliverySection.getByRole("button", { name: /^Remove image$/i }).nth(2).click();
    const removeResponse = await removeResponsePromise;
    expect(removeResponse.ok()).toBeTruthy();

    resource = await readResourceState(seeded.id);
    expect(resource?.previews.map((preview) => preview.imageUrl)).toEqual([
      EDIT_PREVIEW_URLS[1],
      EDIT_PREVIEW_URLS[0],
    ]);
  } finally {
    await cleanupHardeningResources();
  }
});
