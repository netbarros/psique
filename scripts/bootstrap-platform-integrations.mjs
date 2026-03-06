#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const NOW_ISO = () => new Date().toISOString();

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    strict: args.includes("--strict"),
  };
}

function loadDotEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return;

  const raw = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function hasValue(input) {
  return typeof input === "string" && input.trim().length > 0;
}

function isPublicHttpsUrl(urlValue) {
  if (!hasValue(urlValue)) return false;
  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:") return false;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

function trimTo(input, max = 240) {
  const value = String(input ?? "");
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function getAsaasApiKey() {
  return (
    process.env.ASAAS_API_KEY ??
    process.env.ASAAS_ACCESS_TOKEN ??
    process.env.ASAAS_TOKEN ??
    null
  );
}

async function validateOpenRouter(apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://psique.app",
      "X-Title": "Psique Integrations Bootstrap",
    },
  });

  if (!response.ok) {
    const body = trimTo(await response.text());
    throw new Error(`openrouter_http_${response.status}: ${body}`);
  }

  const payload = await response.json();
  const count = Array.isArray(payload?.data) ? payload.data.length : 0;
  return { modelCount: count };
}

async function validateStripe(secretKey) {
  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: false,
  });
  const account = await stripe.accounts.retrieve();
  return {
    accountId: account?.id ?? null,
    country: account?.country ?? null,
  };
}

async function validateTelegram(token) {
  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  if (!response.ok) {
    const body = trimTo(await response.text());
    throw new Error(`telegram_http_${response.status}: ${body}`);
  }
  const payload = await response.json();
  if (!payload?.ok || !payload?.result) {
    throw new Error(`telegram_api_error: ${trimTo(payload?.description ?? "unknown")}`);
  }
  return {
    botUsername: payload.result.username ?? null,
    botId: payload.result.id ?? null,
  };
}

async function validateAsaas(apiKey) {
  const response = await fetch("https://api.asaas.com/v3/myAccount", {
    method: "GET",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = trimTo(await response.text());
    throw new Error(`asaas_http_${response.status}: ${body}`);
  }

  const payload = await response.json();
  return {
    accountName: payload?.name ?? null,
    walletId: payload?.walletId ?? null,
  };
}

function basePublicConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    appUrl,
    managedBy: "bootstrap-platform-integrations",
    syncedAt: NOW_ISO(),
  };
}

