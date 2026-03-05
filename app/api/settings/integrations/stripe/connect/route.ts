import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const appBaseUrl =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const refreshUrl = `${appBaseUrl}/dashboard/configuracoes/integracoes?stripe=refresh`;
  const returnUrl = `${appBaseUrl}/dashboard/configuracoes/integracoes?stripe=success`;

  try {
    let accountId = therapist.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: user.email,
        metadata: {
          therapist_id: therapist.id,
          created_by: user.id,
        },
      });
      accountId = account.id;

      await supabase
        .from("therapists")
        .update({ stripe_account_id: accountId })
        .eq("id", therapist.id);

      await supabase.from("audit_logs").insert({
        therapist_id: therapist.id,
        user_id: user.id,
        action: "update",
        table_name: "therapists",
        record_id: therapist.id,
        metadata: { updatedFields: ["stripe_account_id"], reason: "stripe_connect_create" },
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    if (account.details_submitted) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({
        success: true,
        data: {
          mode: "dashboard",
          accountId,
          url: loginLink.url,
        },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: "onboarding",
        accountId,
        url: accountLink.url,
      },
    });
  } catch (error) {
    logger.error("[Settings][Integrations] Stripe connect flow failed", {
      userId: user.id,
      therapistId: therapist.id,
      error: String(error),
    });

    return NextResponse.json(
      {
        error: "Falha ao iniciar integração com Stripe.",
        code: "INTEGRATION_STRIPE_CONNECT_FAILED",
      },
      { status: 500 },
    );
  }
}
