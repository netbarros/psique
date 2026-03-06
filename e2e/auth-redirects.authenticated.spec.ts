import { expect, test, type Page } from "@playwright/test";

type LoginRole = "therapist" | "patient";

const MASTER_ADMIN_EMAIL = process.env.E2E_MASTER_ADMIN_EMAIL ?? "e2e.master_admin@psique.local";
const MASTER_ADMIN_PASSWORD = process.env.E2E_MASTER_ADMIN_PASSWORD ?? "E2E_Psique_123!";
const THERAPIST_EMAIL = process.env.E2E_THERAPIST_EMAIL ?? "e2e.therapist@psique.local";
const THERAPIST_PASSWORD = process.env.E2E_THERAPIST_PASSWORD ?? "E2E_Psique_123!";
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "e2e.patient@psique.local";
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD ?? "E2E_Psique_123!";

async function login(page: Page, params: { email: string; password: string; role?: LoginRole }) {
  await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();

  if (params.role === "patient") {
    await page.getByRole("button", { name: "Paciente" }).click();
  } else if (params.role === "therapist") {
    await page.getByRole("button", { name: "Psicanalista" }).click();
  }

  await page.getByLabel("Email", { exact: true }).fill(params.email);
  await page.getByRole("textbox", { name: /^Senha$/ }).fill(params.password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
}

test.describe("Auth Redirect Matrix (next + role)", () => {
  test("preserva next permitido para master_admin", async ({ page }) => {
    await page.goto("/admin/integrations");
    await expect(page).toHaveURL(/\/auth\/login\?next=/);

    await login(page, {
      email: MASTER_ADMIN_EMAIL,
      password: MASTER_ADMIN_PASSWORD,
      role: "therapist",
    });

    await expect(page).toHaveURL(/\/admin(?:\/integrations)?(?:\?|$)/);
    await expect(page.getByText(/Painel de Governança|Integrações Globais/i).first()).toBeVisible();
  });

  test("bloqueia next de admin para paciente e cai no destino permitido", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login\?next=/);

    await login(page, {
      email: PATIENT_EMAIL,
      password: PATIENT_PASSWORD,
      role: "patient",
    });

    await expect(page).toHaveURL(/\/portal(?:\?|$)/);
    await expect(page.getByText(/Bom dia|Boa tarde|Boa noite/i).first()).toBeVisible();
  });

  test("bloqueia next de portal para terapeuta e cai no dashboard", async ({ page }) => {
    await page.goto("/portal/agendar");
    await expect(page).toHaveURL(/\/auth\/login\?next=/);

    await login(page, {
      email: THERAPIST_EMAIL,
      password: THERAPIST_PASSWORD,
      role: "therapist",
    });

    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByRole("main")).toBeVisible();
  });
});
