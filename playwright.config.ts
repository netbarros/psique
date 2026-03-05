import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for PSIQUE E2E tests.
 * Run: npx playwright test
 * UI mode: npx playwright test --ui
 */
const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? "45999";
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PLAYWRIGHT_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: "on",
    screenshot: "on",
    video: "on",
  },
  webServer: {
    command: `npm run start -- -p ${PLAYWRIGHT_PORT} -H 127.0.0.1`,
    url: `${PLAYWRIGHT_BASE_URL}/auth/login`,
    timeout: 120 * 1000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "desktop-1440x900",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablet-768x1024",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-390x844",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
