import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  cancelSubscription,
} from "@/lib/stripe";
import { logger } from "@/lib/logger";

/**
 * POST — Create a subscription checkout session (session pack)
 * DELETE — Cancel an active subscription
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    therapistId: string;
    patientEmail: string;
    patientName: string;
    sessionsPerMonth: number;
  };

  if (
    !body.therapistId ||
    !body.patientEmail ||
    !body.patientName ||
    !body.sessionsPerMonth
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Verify therapist
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, name, session_price, slug")
      .eq("id", body.therapistId)
      .eq("active", true)
      .single();

    if (!therapist) {
      return NextResponse.json(
        { error: "Terapeuta não encontrado" },
        { status: 404 }
      );
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await createSubscriptionCheckout({
      therapistId: therapist.id,
      therapistName: therapist.name,
      patientEmail: body.patientEmail,
      patientName: body.patientName,
      sessionsPerMonth: body.sessionsPerMonth,
      pricePerSession: Number(therapist.session_price),
      successUrl: `${origin}/dashboard/financeiro?subscription=success`,
      cancelUrl: `${origin}/dashboard/financeiro?subscription=cancelled`,
    });

    logger.info("[Subscription] Checkout created", {
      therapistId: therapist.id,
      sessions: body.sessionsPerMonth,
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: session.url },
    });
  } catch (error) {
    logger.error("[Subscription] Create error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro ao criar assinatura" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { subscriptionId: string };

  if (!body.subscriptionId) {
    return NextResponse.json(
      { error: "subscriptionId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await cancelSubscription(body.subscriptionId);

    logger.info("[Subscription] Cancelled", {
      subscriptionId: body.subscriptionId,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      data: { status: result.status },
    });
  } catch (error) {
    logger.error("[Subscription] Cancel error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}