async function resolveProviderState(provider) {
  const baseConfig = basePublicConfig();
  const stripeClientId = process.env.STRIPE_CONNECT_CLIENT_ID ?? process.env.STRIPE_CLIENT_ID ?? null;
  const asaasKey = getAsaasApiKey();

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const publicConfig = {
      ...baseConfig,
      authMode: "api_key",
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-3.5-sonnet",
      provider: "openrouter",
    };

    if (!hasValue(apiKey)) {
      return {
        status: "draft",
        publicConfig,
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: "OPENROUTER_API_KEY ausente" },
      };
    }

    try {
      const details = await validateOpenRouter(apiKey);
      return {
        status: "active",
        publicConfig: { ...publicConfig, validation: details },
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: NOW_ISO(),
        validation: { ok: true, reason: "OpenRouter validado" },
      };
    } catch (error) {
      return {
        status: "invalid",
        publicConfig: { ...publicConfig, validationError: trimTo(error?.message ?? String(error)) },
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: trimTo(error?.message ?? String(error)) },
      };
    }
  }

  if (provider === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const appUrl = baseConfig.appUrl;
    const loginDomain = process.env.TELEGRAM_LOGIN_DOMAIN ?? null;
    const effectiveLoginUrl = hasValue(loginDomain) ? `https://${loginDomain}` : appUrl;
    const loginWidgetReady = isPublicHttpsUrl(effectiveLoginUrl);
    const publicConfig = {
      ...baseConfig,
      authMode: "telegram_login_widget_hash",
      loginWidget: {
        provider: "telegram-login-widget",
        protocol: "hash_validation",
        botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
        loginDomain: loginDomain,
        callbackPath: "/auth/telegram/callback",
        requiresHttpsPublicDomain: true,
        ready: loginWidgetReady,
      },
      webhook: {
        url: `${baseConfig.appUrl}/api/telegram/webhook`,
        secretRef: "env:TELEGRAM_WEBHOOK_SECRET",
      },
      provider: "telegram",
    };

    if (!hasValue(token)) {
      return {
        status: "draft",
        publicConfig,
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: null,
        validation: { ok: false, reason: "TELEGRAM_BOT_TOKEN ausente" },
      };
    }

    try {
      const details = await validateTelegram(token);
      if (!loginWidgetReady) {
        return {
          status: "draft",
          publicConfig: {
            ...publicConfig,
            validation: details,
            validationWarning:
              "Telegram Login Widget exige domínio público HTTPS (não localhost). Configure TELEGRAM_LOGIN_DOMAIN ou NEXT_PUBLIC_APP_URL válido.",
          },
          secretRef: "env:TELEGRAM_BOT_TOKEN",
          lastValidatedAt: NOW_ISO(),
          validation: {
            ok: false,
            reason:
              "Bot token válido, mas login widget ainda sem domínio HTTPS público.",
          },
        };
      }
      return {
        status: "active",
        publicConfig: { ...publicConfig, validation: details },
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: NOW_ISO(),
        validation: { ok: true, reason: "Telegram validado" },
      };
    } catch (error) {
      return {
        status: "invalid",
        publicConfig: { ...publicConfig, validationError: trimTo(error?.message ?? String(error)) },
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: null,
        validation: { ok: false, reason: trimTo(error?.message ?? String(error)) },
      };
    }
  }

  if (provider === "stripe") {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publicConfig = {
      ...baseConfig,
      authMode: "oauth",
      oauth: {
        authorizeUrl: "https://connect.stripe.com/oauth/authorize",
        tokenUrl: "https://connect.stripe.com/oauth/token",
        scope: "read_write",
        clientIdRef: "env:STRIPE_CONNECT_CLIENT_ID",
        clientIdConfigured: hasValue(stripeClientId),
      },
      payments: {
        card: true,
        pix: true,
      },
      provider: "stripe",
    };

    if (!hasValue(secretKey)) {
      return {
        status: "draft",
        publicConfig,
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: "STRIPE_SECRET_KEY ausente" },
      };
    }

    try {
      const details = await validateStripe(secretKey);
      const status = hasValue(stripeClientId) ? "active" : "draft";
      const reason = hasValue(stripeClientId)
        ? "Stripe API + OAuth configurados"
        : "Stripe API válida; falta STRIPE_CONNECT_CLIENT_ID para OAuth";
      return {
        status,
        publicConfig: { ...publicConfig, validation: details },
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: NOW_ISO(),
        validation: { ok: status === "active", reason },
      };
    } catch (error) {
      return {
        status: "invalid",
        publicConfig: { ...publicConfig, validationError: trimTo(error?.message ?? String(error)) },
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: trimTo(error?.message ?? String(error)) },
      };
    }
  }

  if (provider === "asaas") {
    const publicConfig = {
      ...baseConfig,
      authMode: "api_key",
      pix: {
        enabled: true,
        provider: "asaas",
        apiBaseUrl: "https://api.asaas.com/v3",
      },
      provider: "asaas",
    };

    if (!hasValue(asaasKey)) {
      return {
        status: "draft",
        publicConfig,
        secretRef: "env:ASAAS_API_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: "ASAAS_API_KEY ausente" },
      };
    }

    try {
      const details = await validateAsaas(asaasKey);
      return {
        status: "active",
        publicConfig: { ...publicConfig, validation: details },
        secretRef: "env:ASAAS_API_KEY",
        lastValidatedAt: NOW_ISO(),
        validation: { ok: true, reason: "Asaas PIX validado" },
      };
    } catch (error) {
      return {
        status: "invalid",
        publicConfig: { ...publicConfig, validationError: trimTo(error?.message ?? String(error)) },
        secretRef: "env:ASAAS_API_KEY",
        lastValidatedAt: null,
        validation: { ok: false, reason: trimTo(error?.message ?? String(error)) },
      };
    }
  }

  if (provider === "demo") {
    return {
      status: "active",
      publicConfig: {
        ...baseConfig,
        authMode: "demo",
        e2eReady: true,
        provider: "demo",
      },
      secretRef: null,
      lastValidatedAt: NOW_ISO(),
      validation: { ok: true, reason: "Provider demo ativo para validação E2E" },
    };
  }

  throw new Error(`Provider não suportado: ${provider}`);
}

async function main() {
  const { strict } = parseArgs();
  loadDotEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasValue(supabaseUrl) || !hasValue(serviceRoleKey)) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const providers = ["openrouter", "telegram", "stripe", "asaas", "demo"];
  const results = [];

  for (const provider of providers) {
    const resolved = await resolveProviderState(provider);
    const payload = {
      provider,
      status: resolved.status,
      public_config_json: resolved.publicConfig,
      secret_ref: resolved.secretRef,
      last_validated_at: resolved.lastValidatedAt,
    };

    const { data, error } = await supabase
      .from("platform_integrations")
      .upsert(payload, { onConflict: "provider" })
      .select("provider, status, last_validated_at")
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert provider '${provider}': ${error?.message ?? "unknown"}`);
    }

    const line = {
      provider: data.provider,
      status: data.status,
      validatedAt: data.last_validated_at,
      validation: resolved.validation.reason,
    };

    results.push(line);
    console.log(
      `[integrations-bootstrap] provider=${line.provider} status=${line.status} validated_at=${line.validatedAt ?? "null"} note="${line.validation}"`,
    );
  }

  const hasFailure = results.some((item) => item.status === "invalid");
  const hasDraft = results.some((item) => item.status === "draft");
  if (strict && (hasFailure || hasDraft)) {
    throw new Error("Strict mode failed: at least one provider is invalid/draft.");
  }

  console.log("[integrations-bootstrap] completed");
}

main().catch((error) => {
  console.error(`[integrations-bootstrap] failed: ${String(error?.message ?? error)}`);
  process.exit(1);
});
