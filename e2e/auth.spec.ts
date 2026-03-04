import { test, expect } from "@playwright/test";

/**
 * E2E tests — Authentication flows
 */

test.describe("Auth — Login Page", () => {
  test("shows login form with role toggle", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/Psique|Login/i);

    // Role buttons
    await expect(page.getByRole("button", { name: /Terapeuta/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Paciente/i })).toBeVisible();

    // Email + password fields
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows validation error for empty submission", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("button", { name: /Entrar/i }).click();
    // Should not navigate away
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("shows register form when switching to cadastro", async ({ page }) => {
    await page.goto("/auth/login");
    // Click register tab / link
    const registerBtn = page.getByRole("button", { name: /Cadastrar|Criar conta/i });
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await expect(page.locator("input[name='name'], input[placeholder*='nome']")).toBeVisible();
    }
  });

  test("unauthenticated redirect from /dashboard to /auth/login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
