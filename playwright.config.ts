import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;
const PLAYWRIGHT_BROWSER_CHANNEL =
  process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chromium";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 960 },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${BASE_URL}/api/internal/ready`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Default to Playwright's bundled Chromium browser channel instead of
        // the headless shell or installed Chrome stable. This has been the
        // most stable option on this macOS setup. Override only when you want
        // to reproduce browser-specific behavior, e.g.
        // PLAYWRIGHT_BROWSER_CHANNEL=chrome.
        channel: PLAYWRIGHT_BROWSER_CHANNEL as "chromium" | "chrome",
      },
    },
  ],
});
