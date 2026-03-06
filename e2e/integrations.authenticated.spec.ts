import { expect, test, type Page } from "@playwright/test";
import {
  cleanupProvisionedTherapist,
  hasProvisioningEnv,
  provisionTherapistForE2E,
} from "./helpers/provision-therapist";

type AuthContext = {
  email: string;
  password: string;
  userId: string;
  therapistId: string;
};

let authContext: AuthContext | null = null;
let provisionError: string | null = null;

async function loginAsTherapist(page: Page, auth: AuthContext) {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();
  await page.getByLabel("Email").fill(auth.email);
  await page.getByRole("textbox", { name: /^Senha$/ }).fill(auth.password);
  await page.locator("button[aria-label='Entrar']").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Authenticated Integrations Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (!hasProvisioningEnv()) {
      provisionError =
        "Supabase env ausente para provisionar usuário E2E autenticado (.env.local com URL/anon/service role).";
      return;
    }

    try {
      authContext = await provisionTherapistForE2E();
    } catch (error) {
      provisionError = error instanceof Error ? error.message : String(error);
    }
  });

  test.afterAll(async () => {
    if (authContext) {
      await cleanupProvisionedTherapist(authContext);
    }
  });

  test("master autenticado acessa integrações e navega para seções de configuração", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento não disponível");
    await loginAsTherapist(page, authContext!);

    await page.goto("/dashboard/configuracoes/integracoes");
    await expect(page).toHaveURL(/\/dashboard\/configuracoes\/integracoes/);
    await expect(page.getByRole("heading", { name: /Integrações/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "OpenRouter AI" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Telegram Bot" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stripe Connect" })).toBeVisible();
    await expect(page.locator('a[href="#integracao-stripe"]')).toBeVisible();

    await page.locator('a[href="#integracao-openrouter"]').click();
    await expect(page).toHaveURL(/#integracao-openrouter$/);
    await expect(page.locator("#integracao-openrouter")).toBeVisible();

    await page.locator('a[href="#integracao-stripe"]').click();
    await expect(page).toHaveURL(/#integracao-stripe$/);
    await expect(page.locator("#integracao-stripe")).toBeVisible();
  });

  test("master autenticado visualiza integrações em modo somente leitura", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento não disponível");
    await loginAsTherapist(page, authContext!);
    await page.goto("/dashboard/configuracoes/integracoes");

    await expect(page.getByText(/Escrita em integrações neste painel foi desativada por contrato/i)).toBeVisible();
    await expect(page.getByPlaceholder("Gerenciado pelo master_admin")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /Salvar Integrações/i })).toHaveCount(0);
  });

  test("master autenticado vê detalhes de conexão com campos bloqueados", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento não disponível");
    await loginAsTherapist(page, authContext!);
    await page.goto("/dashboard/configuracoes/integracoes");

    await expect(page.locator("#integracao-openrouter input[disabled]")).toBeVisible();
    await expect(page.locator("#integracao-telegram input[disabled]")).toBeVisible();
    await expect(page.locator("#integracao-stripe input[disabled]")).toBeVisible();
  });
});
