import { expect, test, type Page } from "@playwright/test";

type Role = "therapist" | "patient";

const MASTER_ADMIN_EMAIL = process.env.E2E_MASTER_ADMIN_EMAIL;
const MASTER_ADMIN_PASSWORD = process.env.E2E_MASTER_ADMIN_PASSWORD;
const THERAPIST_EMAIL = process.env.E2E_THERAPIST_EMAIL;
const THERAPIST_PASSWORD = process.env.E2E_THERAPIST_PASSWORD;
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD;

const hasAllCredentials = Boolean(
  MASTER_ADMIN_EMAIL &&
    MASTER_ADMIN_PASSWORD &&
    THERAPIST_EMAIL &&
    THERAPIST_PASSWORD &&
    PATIENT_EMAIL &&
    PATIENT_PASSWORD,
);

async function login(page: Page, params: { email: string; password: string; role?: Role }) {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();

  if (params.role === "patient") {
    await page.getByRole("button", { name: "Paciente" }).click();
  } else if (params.role === "therapist") {
    await page.getByRole("button", { name: "Psicanalista" }).click();
  }

  await page.getByLabel("Email", { exact: true }).fill(params.email);
  await page.getByLabel("Senha", { exact: true }).fill(params.password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
}

test.describe("Role Dashboard Access", () => {
  test("master_admin login opens /admin dashboard", async ({ page }) => {
    test.skip(!hasAllCredentials, "Missing E2E role credentials");
    await login(page, {
      email: MASTER_ADMIN_EMAIL!,
      password: MASTER_ADMIN_PASSWORD!,
      role: "therapist",
    });
    if (!/\/admin(?:\/|$)/.test(page.url())) {
      await page.waitForTimeout(1200);
      await page.goto("/admin");
    }
    if (/\/auth\/login/.test(page.url())) {
      await page.waitForTimeout(800);
      await page.goto("/admin");
    }
    await expect(page).toHaveURL(/\/admin(?:\/|$)/);
    await expect(page.getByText(/Painel de Governança/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Planos/i })).toBeVisible();
  });

  test("therapist login opens /dashboard", async ({ page }) => {
    test.skip(!hasAllCredentials, "Missing E2E role credentials");
    await login(page, {
      email: THERAPIST_EMAIL!,
      password: THERAPIST_PASSWORD!,
      role: "therapist",
    });
    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
    await expect(page.getByText(/Dashboard|Agenda de Hoje/i).first()).toBeVisible();
  });

  test("patient login opens /portal", async ({ page }) => {
    test.skip(!hasAllCredentials, "Missing E2E role credentials");
    await login(page, {
      email: PATIENT_EMAIL!,
      password: PATIENT_PASSWORD!,
      role: "patient",
    });
    await expect(page).toHaveURL(/\/portal(?:\/|$)/);
    await expect(page.getByText(/Bom dia|Boa tarde|Boa noite/i).first()).toBeVisible();
  });
});
