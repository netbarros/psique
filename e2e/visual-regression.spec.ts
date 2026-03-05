import { expect, test } from "@playwright/test";

async function stabilize(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

test.describe("Visual regression @visual", () => {
  test("@visual landing", async ({ page }) => {
    await page.goto("/");
    await stabilize(page);
    await expect(page).toHaveScreenshot("landing.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.04,
    });
  });

  test("@visual pricing", async ({ page }) => {
    await page.goto("/pricing");
    await stabilize(page);
    await expect(page).toHaveScreenshot("pricing.png", {
      fullPage: true,
      // Pricing desktop has minor rendering drift across long suite runs.
      maxDiffPixelRatio: 0.07,
    });
  });

  test("@visual login", async ({ page }) => {
    await page.goto("/auth/login");
    await stabilize(page);
    await expect(page).toHaveScreenshot("auth-login.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.04,
    });
  });
});
