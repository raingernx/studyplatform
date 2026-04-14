import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAsCreator } from "./helpers/auth";

test.describe.configure({ timeout: 180_000 });

const PROBE_TITLE = "Dashboard V2 publish probe";

async function cleanupProbeResources() {
  const prisma = new PrismaClient();
  try {
    await prisma.resource.deleteMany({
      where: {
        title: PROBE_TITLE,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

function createTinyPdfUpload() {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 35 >>
stream
BT
/F1 12 Tf
72 120 Td
(Krukraft probe) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000208 00000 n 
trailer
<< /Root 1 0 R /Size 5 >>
startxref
292
%%EOF`;

  return {
    name: "dashboard-v2-publish-probe.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(pdf, "utf8"),
  };
}

test("dashboard-v2 creator create editor uploads a file and opens publish success modal", async ({
  page,
}) => {
  await cleanupProbeResources();

  try {
    await loginAsCreator(page, "/dashboard-v2/creator/resources/new");

    await expect(
      page.getByRole("heading", { name: /^New resource$/i }),
    ).toBeVisible();

    // The create editor still needs a short hydration settle before local form
    // state and file-upload handlers behave deterministically in browser probes.
    await page.waitForTimeout(5_000);

    await page.locator('input[name="title"]').fill(PROBE_TITLE);
    await page
      .locator('textarea[name="description"]')
      .fill("This resource is created by the dashboard-v2 publish probe to verify upload and publish happy paths.");

    const deliverySection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Delivery and previews/i }),
    });
    const fileInputs = deliverySection.locator('input[type="file"]');

    const draftResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/creator/resources/draft") &&
        response.request().method() === "POST"
      );
    });
    const uploadResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/creator/resources/upload") &&
        response.request().method() === "POST"
      );
    });

    await fileInputs.last().setInputFiles(createTinyPdfUpload());
    await expect(page.getByText("dashboard-v2-publish-probe.pdf")).toBeVisible();

    await deliverySection
      .getByRole("button", { name: "อัปโหลดไฟล์", exact: true })
      .click();

    const draftResponse = await draftResponsePromise;
    const uploadResponse = await uploadResponsePromise;
    expect(draftResponse.ok()).toBeTruthy();
    expect(uploadResponse.ok()).toBeTruthy();

    await expect(
      page.getByText(/อัปโหลดไฟล์เรียบร้อยแล้ว|File uploaded successfully/i),
    ).toBeVisible();

    const publishButton = page.getByRole("button", { name: /^Publish$/i });
    await expect(publishButton).toBeEnabled();

    const publishResponsePromise = page.waitForResponse((response) => {
      const url = response.url();
      const method = response.request().method();
      return (
        method === "PATCH" &&
        /\/api\/creator\/resources\/[^/]+$/.test(url)
      );
    });

    await publishButton.click();

    const publishResponse = await publishResponsePromise;
    expect(publishResponse.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: /Your resource is live/i }),
    ).toBeVisible();
  } finally {
    await cleanupProbeResources();
  }
});

test("dashboard-v2 creator create editor can upload before metadata without validation overlay", async ({
  page,
}) => {
  await cleanupProbeResources();

  try {
    await loginAsCreator(page, "/dashboard-v2/creator/resources/new");

    await expect(
      page.getByRole("heading", { name: /^New resource$/i }),
    ).toBeVisible();

    await page.waitForTimeout(5_000);

    const deliverySection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Delivery and previews/i }),
    });
    const fileInputs = deliverySection.locator('input[type="file"]');

    const draftResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/creator/resources/draft") &&
        response.request().method() === "POST"
      );
    });
    const uploadResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/creator/resources/upload") &&
        response.request().method() === "POST"
      );
    });

    await fileInputs.last().setInputFiles(createTinyPdfUpload());
    await deliverySection
      .getByRole("button", { name: "อัปโหลดไฟล์", exact: true })
      .click();

    const draftResponse = await draftResponsePromise;
    const uploadResponse = await uploadResponsePromise;
    expect(draftResponse.ok()).toBeTruthy();
    expect(uploadResponse.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: /^New resource$/i }),
    ).toBeVisible();
    await expect(page.getByText("Validation failed.")).toHaveCount(0);
  } finally {
    await cleanupProbeResources();
  }
});
