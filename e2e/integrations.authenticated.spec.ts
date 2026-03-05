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
  await page.getByLabel("Senha").fill(auth.password);
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
    await expect(page.getByRole("button", { name: /Conectar Stripe Express/i })).toBeVisible();

    await page.locator('a[href="#integracao-openrouter"]').click();
    await expect(page).toHaveURL(/#integracao-openrouter$/);
    await expect(page.locator("#integracao-openrouter")).toBeVisible();

    await page.locator('a[href="#integracao-stripe"]').click();
    await expect(page).toHaveURL(/#integracao-stripe$/);
    await expect(page.locator("#integracao-stripe")).toBeVisible();
  });

  test("master autenticado salva integrações via API com sucesso", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento não disponível");
    await loginAsTherapist(page, authContext!);
    await page.goto("/dashboard/configuracoes/integracoes");

    let patchPayload: Record<string, unknown> | null = null;
    await page.route("**/api/settings/integrations", async (route, request) => {
      patchPayload = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            aiModel: "anthropic/claude-3.5-sonnet",
            openRouterConnected: true,
            telegramConnected: false,
            stripeConnected: false,
            stripeAccountId: null,
          },
        }),
      });
    });

    await page
      .getByPlaceholder("Opcional (usa a chave padrão da plataforma Psique)")
      .fill("sk-or-v1-e2e-master-key");
    await page.getByRole("button", { name: /Salvar Integrações/i }).click();

    await expect(
      page.getByText("Integrações validadas e atualizadas com sucesso!"),
    ).toBeVisible();
    expect(patchPayload).not.toBeNull();
    expect((patchPayload as unknown as Record<string, unknown>)?.openRouterKey).toBe("sk-or-v1-e2e-master-key");
  });

  test("master autenticado inicia Stripe Connect e recebe redirect para onboarding", async ({
    page,
  }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento não disponível");
    await loginAsTherapist(page, authContext!);
    await page.goto("/dashboard/configuracoes/integracoes");

    await page.route("**/api/settings/integrations/stripe/connect", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            mode: "onboarding",
            accountId: "acct_1E2EFlowMaster",
            url: "/dashboard/configuracoes/integracoes?stripe=success&e2e=1",
          },
        }),
      });
    });

    await page.getByRole("button", { name: /Conectar Stripe Express/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/configuracoes\/integracoes\?stripe=success&e2e=1/);
  });
});
