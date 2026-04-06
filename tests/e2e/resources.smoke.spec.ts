import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";
import { collectRuntimeErrors } from "./helpers/browser";
import { loginAsCreator } from "./helpers/auth";
import { expectImageLoaded } from "./helpers/images";

test("resources homepage renders hero media without runtime errors", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/resources");

  await expect(page).toHaveURL(/\/resources$/);
  await expect(
    page.getByRole("link", { name: /Home/i }).first(),
  ).toBeVisible();
  await expect(
    page.locator('[data-hero-surface="discover"]').first(),
  ).toBeVisible();
  await expect(page.getByText("Start with a clearer path").first()).toBeVisible();

  const heroArtwork = page.locator('[data-hero-surface="discover"] img').last();
  await expectImageLoaded(heroArtwork);

  await expectNoAxeViolations(page, { include: ["main"] });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("featured picks collection opens the featured listing filter", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/resources");

  const collectionsSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Collections to explore" }) })
    .first();
  await expect(collectionsSection).toBeVisible();

  const featuredCollectionCard = collectionsSection
    .locator("a")
    .filter({ has: page.getByText("Featured picks") })
    .first();
  await expect(featuredCollectionCard).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/resources\?category=all&featured=true|\/resources\?featured=true&category=all/),
    featuredCollectionCard.click(),
  ]);

  await expect(page).toHaveURL(/featured=true/);
  await expect(page.locator("main article").first()).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("public recommended sort is labeled as top picks", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/resources?category=language&sort=recommended");

  await expect(page).toHaveURL(/\/resources\?.*category=language.*sort=recommended|\/resources\?.*sort=recommended.*category=language/);
  await expect(page.getByText("Sorted by Top picks")).toBeVisible();
  await expect(page.getByText("Sorted by Recommended")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("navigating from a scrolled discover entry into detail resets the viewport to top", async ({
  page,
}) => {
  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);

  await page.goto("/resources");
  await expect(page.getByText("Start with a clearer path").first()).toBeVisible();

  await page.evaluate(() => {
    window.scrollTo({ top: 2200, behavior: "auto" });
  });

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(1200);

  const featuredCollectionCard = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Collections to explore" }) })
    .first()
    .locator("a")
    .filter({ has: page.getByText("Featured picks") })
    .first();

  await expect(featuredCollectionCard).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/resources\?category=all&featured=true|\/resources\?featured=true&category=all/),
    featuredCollectionCard.click(),
  ]);

  await expect(page.locator("main article").first()).toBeVisible();

  const resourceLinks = page.locator('main a[href^="/resources/"]:not([href*="?"])');
  const linkCount = await resourceLinks.count();
  expect(linkCount).toBeGreaterThan(0);
  const targetLink = resourceLinks.nth(Math.min(linkCount - 1, 4));
  await targetLink.scrollIntoViewIfNeeded();

  await page.evaluate(() => {
    const seenScopes: string[] = [];

    const recordScopes = () => {
      if (document.querySelector('[data-loading-scope="resources-browse"]')) {
        seenScopes.push("resources-browse");
      }
      if (document.querySelector('[data-loading-scope="resource-detail"]')) {
        seenScopes.push("resource-detail");
      }
    };

    recordScopes();

    const observer = new MutationObserver(() => {
      recordScopes();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-loading-scope"],
    });

    (window as Window & {
      __resourcesLoadingScopeObserver?: MutationObserver;
      __resourcesSeenLoadingScopes?: string[];
    }).__resourcesLoadingScopeObserver = observer;
    (window as Window & {
      __resourcesSeenLoadingScopes?: string[];
    }).__resourcesSeenLoadingScopes = seenScopes;
  });

  const targetHref = await targetLink.getAttribute("href");
  expect(targetHref).toBeTruthy();

  await targetLink.click();

  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 3_000 })
    .toBeLessThan(80);

  await expect(page).toHaveURL(new RegExp(`${targetHref?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await expect(page.locator("main h1").first()).toBeVisible();

  const seenScopes = await page.evaluate(() => {
    const windowWithScopes = window as Window & {
      __resourcesLoadingScopeObserver?: MutationObserver;
      __resourcesSeenLoadingScopes?: string[];
    };

    windowWithScopes.__resourcesLoadingScopeObserver?.disconnect();
    return windowWithScopes.__resourcesSeenLoadingScopes ?? [];
  });

  expect(seenScopes).not.toContain("resources-browse");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("creator discover shell does not expose misleading personalized CTAs", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await loginAsCreator(page, "/resources");

  const { pageErrors, consoleErrors } = collectRuntimeErrors(page);
  await expect(page).toHaveURL(/\/resources$/);

  async function fetchDiscoverState() {
    return page.evaluate(async () => {
      const response = await fetch("/api/resources/viewer-state?scope=discover", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`discover viewer-state failed: ${response.status}`);
      }

      const json = (await response.json()) as {
        data?: {
          recommendedForYou?: Array<{ id: string }>;
          recommendedForLevel?: Array<{ id: string }>;
          becauseYouStudied?: Array<{ id: string }>;
          recentStudyTitle?: string | null;
          recentCategorySlug?: string | null;
        } | null;
      };

      return json.data ?? null;
    });
  }

  const discover = await fetchDiscoverState();

  if (!discover) {
    await expect(
      page.getByRole("heading", { name: "Recommended for you" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Recommended for your level" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /Because you studied / }),
    ).toHaveCount(0);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    return;
  }

  if ((discover.recommendedForYou?.length ?? 0) > 0) {
    const recommendedSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Recommended for you" }) })
      .first();

    await expect(recommendedSection).toBeVisible();
    await expect(
      recommendedSection.getByRole("link", { name: /View all/i }),
    ).toHaveCount(0);
  }

  if ((discover.recommendedForLevel?.length ?? 0) > 0) {
    const levelSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Recommended for your level" }) })
      .first();

    await expect(levelSection).toBeVisible();
    await expect(
      levelSection.getByRole("link", { name: /View all/i }),
    ).toHaveCount(0);
  }

  if (
    (discover.becauseYouStudied?.length ?? 0) > 0 &&
    discover.recentStudyTitle &&
    discover.recentCategorySlug
  ) {
    const becauseSection = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: `Because you studied ${discover.recentStudyTitle}`,
        }),
      })
      .first();

    await expect(becauseSection).toBeVisible();

    await Promise.all([
      page.waitForURL(
        new RegExp(
          `/resources\\?(?:.*category=${discover.recentCategorySlug}.*sort=newest|.*sort=newest.*category=${discover.recentCategorySlug}).*`,
        ),
      ),
      becauseSection.getByRole("link", { name: /View all/i }).click(),
    ]);

    await expect(page).toHaveURL(new RegExp(`category=${discover.recentCategorySlug}`));
    await expect(page).toHaveURL(/sort=newest/);
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
