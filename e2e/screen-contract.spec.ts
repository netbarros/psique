import { expect, test, type Page } from "@playwright/test";
import { SCREEN_CONTRACTS } from "./contracts/screen-catalog";

function attachClientIssueCollectors(page: Page) {
  const issues: string[] = [];

  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    if (text.includes("Failed to load resource") && text.includes("404")) {
      return;
    }
    issues.push(`console.error: ${text}`);
  });

  return issues;
}

async function expectNoHorizontalOverflow(page: Page) {
  await page.evaluate(async () => {
    if ("fonts" in document) {
      await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });

  const overflowInfo = await page.evaluate(() => {
    const doc = document.documentElement;
    const hasOverflow = doc.scrollWidth > doc.clientWidth + 1;
    if (!hasOverflow) {
      return {
        hasOverflow,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        offender: null as null | string,
      };
    }

    let offender: string | null = null;
    for (const element of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const rect = element.getBoundingClientRect();
      if (rect.right > doc.clientWidth + 1) {
        const name = [element.tagName.toLowerCase(), element.id ? `#${element.id}` : "", element.className ? `.${element.className.toString().trim().split(/\s+/).join(".")}` : ""].join("");
        offender = `${name} right=${Math.round(rect.right)}`;
        break;
      }
    }

    return {
      hasOverflow,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      offender,
    };
  });
  expect(
    overflowInfo.hasOverflow,
    `Horizontal overflow detected: scrollWidth=${overflowInfo.scrollWidth}, clientWidth=${overflowInfo.clientWidth}, offender=${overflowInfo.offender ?? "unknown"}`,
  ).toBe(false);
}

const capturable = SCREEN_CONTRACTS.filter((screen) => screen.capture.capturable);
const publicRoutes = capturable.filter((screen) => !screen.requiresAuth);
const protectedRoutes = capturable.filter((screen) => screen.requiresAuth);

test.describe("Screen Contract S01-S28", () => {
  for (const screen of publicRoutes) {
    test(`${screen.id} public route ${screen.route} renders without critical issues`, async ({ page }) => {
      const issues = attachClientIssueCollectors(page);
      const response = await page.goto(screen.route);

      expect(response?.status()).toBeDefined();
      expect(response?.status()).toBeLessThan(500);
      await expectNoHorizontalOverflow(page);

      if (screen.id === "S28") {
        await expect(page.locator("body")).toContainText(/não encontrado|404|error/i);
      }

      expect(issues, `critical issues for ${screen.id}`).toEqual([]);
    });
  }

  for (const screen of protectedRoutes) {
    test(`${screen.id} protected route ${screen.route} redirects unauthenticated`, async ({ page }) => {
      const issues = attachClientIssueCollectors(page);
      const response = await page.goto(screen.route);

      expect(response?.status()).toBeDefined();
      expect(response?.status()).toBeLessThan(500);
      await expect(page).toHaveURL(/\/auth\/login/);
      await expectNoHorizontalOverflow(page);
      expect(issues, `critical issues for ${screen.id}`).toEqual([]);
    });
  }

  test("S27 loading component exists in project", async () => {
    const loadingContract = SCREEN_CONTRACTS.find((screen) => screen.id === "S27");
    expect(loadingContract).toBeDefined();
    expect(loadingContract?.capture.capturable).toBe(false);
  });
});
