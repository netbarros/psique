import { expect, test } from "@playwright/test";

/**
 * E2E tests — Navigation & public routes
 */

test.describe("Public Navigation", () => {
  test("root / renders public landing", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /A única plataforma que cuida de|Transforme agenda lotada em/i })
    ).toBeVisible();
  });

  test("auth routes are public", async ({ page }) => {
    const routes = [
      "/auth/login",
      "/auth/register",
      "/auth/register/patient",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    for (const route of routes) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
    }
  });

  test("pricing and secure checkout routes are public", async ({ page }) => {
    const pricing = await page.goto("/pricing");
    expect(pricing?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: /investimento na sua excelência clínica|Escolha o plano para operar sua clínica com previsibilidade/i,
      })
    ).toBeVisible();

    const checkout = await page.goto("/checkout/secure");
    expect(checkout?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /Plano (Clínica Pro|Analista Solo)/i })).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/_mf00r_not_found_probe");
    await expect(page.locator("body")).toContainText(/não encontrado|404|This page could not be found/i);
  });

  test("security headers present", async ({ page }) => {
    const res = await page.goto("/auth/login");
    const headers = res?.headers() ?? {};
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("Protected Navigation", () => {
  test("dashboard and portal routes redirect when unauthenticated", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/dashboard/agenda",
      "/dashboard/pacientes",
      "/dashboard/pacientes/11111111-1111-1111-1111-111111111111",
      "/dashboard/consulta/room-stitch-check",
      "/dashboard/ia",
      "/dashboard/financeiro",
      "/dashboard/telegram",
      "/dashboard/onboarding",
      "/dashboard/configuracoes",
      "/dashboard/configuracoes/perfil",
      "/dashboard/configuracoes/integracoes",
      "/portal",
      "/portal/apoio",
      "/portal/agendar",
      "/portal/sessoes",
      "/portal/chat",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });
});
