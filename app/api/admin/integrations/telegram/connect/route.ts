import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/admin/http";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

const route = "/api/admin/integrations/telegram/connect";
const TELEGRAM_TOKEN_REGEX = /^\d{6,}:[A-Za-z0-9_-]{20,}$/;

const connectTelegramSchema = z
  .object({
    botToken: z
      .string()
      .trim()
      .min(20, "botToken is too short")
      .max(300, "botToken is too long")
      .refine((value) => TELEGRAM_TOKEN_REGEX.test(value), "Invalid Telegram bot token format")
      .optional(),
    useRuntime: z.boolean().optional(),
    loginDomain: z.string().trim().max(255).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.useRuntime && !value.botToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["botToken"],
        message: "botToken is required when useRuntime is not enabled",
      });
    }
  });

type TelegramGetMeResult = {
  ok?: boolean;
  result?: {
    id?: number;
    username?: string;
    first_name?: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
    supports_inline_queries?: boolean;
  };
  description?: string;
};

type PlatformIntegrationRead = {
  public_config_json: Json;
};

type PlatformIntegrationWrite = {
  provider: string;
  status: "active";
  public_config_json: Json;
  secret_ref: string;
  last_validated_at: string;
  updated_by: string;
};

function toObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function trimError(input: unknown, max = 220): string {
  const value = String(input ?? "");
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function resolveAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

function normalizeLoginDomain(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const asUrl = value.includes("://") ? value : `https://${value}`;
  try {
    const parsed = new URL(asUrl);
    const host = parsed.hostname.toLowerCase();
    if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

async function validateTelegramToken(botToken: string): Promise<Required<NonNullable<TelegramGetMeResult["result"]>>> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as TelegramGetMeResult;
  if (!response.ok) {
    const description = trimError(payload?.description ?? `http_${response.status}`);
    throw new Error(`telegram_getMe_http_error: ${description}`);
  }

  if (!payload?.ok || !payload?.result?.id) {
    const description = trimError(payload?.description ?? "unknown_error");
    throw new Error(`telegram_getMe_invalid: ${description}`);
  }

  return {
    id: payload.result.id,
    username: payload.result.username ?? "",
    first_name: payload.result.first_name ?? "",
    can_join_groups: Boolean(payload.result.can_join_groups),
    can_read_all_group_messages: Boolean(payload.result.can_read_all_group_messages),
    supports_inline_queries: Boolean(payload.result.supports_inline_queries),
  };
}

export async function POST(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized telegram connect attempt", { route });
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request, connectTelegramSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const runtimeToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!runtimeToken) {
    return NextResponse.json(
      {
        error: "TELEGRAM_BOT_TOKEN ausente no runtime. Configure o env antes de conectar.",
        code: "TELEGRAM_RUNTIME_TOKEN_MISSING",
      },
      { status: 422 },
    );
  }

  const useRuntime = Boolean(parsedBody.data.useRuntime);
  const providedToken = parsedBody.data.botToken?.trim() ?? "";
  if (!useRuntime && runtimeToken !== providedToken) {
    return NextResponse.json(
      {
        error: "Token informado não corresponde ao TELEGRAM_BOT_TOKEN do runtime.",
        code: "TELEGRAM_RUNTIME_TOKEN_MISMATCH",
      },
      { status: 409 },
    );
  }

  const tokenForValidation = useRuntime ? runtimeToken : providedToken;

  const loginDomainInput = parsedBody.data.loginDomain?.trim() ?? null;
  if (loginDomainInput && !normalizeLoginDomain(loginDomainInput)) {
    return NextResponse.json(
      {
        error: "loginDomain inválido. Use um domínio público (sem localhost).",
        code: "TELEGRAM_LOGIN_DOMAIN_INVALID",
      },
      { status: 422 },
    );
  }

  let bot: Awaited<ReturnType<typeof validateTelegramToken>>;
  try {
    bot = await validateTelegramToken(tokenForValidation);
  } catch (error) {
    logger.warn("[Admin/Integrations] Telegram token validation failed", {
      route,
      userId: auth.context.user.id,
      error: trimError(error instanceof Error ? error.message : String(error)),
    });
    return NextResponse.json(
      {
        error: "Falha ao validar bot token no Telegram (`getMe`).",
        code: "TELEGRAM_VALIDATION_FAILED",
      },
      { status: 422 },
    );
  }

  const { data: existing, error: existingError } = await auth.context.supabase
    .from("platform_integrations")
    .select("public_config_json")
    .eq("provider", "telegram")
    .maybeSingle<PlatformIntegrationRead>();

  if (existingError) {
    logger.error("[Admin/Integrations] Failed to load existing telegram integration", {
      route,
      userId: auth.context.user.id,
      error: String(existingError),
    });
  }

  const now = new Date().toISOString();
  const appUrl = resolveAppUrl(request);
  const existingConfig = toObject(existing?.public_config_json);
  const existingLoginWidget = toObject(existingConfig.loginWidget);
  const existingWebhook = toObject(existingConfig.webhook);
  const existingValidation = toObject(existingConfig.validation);

  const normalizedLoginDomain =
    normalizeLoginDomain(loginDomainInput) ??
    normalizeLoginDomain(existingLoginWidget.loginDomain as string | undefined) ??
    normalizeLoginDomain(process.env.TELEGRAM_LOGIN_DOMAIN) ??
    normalizeLoginDomain(process.env.NEXT_PUBLIC_APP_URL);

  const publicConfig = {
    ...existingConfig,
    provider: "telegram",
    authMode: "telegram_login_widget_hash",
    connectedAccount: {
      botId: bot.id,
      botUsername: bot.username || null,
      botDisplayName: bot.first_name || null,
      tokenSource: "env:TELEGRAM_BOT_TOKEN",
      connectedAt: now,
      connectedBy: auth.context.user.id,
    },
    loginWidget: {
      ...existingLoginWidget,
      provider: "telegram-login-widget",
      protocol: "hash_validation",
      botUsername: bot.username || null,
      loginDomain: normalizedLoginDomain,
      callbackPath: "/auth/telegram/callback",
      requiresHttpsPublicDomain: true,
      ready: Boolean(normalizedLoginDomain),
    },
    webhook: {
      ...existingWebhook,
      url: `${appUrl}/api/telegram/webhook`,
      secretRef: "env:TELEGRAM_WEBHOOK_SECRET",
      ready: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
    },
    validation: {
      ...existingValidation,
      getMe: true,
      botId: bot.id,
      botUsername: bot.username || null,
      checkedAt: now,
    },
  } satisfies Record<string, unknown>;

  const payload: PlatformIntegrationWrite = {
    provider: "telegram",
    status: "active",
    public_config_json: publicConfig as Json,
    secret_ref: "env:TELEGRAM_BOT_TOKEN",
    last_validated_at: now,
    updated_by: auth.context.user.id,
  };

  const { data: updated, error: updateError } = await auth.context.supabase
    .from("platform_integrations")
    .upsert(payload, { onConflict: "provider" })
    .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    logger.error("[Admin/Integrations] Failed to persist telegram integration", {
      route,
      userId: auth.context.user.id,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to connect telegram integration" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "platform_integration_connected",
    resourceType: "platform_integration",
    resourceId: "telegram",
    diff: {
      provider: "telegram",
      status: updated.status,
      botId: bot.id,
      botUsername: bot.username || null,
      loginWidgetReady: Boolean(normalizedLoginDomain),
    },
  });

  logger.info("[Admin/Integrations] Telegram integration connected", {
    route,
    userId: auth.context.user.id,
    provider: "telegram",
    botId: bot.id,
    botUsername: bot.username || null,
  });

  return NextResponse.json({
    success: true,
    data: updated,
  });
}
