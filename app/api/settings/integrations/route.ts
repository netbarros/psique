import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

const patchSchema = z
  .object({
    openRouterKey: z.string().trim().min(1).max(500).nullable().optional(),
    telegramToken: z.string().trim().min(1).max(500).nullable().optional(),
    stripeAccountId: z.string().trim().min(1).max(255).nullable().optional(),
    aiModel: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

type TelegramGetMePayload = {
  ok?: boolean;
  result?: {
    username?: string;
  };
};

function normalizeNullableString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const openRouterKey = normalizeNullableString(parsed.data.openRouterKey);
  const telegramToken = normalizeNullableString(parsed.data.telegramToken);
  const stripeAccountId = normalizeNullableString(parsed.data.stripeAccountId);

  if (openRouterKey) {
    try {
      const openRouterRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { Authorization: `Bearer ${openRouterKey}` },
      });
      if (!openRouterRes.ok) {
        return NextResponse.json(
          {
            error: "A chave do OpenRouter é inválida ou expirou.",
            code: "INTEGRATION_OPENROUTER_INVALID",
          },
          { status: 400 },
        );
      }
    } catch (error) {
      logger.error("[Settings][Integrations] OpenRouter validation failed", {
        userId: user.id,
        error: String(error),
      });
      return NextResponse.json(
        {
          error: "Não foi possível validar OpenRouter no momento.",
          code: "INTEGRATION_OPENROUTER_UNAVAILABLE",
        },
        { status: 502 },
      );
    }
  }

  let telegramUsername: string | null | undefined;
  if (telegramToken !== undefined) {
    if (!telegramToken) {
      telegramUsername = null;
    } else {
      try {
        const telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const telegramJson = (await telegramRes.json().catch(() => ({}))) as TelegramGetMePayload;
        if (!telegramRes.ok || !telegramJson.ok) {
          return NextResponse.json(
            {
              error: "O token do Telegram é inválido.",
              code: "INTEGRATION_TELEGRAM_INVALID",
            },
            { status: 400 },
          );
        }
        telegramUsername = telegramJson.result?.username ?? null;
      } catch (error) {
        logger.error("[Settings][Integrations] Telegram validation failed", {
          userId: user.id,
          error: String(error),
        });
        return NextResponse.json(
          {
            error: "Não foi possível validar Telegram no momento.",
            code: "INTEGRATION_TELEGRAM_UNAVAILABLE",
          },
          { status: 502 },
        );
      }
    }
  }

  if (stripeAccountId !== undefined && stripeAccountId !== null) {
    if (!/^acct_[A-Za-z0-9]+$/.test(stripeAccountId)) {
      return NextResponse.json(
        {
          error: "Formato de conta Stripe inválido. Use um ID iniciado por acct_.",
          code: "INTEGRATION_STRIPE_INVALID",
        },
        { status: 400 },
      );
    }

    try {
      await stripe.accounts.retrieve(stripeAccountId);
    } catch (error) {
      logger.warn("[Settings][Integrations] Stripe account validation failed", {
        userId: user.id,
        stripeAccountId,
        error: String(error),
      });
      return NextResponse.json(
        {
          error: "Conta Stripe não encontrada ou inacessível.",
          code: "INTEGRATION_STRIPE_INVALID",
        },
        { status: 400 },
      );
    }
  }

  const payload: Record<string, unknown> = {};
  if (openRouterKey !== undefined) payload.openrouter_key_hash = openRouterKey;
  if (telegramToken !== undefined) payload.telegram_bot_token = telegramToken;
  if (telegramUsername !== undefined) payload.telegram_bot_username = telegramUsername;
  if (stripeAccountId !== undefined) payload.stripe_account_id = stripeAccountId;
  if (parsed.data.aiModel !== undefined) payload.ai_model = parsed.data.aiModel;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("therapists")
    .update(payload)
    .eq("id", therapist.id)
    .select("id, ai_model, openrouter_key_hash, telegram_bot_token, telegram_bot_username, stripe_account_id")
    .single();

  if (updateError || !updated) {
    logger.error("[Settings][Integrations] Failed to update therapist integrations", {
      userId: user.id,
      therapistId: therapist.id,
      error: String(updateError),
    });
    return NextResponse.json({ error: "Failed to update integrations" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    therapist_id: therapist.id,
    user_id: user.id,
    action: "update",
    table_name: "therapists",
    record_id: therapist.id,
    metadata: { updatedFields: Object.keys(payload) },
  });

  return NextResponse.json({
    success: true,
    data: {
      aiModel: updated.ai_model,
      openRouterConnected: Boolean(updated.openrouter_key_hash),
      telegramConnected: Boolean(updated.telegram_bot_token),
      telegramBotUsername: updated.telegram_bot_username,
      stripeConnected: Boolean(updated.stripe_account_id),
      stripeAccountId: updated.stripe_account_id,
    },
  });
}
