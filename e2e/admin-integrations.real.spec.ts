import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  ensureMasterAdminForE2E,
  hasMasterAdminProvisioningEnv,
  type MasterAdminAuth,
} from "./helpers/provision-master-admin";

const REQUIRED_PROVIDERS = [
  "openrouter",
  "telegram",
  "stripe",
  "asaas",
  "daily",
  "resend",
  "upstash",
  "sentry",
  "demo",
] as const;

function readEnvLocal(key: string): string | undefined {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return undefined;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep <= 0) continue;
    const envKey = trimmed.slice(0, sep).trim();
    if (envKey !== key) continue;
    let value = trimmed.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return undefined;
}

function resolveEnv(key: string): string | undefined {
  return process.env[key] ?? readEnvLocal(key);
}

function isLikelyTelegramBotToken(value: string): boolean {
  return /^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

function isLikelyStripeSecretKey(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().includes("placeholder")) return false;
  return /^sk_(test|live)_[A-Za-z0-9]{24,}$/.test(trimmed);
}

function isLikelyAsaasApiKey(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().includes("placeholder")) return false;
  return trimmed.length >= 24 && !/\s/.test(trimmed);
}

let authContext: MasterAdminAuth | null = null;
let provisionError: string | null = null;

async function loginAsMasterAdmin(page: Page, auth: MasterAdminAuth) {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();
  await page.getByRole("button", { name: "Psicanalista" }).click();
  await page.getByLabel("Email", { exact: true }).fill(auth.email);
  await page.getByLabel("Senha", { exact: true }).fill(auth.password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await Promise.race([
    page.waitForURL(/\/admin(?:\/|$)/, { timeout: 12_000 }),
    page.waitForURL(/\/dashboard(?:\/|$)/, { timeout: 12_000 }),
    page.waitForURL(/\/portal(?:\/|$)/, { timeout: 12_000 }),
    page.waitForSelector("text=Email ou senha incorretos", { timeout: 12_000 }),
  ]).catch(() => undefined);

  if (/\/auth\/login/.test(page.url())) {
    const authError = await page
      .locator("text=Email ou senha incorretos")
      .first()
      .isVisible()
      .catch(() => false);
    if (authError) {
      throw new Error("Falha de autenticação para master_admin E2E.");
    }
  }

  if (!/\/admin(?:\/|$)/.test(page.url())) {
    await page.goto("/admin/integrations");
  }
}

test.describe("Admin Integrations Real Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (!hasMasterAdminProvisioningEnv()) {
      provisionError =
        "Supabase env ausente para provisionamento E2E de master_admin (.env.local com URL + service role).";
      return;
    }

    try {
      authContext = await ensureMasterAdminForE2E();
    } catch (error) {
      provisionError = error instanceof Error ? error.message : String(error);
    }
  });

  test("abre /admin/integrations e garante stack enterprise para E2E", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento indisponível");
    await loginAsMasterAdmin(page, authContext!);
    await page.goto("/admin/integrations");
    await expect(page).toHaveURL(/\/admin\/integrations(?:\/|$)/);
    await expect(page.getByRole("heading", { name: /Integrações Globais/i })).toBeVisible();

    const initializeStackButton = page
      .locator("button")
      .filter({ hasText: /^Inicializar stack padrão$|^Inicializando\.\.\.$/ })
      .first();
    await initializeStackButton.click();
    await expect
      .poll(async () => (await initializeStackButton.textContent())?.trim(), { timeout: 20_000 })
      .toBe("Inicializar stack padrão");

    for (const provider of REQUIRED_PROVIDERS) {
      await expect(
        page
          .locator("button")
          .filter({ hasText: new RegExp(`^${provider}\\b`, "i") })
          .first(),
      ).toBeVisible();
    }
  });

  test("salva provider demo com persistência real em Supabase", async ({ page }, testInfo) => {
    test.skip(!authContext, provisionError ?? "Provisionamento indisponível");
    await loginAsMasterAdmin(page, authContext!);
    await page.goto("/admin/integrations");

    const providerKey = `demo_${testInfo.project.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
    const providerInput = page.getByPlaceholder("ex.: openrouter");
    await providerInput.fill(providerKey);
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`^${providerKey}$`, "i") })).toBeVisible();

    const stamp = `e2e-${Date.now()}`;
    const payload = JSON.stringify(
      {
        mode: "e2e",
        stamp,
        suite: "admin-integrations-real",
      },
      null,
      2,
    );

    await page.locator("select").first().selectOption("active");
    await page.locator("textarea").first().fill(payload);
    await page.getByRole("button", { name: /Salvar integração/i }).click();

    await expect(
      page.locator("p").filter({ hasText: /Integração salva com sucesso/i }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /Recarregar/i }).click();
    await providerInput.fill(providerKey);
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.locator("textarea").first()).toContainText(stamp);
  });

  test("conecta Telegram em fluxo real estilo Connect Account", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento indisponível");
    const rawTelegramToken = resolveEnv("TELEGRAM_BOT_TOKEN");
    test.skip(!rawTelegramToken, "TELEGRAM_BOT_TOKEN ausente no ambiente E2E");
    const telegramBotToken = rawTelegramToken ?? "";
    test.skip(!isLikelyTelegramBotToken(telegramBotToken), "TELEGRAM_BOT_TOKEN inválido para validação real");

    await loginAsMasterAdmin(page, authContext!);
    await page.goto("/admin/integrations");
    await page.getByRole("button", { name: /Inicializar stack padrão/i }).click();

    const providerInput = page.getByPlaceholder("ex.: openrouter");
    await providerInput.fill("telegram");
    await page.getByRole("button", { name: /^Add$/ }).click();

    await expect(page.getByRole("heading", { name: /^telegram$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Connect Account/i })).toBeVisible();
    await page.locator('input[type="password"]').first().fill(telegramBotToken);
    await page.getByRole("button", { name: /Connect Account/i }).click();

    await expect(
      page.locator("p").filter({ hasText: /Telegram conectado com sucesso/i }).first(),
    ).toBeVisible();
    await expect(page.locator("select").first()).toHaveValue("active");
  });

  test("conecta Stripe em fluxo real estilo Connect Account", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento indisponível");
    const rawStripeSecretKey = resolveEnv("STRIPE_SECRET_KEY");
    test.skip(!rawStripeSecretKey, "STRIPE_SECRET_KEY ausente no ambiente E2E");
    const stripeSecretKey = rawStripeSecretKey ?? "";
    test.skip(!isLikelyStripeSecretKey(stripeSecretKey), "STRIPE_SECRET_KEY inválida para validação real");
    const stripeConnectClientId = resolveEnv("STRIPE_CONNECT_CLIENT_ID") ?? resolveEnv("STRIPE_CLIENT_ID") ?? "";

    await loginAsMasterAdmin(page, authContext!);
    await page.goto("/admin/integrations");
    await page.getByRole("button", { name: /Inicializar stack padrão/i }).click();

    const providerInput = page.getByPlaceholder("ex.: openrouter");
    await providerInput.fill("stripe");
    await page.getByRole("button", { name: /^Add$/ }).click();

    await expect(page.getByRole("heading", { name: /^stripe$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Connect Stripe Account/i })).toBeVisible();
    await page.getByLabel(/secret key/i).fill(stripeSecretKey);
    if (stripeConnectClientId.trim()) {
      await page.getByLabel(/connect client id/i).fill(stripeConnectClientId.trim());
    }
    await page.getByRole("button", { name: /Connect Account/i }).click();

    await expect(page.locator("p").filter({ hasText: /Stripe conectado com sucesso/i }).first()).toBeVisible();
    const statusValue = await page.locator("select").first().inputValue();
    if (stripeConnectClientId.trim()) {
      expect(statusValue).toBe("active");
    } else {
      expect(["active", "draft"]).toContain(statusValue);
    }
  });

  test("conecta Asaas em fluxo real estilo Connect Account", async ({ page }) => {
    test.skip(!authContext, provisionError ?? "Provisionamento indisponível");
    const rawAsaasApiKey = resolveEnv("ASAAS_API_KEY") ?? resolveEnv("ASAAS_ACCESS_TOKEN") ?? resolveEnv("ASAAS_TOKEN");
    test.skip(!rawAsaasApiKey, "ASAAS_API_KEY/ASAAS_ACCESS_TOKEN ausente no ambiente E2E");
    const asaasApiKey = rawAsaasApiKey ?? "";
    test.skip(!isLikelyAsaasApiKey(asaasApiKey), "API key Asaas inválida para validação real");

    await loginAsMasterAdmin(page, authContext!);
    await page.goto("/admin/integrations");
    await page.getByRole("button", { name: /Inicializar stack padrão/i }).click();

    const providerInput = page.getByPlaceholder("ex.: openrouter");
    await providerInput.fill("asaas");
    await page.getByRole("button", { name: /^Add$/ }).click();

    await expect(page.getByRole("heading", { name: /^asaas$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Connect Asaas Account/i })).toBeVisible();
    await page.getByLabel(/api key/i).fill(asaasApiKey);
    await page.getByRole("button", { name: /Connect Account/i }).click();

    await expect(page.locator("p").filter({ hasText: /Asaas conectado com sucesso/i }).first()).toBeVisible();
    await expect(page.locator("select").first()).toHaveValue("active");
  });
});
