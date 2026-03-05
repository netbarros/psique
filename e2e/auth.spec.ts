import { expect, test } from "@playwright/test";

/**
 * E2E tests — Authentication routes and basic flows
 */

test.describe("Auth — Public routes", () => {
  test("login page renders with role toggle", async ({ page }) => {
    const res = await page.goto("/auth/login");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Psicanalista/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Paciente/i })).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
  });

  test("therapist register page renders CRP field", async ({ page }) => {
    const res = await page.goto("/auth/register");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /Criar Conta de Terapeuta/i })).toBeVisible();
    await expect(page.getByText(/CRP/i).first()).toBeVisible();
  });

  test("patient register page renders phone field", async ({ page }) => {
    const res = await page.goto("/auth/register/patient");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /Criar Conta de Paciente/i })).toBeVisible();
    await expect(page.getByText(/Telefone/i).first()).toBeVisible();
  });

  test("forgot-password page renders email action", async ({ page }) => {
    const res = await page.goto("/auth/forgot-password");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /Recuperar Acesso/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Enviar link/i })).toBeVisible();
  });

  test("reset-password page renders new password form", async ({ page }) => {
    const res = await page.goto("/auth/reset-password");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /Redefinir Senha/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Atualizar senha/i })).toBeVisible();
  });
});

test.describe("Auth — Protected redirects", () => {
  test("unauthenticated /dashboard redirects to /auth/login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated config subroutes redirect to /auth/login", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard/configuracoes/perfil",
      "/dashboard/configuracoes/integracoes",
      "/portal",
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
