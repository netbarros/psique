import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/admin/http";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

const route = "/api/admin/integrations/runtime/sync";
const providerEnum = z.enum([
  "openrouter",
  "telegram",
  "stripe",
  "asaas",
  "daily",
  "resend",
  "upstash",
  "sentry",
  "demo",
]);

const syncRuntimeSchema = z.object({
  providers: z.array(providerEnum).min(1).max(20).optional(),
  dryRun: z.boolean().optional(),
});

type Provider = z.infer<typeof providerEnum>;
type IntegrationStatus = "active" | "draft" | "invalid";

type SyncResolution = {
  provider: Provider;
  status: IntegrationStatus;
  secretRef: string | null;
  lastValidatedAt: string | null;
  publicConfig: Record<string, unknown>;
  validation: {
    ok: boolean;
    reason: string;
  };
};

type IntegrationRow = {
  provider: string;
  status: IntegrationStatus;
  public_config_json: Json | null;
  last_validated_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function hasValue(input: string | null | undefined): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

function trimError(input: unknown, max = 220): string {
  const value = String(input ?? "");
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function buildRuntimeFlags(keys: string[]) {
  const configuredEnv: Record<string, boolean> = {};
  for (const key of keys) {
    configuredEnv[key] = hasValue(process.env[key]);
  }
  return {
    requiredEnv: keys,
    configuredEnv,
  };
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
}

async function validateOpenRouter(apiKey: string) {
  const { response, payload } = await fetchJson("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://psique.app",
      "X-Title": "Psique Admin Runtime Sync",
    },
  });

  if (!response.ok) {
    throw new Error(`openrouter_http_${response.status}: ${trimError((payload as { error?: string })?.error)}`);
  }

  const modelCount = Array.isArray((payload as { data?: unknown[] })?.data)
    ? (payload as { data: unknown[] }).data.length
    : 0;
  return { modelCount };
}

type TelegramGetMePayload = {
  ok?: boolean;
  result?: { id?: number; username?: string; first_name?: string };
  description?: string;
};

async function validateTelegram(botToken: string) {
  const { response, payload } = await fetchJson(`https://api.telegram.org/bot${botToken}/getMe`, {
    method: "GET",
  });
  const parsed = payload as TelegramGetMePayload;
  if (!response.ok || !parsed?.ok || !parsed?.result?.id) {
    throw new Error(`telegram_getMe_failed: ${trimError(parsed?.description ?? `http_${response.status}`)}`);
  }
  return {
    botId: parsed.result.id,
    botUsername: parsed.result.username ?? null,
    botDisplayName: parsed.result.first_name ?? null,
  };
}

async function validateStripe(secretKey: string) {
  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
  const account = await stripe.accounts.retrieve();
  if (!account?.id) {
    throw new Error("stripe_accounts_retrieve_missing_account_id");
  }
  return {
    accountId: account.id,
    country: account.country ?? null,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
  };
}

type AsaasPayload = {
  name?: string;
  walletId?: string;
  email?: string;
  errors?: Array<{ description?: string; code?: string }>;
};

function getAsaasRuntimeKey() {
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  if (apiKey) return { key: apiKey, secretRef: "env:ASAAS_API_KEY" as const };

  const accessToken = process.env.ASAAS_ACCESS_TOKEN?.trim();
  if (accessToken) return { key: accessToken, secretRef: "env:ASAAS_ACCESS_TOKEN" as const };

  const legacyToken = process.env.ASAAS_TOKEN?.trim();
  if (legacyToken) return { key: legacyToken, secretRef: "env:ASAAS_TOKEN" as const };

  return { key: "", secretRef: "env:ASAAS_API_KEY" as const };
}

async function validateAsaas(apiKey: string) {
  const { response, payload } = await fetchJson("https://api.asaas.com/v3/myAccount", {
    method: "GET",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
    },
  });

  const parsed = payload as AsaasPayload;
  if (!response.ok) {
    const firstError = parsed.errors?.[0]?.description ?? parsed.errors?.[0]?.code ?? `http_${response.status}`;
    throw new Error(`asaas_myAccount_failed: ${trimError(firstError)}`);
  }

  return {
    accountName: parsed.name ?? null,
    walletId: parsed.walletId ?? null,
    email: parsed.email ?? null,
  };
}

