import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/admin/http";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

const route = "/api/admin/integrations/asaas/connect";

const connectAsaasSchema = z
  .object({
    apiKey: z.string().trim().min(20, "apiKey is too short").max(300, "apiKey is too long").optional(),
    useRuntime: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.useRuntime && !value.apiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apiKey"],
        message: "apiKey is required when useRuntime is not enabled",
      });
    }
  });

type AsaasAccountDetails = {
  accountName: string | null;
  walletId: string | null;
  email: string | null;
};

type AsaasMyAccountResult = {
  name?: string;
  walletId?: string;
  email?: string;
  errors?: Array<{ description?: string; code?: string }>;
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

function resolveAsaasRuntimeKey() {
  const fromPrimary = process.env.ASAAS_API_KEY?.trim();
  if (fromPrimary) {
    return {
      value: fromPrimary,
      secretRef: "env:ASAAS_API_KEY",
    } as const;
  }

  const fromAccessToken = process.env.ASAAS_ACCESS_TOKEN?.trim();
  if (fromAccessToken) {
    return {
      value: fromAccessToken,
      secretRef: "env:ASAAS_ACCESS_TOKEN",
    } as const;
  }

  const fromToken = process.env.ASAAS_TOKEN?.trim();
  if (fromToken) {
    return {
      value: fromToken,
      secretRef: "env:ASAAS_TOKEN",
    } as const;
  }

  return {
    value: "",
    secretRef: "env:ASAAS_API_KEY",
  } as const;
}

async function validateAsaasApiKey(apiKey: string): Promise<AsaasAccountDetails> {
  const response = await fetch("https://api.asaas.com/v3/myAccount", {
    method: "GET",
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as AsaasMyAccountResult;
  if (!response.ok) {
    const firstError = payload.errors?.[0]?.description ?? payload.errors?.[0]?.code ?? `http_${response.status}`;
    throw new Error(`asaas_myAccount_http_error: ${trimError(firstError)}`);
  }

  return {
    accountName: payload.name ?? null,
    walletId: payload.walletId ?? null,
    email: payload.email ?? null,
  };
}

export async function POST(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized asaas connect attempt", { route });
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request, connectAsaasSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const runtime = resolveAsaasRuntimeKey();
  if (!runtime.value) {
    return NextResponse.json(
      {
        error: "ASAAS_API_KEY ausente no runtime. Configure o env antes de conectar.",
        code: "ASAAS_RUNTIME_KEY_MISSING",
      },
      { status: 422 },
    );
  }

  const useRuntime = Boolean(parsedBody.data.useRuntime);
  const providedApiKey = parsedBody.data.apiKey?.trim() ?? "";
  if (!useRuntime && runtime.value !== providedApiKey) {
    return NextResponse.json(
      {
        error: "API key informada não corresponde ao token Asaas do runtime.",
        code: "ASAAS_RUNTIME_KEY_MISMATCH",
      },
      { status: 409 },
    );
  }
  const apiKeyForValidation = useRuntime ? runtime.value : providedApiKey;

  let account: AsaasAccountDetails;
  try {
    account = await validateAsaasApiKey(apiKeyForValidation);
  } catch (error) {
    logger.warn("[Admin/Integrations] Asaas key validation failed", {
      route,
      userId: auth.context.user.id,
      error: trimError(error instanceof Error ? error.message : String(error)),
    });
    return NextResponse.json(
      {
        error: "Falha ao validar API key Asaas (`/v3/myAccount`).",
        code: "ASAAS_VALIDATION_FAILED",
      },
      { status: 422 },
    );
  }

  const { data: existing, error: existingError } = await auth.context.supabase
    .from("platform_integrations")
    .select("public_config_json")
    .eq("provider", "asaas")
    .maybeSingle<PlatformIntegrationRead>();

  if (existingError) {
    logger.error("[Admin/Integrations] Failed to load existing asaas integration", {
      route,
      userId: auth.context.user.id,
      error: String(existingError),
    });
  }

  const now = new Date().toISOString();
  const existingConfig = toObject(existing?.public_config_json);
  const existingPix = toObject(existingConfig.pix);
  const existingConnectedAccount = toObject(existingConfig.connectedAccount);
  const existingValidation = toObject(existingConfig.validation);

  const publicConfig = {
    ...existingConfig,
    provider: "asaas",
    authMode: "api_key",
    pix: {
      ...existingPix,
      enabled: true,
      provider: "asaas",
      apiBaseUrl: "https://api.asaas.com/v3",
    },
    connectedAccount: {
      ...existingConnectedAccount,
      accountName: account.accountName,
      walletId: account.walletId,
      email: account.email,
      keySource: runtime.secretRef,
      connectedAt: now,
      connectedBy: auth.context.user.id,
    },
    validation: {
      ...existingValidation,
      myAccount: true,
      walletId: account.walletId,
      checkedAt: now,
    },
  } satisfies Record<string, unknown>;

  const payload: PlatformIntegrationWrite = {
    provider: "asaas",
    status: "active",
    public_config_json: publicConfig as Json,
    secret_ref: runtime.secretRef,
    last_validated_at: now,
    updated_by: auth.context.user.id,
  };

  const { data: updated, error: updateError } = await auth.context.supabase
    .from("platform_integrations")
    .upsert(payload, { onConflict: "provider" })
    .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    logger.error("[Admin/Integrations] Failed to persist asaas integration", {
      route,
      userId: auth.context.user.id,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to connect asaas integration" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "platform_integration_connected",
    resourceType: "platform_integration",
    resourceId: "asaas",
    diff: {
      provider: "asaas",
      status: updated.status,
      walletId: account.walletId,
    },
  });

  logger.info("[Admin/Integrations] Asaas integration connected", {
    route,
    userId: auth.context.user.id,
    walletId: account.walletId,
  });

  return NextResponse.json({ success: true, data: updated });
}
