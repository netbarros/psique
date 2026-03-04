import { test, expect } from "@playwright/test";

/**
 * E2E tests — Navigation & public routes
 */

test.describe("Public Navigation", () => {
  test("root / redirects to /auth/login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const res = await page.goto("/rota-que-nao-existe-xyz");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/não encontrado|404/i)).toBeVisible();
  });

  test("login page is public (200)", async ({ page }) => {
    const res = await page.goto("/auth/login");
    expect(res?.status()).toBe(200);
  });

  test("security headers present", async ({ page }) => {
    const res = await page.goto("/auth/login");
    const headers = res?.headers() ?? {};
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("Dashboard (authenticated-only)", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    const dashboardRoutes = [
      "/dashboard",
      "/dashboard/pacientes",
      "/dashboard/ia",
      "/dashboard/financeiro",
      "/dashboard/configuracoes",
    ];
    for (const route of dashboardRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login/, {
        timeout: 5000,
      });
    }
  });

  test("patient portal redirects when unauthenticated", async ({ page }) => {
    await page.goto("/portal");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
