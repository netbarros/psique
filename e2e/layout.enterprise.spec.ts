import { test, expect, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(hasOverflow).toBe(false);
}

test.describe("Enterprise Layout Contract", () => {
  test("login split layout keeps premium proportions", async ({ page, browserName, isMobile }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Acessar conta")).toBeVisible();

    if (browserName === "chromium" && !isMobile) {
      const card = page.locator("section").first();
      await expect(card).toBeVisible();
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();

      if (cardBox) {
        expect(cardBox.width).toBeGreaterThanOrEqual(320);
        expect(cardBox.x).toBeGreaterThan(0);
      }
    }

    await expectNoHorizontalOverflow(page);
  });

  test("public shell has no horizontal clipping", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /A única plataforma que cuida de|Transforme agenda lotada em/i })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("therapist dashboard routes respect layout contract", async ({ page, isMobile }) => {
    const email = process.env.E2E_THERAPIST_EMAIL;
    const password = process.env.E2E_THERAPIST_PASSWORD;
    const coreRoutes = ["/dashboard", "/dashboard/agenda", "/dashboard/configuracoes"] as const;

    if (email && password) {
      await page.goto("/auth/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Senha").fill(password);
      await page.getByRole("button", { name: /Entrar/i }).click();
      await expect(page).toHaveURL(/\/dashboard/);

      const titledRoutes = [
        { path: "/dashboard", title: /Agenda de Hoje|Dashboard/i },
        { path: "/dashboard/agenda", title: /Agenda/i },
        { path: "/dashboard/configuracoes", title: /Configurações/i },
      ] as const;

      for (const route of titledRoutes) {
        await page.goto(route.path);
        await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
        await expect(page.getByText(route.title).first()).toBeVisible();
        await expectNoHorizontalOverflow(page);

        // Ensure main content is not collapsed.
        const contentWidth = await page.locator("main").evaluate((el) => el.getBoundingClientRect().width);
        expect(contentWidth).toBeGreaterThan(isMobile ? 260 : 700);
      }
      return;
    }

    for (const route of coreRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeDefined();
      expect(response?.status()).toBeLessThan(500);
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
