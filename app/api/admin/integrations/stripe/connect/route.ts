import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/admin/http";
import { insertAdminAuditEvent } from "@/lib/admin/audit";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

const route = "/api/admin/integrations/stripe/connect";
const STRIPE_SECRET_KEY_REGEX = /^sk_(test|live)_[A-Za-z0-9]{10,}$/;

const connectStripeSchema = z
  .object({
    secretKey: z
      .string()
      .trim()
      .min(20, "secretKey is too short")
      .max(300, "secretKey is too long")
      .refine((value) => STRIPE_SECRET_KEY_REGEX.test(value), "Invalid Stripe secret key format")
      .optional(),
    useRuntime: z.boolean().optional(),
    connectClientId: z.string().trim().min(1).max(300).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.useRuntime && !value.secretKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secretKey"],
        message: "secretKey is required when useRuntime is not enabled",
      });
    }
  });

type StripeAccountDetails = {
  accountId: string;
  country: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

type PlatformIntegrationRead = {
  public_config_json: Json;
};

type PlatformIntegrationWrite = {
  provider: string;
  status: "active" | "draft";
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

function readRuntimeConnectClientId() {
  const primary = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
  if (primary) return primary;
  return process.env.STRIPE_CLIENT_ID?.trim() ?? "";
}

async function validateStripeSecretKey(secretKey: string): Promise<StripeAccountDetails> {
  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });

  const account = await stripe.accounts.retrieve();
  if (!account?.id) {
    throw new Error("stripe_accounts_retrieve_invalid: missing_account_id");
  }

  return {
    accountId: account.id,
    country: account.country ?? null,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
}

export async function POST(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    logger.warn("[Admin/Integrations] Unauthorized stripe connect attempt", { route });
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request, connectStripeSchema);
  if (!parsedBody.data) {
    return parsedBody.response;
  }

  const runtimeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!runtimeSecretKey) {
    return NextResponse.json(
      {
        error: "STRIPE_SECRET_KEY ausente no runtime. Configure o env antes de conectar.",
        code: "STRIPE_RUNTIME_SECRET_MISSING",
      },
      { status: 422 },
    );
  }

  const useRuntime = Boolean(parsedBody.data.useRuntime);
  const providedSecretKey = parsedBody.data.secretKey?.trim() ?? "";
  if (!useRuntime && runtimeSecretKey !== providedSecretKey) {
    return NextResponse.json(
      {
        error: "Secret key informada não corresponde ao STRIPE_SECRET_KEY do runtime.",
        code: "STRIPE_RUNTIME_SECRET_MISMATCH",
      },
      { status: 409 },
    );
  }
  const secretKeyForValidation = useRuntime ? runtimeSecretKey : providedSecretKey;

  const runtimeConnectClientId = readRuntimeConnectClientId();
  const providedConnectClientId = parsedBody.data.connectClientId?.trim() ?? "";
  if (runtimeConnectClientId && providedConnectClientId && runtimeConnectClientId !== providedConnectClientId) {
    return NextResponse.json(
      {
        error:
          "connectClientId informado não corresponde ao STRIPE_CONNECT_CLIENT_ID/STRIPE_CLIENT_ID do runtime.",
        code: "STRIPE_RUNTIME_CLIENT_ID_MISMATCH",
      },
      { status: 409 },
    );
  }

  const effectiveConnectClientId = providedConnectClientId || runtimeConnectClientId || null;

  let stripeAccount: StripeAccountDetails;
  try {
    stripeAccount = await validateStripeSecretKey(secretKeyForValidation);
  } catch (error) {
    logger.warn("[Admin/Integrations] Stripe secret validation failed", {
      route,
      userId: auth.context.user.id,
      error: trimError(error instanceof Error ? error.message : String(error)),
    });
    return NextResponse.json(
      {
        error: "Falha ao validar Stripe secret key (`accounts.retrieve`).",
        code: "STRIPE_VALIDATION_FAILED",
      },
      { status: 422 },
    );
  }

  const { data: existing, error: existingError } = await auth.context.supabase
    .from("platform_integrations")
    .select("public_config_json")
    .eq("provider", "stripe")
    .maybeSingle<PlatformIntegrationRead>();

  if (existingError) {
    logger.error("[Admin/Integrations] Failed to load existing stripe integration", {
      route,
      userId: auth.context.user.id,
      error: String(existingError),
    });
  }

  const now = new Date().toISOString();
  const existingConfig = toObject(existing?.public_config_json);
  const existingConnectedAccount = toObject(existingConfig.connectedAccount);
  const existingOauth = toObject(existingConfig.oauth);
  const existingPayments = toObject(existingConfig.payments);
  const existingValidation = toObject(existingConfig.validation);
  const oauthReady = Boolean(effectiveConnectClientId);
  const nextStatus: PlatformIntegrationWrite["status"] = oauthReady ? "active" : "draft";

  const publicConfig = {
    ...existingConfig,
    provider: "stripe",
    authMode: "oauth",
    connectedAccount: {
      ...existingConnectedAccount,
      accountId: stripeAccount.accountId,
      country: stripeAccount.country,
      chargesEnabled: stripeAccount.chargesEnabled,
      payoutsEnabled: stripeAccount.payoutsEnabled,
      detailsSubmitted: stripeAccount.detailsSubmitted,
      keySource: "env:STRIPE_SECRET_KEY",
      connectedAt: now,
      connectedBy: auth.context.user.id,
    },
    oauth: {
      ...existingOauth,
      authorizeUrl: "https://connect.stripe.com/oauth/authorize",
      tokenUrl: "https://connect.stripe.com/oauth/token",
      scope: "read_write",
      clientIdRef: "env:STRIPE_CONNECT_CLIENT_ID",
      connectClientId: effectiveConnectClientId,
      clientIdConfigured: oauthReady,
      ready: oauthReady,
    },
    payments: {
      ...existingPayments,
      card: true,
      pix: true,
    },
    validation: {
      ...existingValidation,
      accountsRetrieve: true,
      accountId: stripeAccount.accountId,
      country: stripeAccount.country,
      checkedAt: now,
    },
  } satisfies Record<string, unknown>;

  const payload: PlatformIntegrationWrite = {
    provider: "stripe",
    status: nextStatus,
    public_config_json: publicConfig as Json,
    secret_ref: "env:STRIPE_SECRET_KEY",
    last_validated_at: now,
    updated_by: auth.context.user.id,
  };

  const { data: updated, error: updateError } = await auth.context.supabase
    .from("platform_integrations")
    .upsert(payload, { onConflict: "provider" })
    .select("provider, status, public_config_json, last_validated_at, updated_by, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    logger.error("[Admin/Integrations] Failed to persist stripe integration", {
      route,
      userId: auth.context.user.id,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to connect stripe integration" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "platform_integration_connected",
    resourceType: "platform_integration",
    resourceId: "stripe",
    diff: {
      provider: "stripe",
      status: updated.status,
      accountId: stripeAccount.accountId,
      oauthReady,
    },
  });

  logger.info("[Admin/Integrations] Stripe integration connected", {
    route,
    userId: auth.context.user.id,
    status: updated.status,
    accountId: stripeAccount.accountId,
    oauthReady,
  });

  return NextResponse.json({ success: true, data: updated });
}