async function validateDaily(apiKey: string, apiUrl: string) {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");
  const { response } = await fetchJson(`${normalizedApiUrl}/rooms?limit=1`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`daily_rooms_failed_http_${response.status}`);
  }
}

async function validateResend(apiKey: string) {
  const { response } = await fetchJson("https://api.resend.com/domains", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`resend_domains_failed_http_${response.status}`);
  }
}

async function validateUpstash(url: string, token: string) {
  const redis = new Redis({ url, token });
  const pong = await redis.ping();
  if (!pong || String(pong).toUpperCase() !== "PONG") {
    throw new Error("upstash_ping_unexpected_response");
  }
}

function validateSentryDsn(dsn: string) {
  const parsed = new URL(dsn);
  if (!parsed.protocol.startsWith("http")) throw new Error("sentry_dsn_invalid_protocol");
  if (!parsed.hostname) throw new Error("sentry_dsn_invalid_host");
}

async function resolveProvider(provider: Provider): Promise<SyncResolution> {
  const now = new Date().toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim() ?? "";
    const runtime = buildRuntimeFlags(["OPENROUTER_API_KEY"]);
    const baseConfig = {
      provider: "openrouter",
      authMode: "api_key",
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-3.5-sonnet",
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(apiKey)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "OPENROUTER_API_KEY ausente" },
      };
    }

    try {
      const details = await validateOpenRouter(apiKey);
      return {
        provider,
        status: "active",
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: now,
        publicConfig: { ...baseConfig, validation: { ...details, checkedAt: now } },
        validation: { ok: true, reason: "OpenRouter validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:OPENROUTER_API_KEY",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
    const loginDomain = process.env.TELEGRAM_LOGIN_DOMAIN?.trim() ?? "";
    const runtime = buildRuntimeFlags(["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"]);
    const baseConfig = {
      provider: "telegram",
      authMode: "telegram_login_widget_hash",
      loginWidget: {
        provider: "telegram-login-widget",
        protocol: "hash_validation",
        loginDomain: hasValue(loginDomain) ? loginDomain : null,
        callbackPath: "/auth/telegram/callback",
      },
      webhook: {
        url: `${appUrl.replace(/\/+$/, "")}/api/telegram/webhook`,
        secretRef: "env:TELEGRAM_WEBHOOK_SECRET",
      },
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(token)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "TELEGRAM_BOT_TOKEN ausente" },
      };
    }

    try {
      const details = await validateTelegram(token);
      return {
        provider,
        status: "active",
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: now,
        publicConfig: {
          ...baseConfig,
          connectedAccount: {
            ...details,
            tokenSource: "env:TELEGRAM_BOT_TOKEN",
            connectedAt: now,
          },
          validation: { ...details, checkedAt: now },
        },
        validation: { ok: true, reason: "Telegram validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:TELEGRAM_BOT_TOKEN",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "stripe") {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim() ?? process.env.STRIPE_CLIENT_ID?.trim() ?? "";
    const runtime = buildRuntimeFlags(["STRIPE_SECRET_KEY", "STRIPE_CONNECT_CLIENT_ID"]);
    const baseConfig = {
      provider: "stripe",
      authMode: "oauth",
      oauth: {
        authorizeUrl: "https://connect.stripe.com/oauth/authorize",
        tokenUrl: "https://connect.stripe.com/oauth/token",
        scope: "read_write",
        clientIdRef: "env:STRIPE_CONNECT_CLIENT_ID",
        connectClientId: hasValue(connectClientId) ? connectClientId : null,
      },
      payments: {
        card: true,
        pix: true,
      },
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(secretKey)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "STRIPE_SECRET_KEY ausente" },
      };
    }

    try {
      const details = await validateStripe(secretKey);
      const oauthReady = hasValue(connectClientId);
      return {
        provider,
        status: oauthReady ? "active" : "draft",
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: now,
        publicConfig: {
          ...baseConfig,
          connectedAccount: {
            ...details,
            keySource: "env:STRIPE_SECRET_KEY",
            connectedAt: now,
          },
          validation: { ...details, checkedAt: now },
          oauth: {
            ...baseConfig.oauth,
            ready: oauthReady,
          },
        },
        validation: {
          ok: oauthReady,
          reason: oauthReady
            ? "Stripe API + OAuth configurados"
            : "Stripe API válida; falta STRIPE_CONNECT_CLIENT_ID para OAuth",
        },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:STRIPE_SECRET_KEY",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "asaas") {
    const resolved = getAsaasRuntimeKey();
    const runtime = buildRuntimeFlags(["ASAAS_API_KEY", "ASAAS_ACCESS_TOKEN", "ASAAS_TOKEN"]);
    const baseConfig = {
      provider: "asaas",
      authMode: "api_key",
      pix: {
        enabled: true,
        provider: "asaas",
        apiBaseUrl: "https://api.asaas.com/v3",
      },
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(resolved.key)) {
      return {
        provider,
        status: "draft",
        secretRef: resolved.secretRef,
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "ASAAS_API_KEY ausente" },
      };
    }

    try {
      const details = await validateAsaas(resolved.key);
      return {
        provider,
        status: "active",
        secretRef: resolved.secretRef,
        lastValidatedAt: now,
        publicConfig: {
          ...baseConfig,
          connectedAccount: {
            ...details,
            keySource: resolved.secretRef,
            connectedAt: now,
          },
          validation: { ...details, checkedAt: now },
        },
        validation: { ok: true, reason: "Asaas validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: resolved.secretRef,
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "daily") {
    const apiKey = process.env.DAILY_API_KEY?.trim() ?? "";
    const apiUrl = process.env.DAILY_API_URL?.trim() || "https://api.daily.co/v1";
    const runtime = buildRuntimeFlags(["DAILY_API_KEY", "DAILY_API_URL"]);
    const baseConfig = {
      provider: "daily",
      authMode: "api_key",
      apiBaseUrl: apiUrl,
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(apiKey)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:DAILY_API_KEY",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "DAILY_API_KEY ausente" },
      };
    }

    try {
      await validateDaily(apiKey, apiUrl);
      return {
        provider,
        status: "active",
        secretRef: "env:DAILY_API_KEY",
        lastValidatedAt: now,
        publicConfig: { ...baseConfig, validation: { roomsEndpoint: true, checkedAt: now } },
        validation: { ok: true, reason: "Daily validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:DAILY_API_KEY",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? null;
    const fromName = process.env.RESEND_FROM_NAME?.trim() ?? "Psique";
    const runtime = buildRuntimeFlags(["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_FROM_NAME"]);
    const baseConfig = {
      provider: "resend",
      authMode: "api_key",
      sender: {
        fromEmail,
        fromName,
      },
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(apiKey)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:RESEND_API_KEY",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "RESEND_API_KEY ausente" },
      };
    }

    try {
      await validateResend(apiKey);
      return {
        provider,
        status: "active",
        secretRef: "env:RESEND_API_KEY",
        lastValidatedAt: now,
        publicConfig: { ...baseConfig, validation: { domainsEndpoint: true, checkedAt: now } },
        validation: { ok: true, reason: "Resend validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:RESEND_API_KEY",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "upstash") {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
    const runtime = buildRuntimeFlags(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
    const baseConfig = {
      provider: "upstash",
      authMode: "api_key",
      service: "redis_rest",
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(url) || !hasValue(token)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:UPSTASH_REDIS_REST_TOKEN",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "UPSTASH_REDIS_REST_URL/TOKEN ausente" },
      };
    }

    try {
      await validateUpstash(url, token);
      return {
        provider,
        status: "active",
        secretRef: "env:UPSTASH_REDIS_REST_TOKEN",
        lastValidatedAt: now,
        publicConfig: { ...baseConfig, validation: { ping: true, checkedAt: now } },
        validation: { ok: true, reason: "Upstash Redis validado" },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:UPSTASH_REDIS_REST_TOKEN",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  if (provider === "sentry") {
    const serverDsn = process.env.SENTRY_DSN?.trim() ?? "";
    const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ?? "";
    const runtime = buildRuntimeFlags(["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"]);
    const baseConfig = {
      provider: "sentry",
      authMode: "dsn",
      runtime,
    } satisfies Record<string, unknown>;

    if (!hasValue(serverDsn) && !hasValue(clientDsn)) {
      return {
        provider,
        status: "draft",
        secretRef: "env:SENTRY_DSN",
        lastValidatedAt: null,
        publicConfig: baseConfig,
        validation: { ok: false, reason: "SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN ausente" },
      };
    }

    try {
      if (hasValue(serverDsn)) validateSentryDsn(serverDsn);
      if (hasValue(clientDsn)) validateSentryDsn(clientDsn);
      const fullyConfigured = hasValue(serverDsn) && hasValue(clientDsn);
      return {
        provider,
        status: fullyConfigured ? "active" : "draft",
        secretRef: "env:SENTRY_DSN",
        lastValidatedAt: now,
        publicConfig: {
          ...baseConfig,
          telemetry: {
            serverDsnConfigured: hasValue(serverDsn),
            clientDsnConfigured: hasValue(clientDsn),
          },
          validation: { dsnParsed: true, checkedAt: now },
        },
        validation: {
          ok: fullyConfigured,
          reason: fullyConfigured
            ? "Sentry server/client configurados"
            : "Sentry parcialmente configurado (server/client)",
        },
      };
    } catch (error) {
      return {
        provider,
        status: "invalid",
        secretRef: "env:SENTRY_DSN",
        lastValidatedAt: null,
        publicConfig: { ...baseConfig, validationError: trimError(error instanceof Error ? error.message : error) },
        validation: { ok: false, reason: trimError(error instanceof Error ? error.message : error) },
      };
    }
  }

  return {
    provider: "demo",
    status: "active",
    secretRef: null,
    lastValidatedAt: now,
    publicConfig: {
      provider: "demo",
      authMode: "demo",
      e2eReady: true,
      runtime: {
        requiredEnv: [],
        configuredEnv: {},
      },
      validation: { checkedAt: now },
    },
    validation: { ok: true, reason: "Provider demo ativo" },
  };
}

export async function POST(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized runtime sync attempt", { route });
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request, syncRuntimeSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const providers = parsedBody.data.providers ?? providerEnum.options;
  const dryRun = Boolean(parsedBody.data.dryRun);
  const now = new Date().toISOString();
  const resolutions: SyncResolution[] = [];
  const upsertedRows: IntegrationRow[] = [];

  for (const provider of providers) {
    // Keep sequential processing to preserve deterministic logs and provider ordering.
    const resolved = await resolveProvider(provider);
    resolutions.push(resolved);

    if (dryRun) continue;

    const payload = {
      provider: resolved.provider,
      status: resolved.status,
      public_config_json: resolved.publicConfig as Json,
      secret_ref: resolved.secretRef,
      last_validated_at: resolved.lastValidatedAt,
      updated_by: auth.context.user.id,
    };

    const { data: updated, error: updateError } = await auth.context.supabase
      .from("platform_integrations")
      .upsert(payload, { onConflict: "provider" })
      .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
      .single<IntegrationRow>();

    if (updateError || !updated) {
      logger.error("[Admin/Integrations] Failed to persist runtime sync provider", {
        route,
        userId: auth.context.user.id,
        provider,
        error: String(updateError),
      });
      return NextResponse.json(
        {
          error: "Failed to persist runtime integration sync",
          code: "RUNTIME_SYNC_PERSIST_FAILED",
          provider,
        },
        { status: 500 },
      );
    }

    upsertedRows.push(updated);
  }

  const summary = resolutions.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      total: resolutions.length,
      active: 0,
      draft: 0,
      invalid: 0,
    },
  );

  if (!dryRun) {
    await insertAdminAuditEvent(auth.context.supabase, {
      actorUserId: auth.context.user.id,
      action: "platform_integrations_runtime_synced",
      resourceType: "platform_integration",
      resourceId: "runtime-sync",
      diff: {
        route,
        syncedAt: now,
        providers,
        summary,
      },
    });
  }

  logger.info("[Admin/Integrations] Runtime sync completed", {
    route,
    userId: auth.context.user.id,
    dryRun,
    summary,
  });

  return NextResponse.json({
    success: true,
    data: {
      syncedAt: now,
      dryRun,
      summary,
      items: resolutions.map((item) => ({
        provider: item.provider,
        status: item.status,
        reason: item.validation.reason,
        validatedAt: item.lastValidatedAt,
      })),
      integrations: dryRun ? [] : upsertedRows,
    },
  });
}
