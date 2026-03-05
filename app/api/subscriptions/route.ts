import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  cancelSubscription,
} from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

const postSchema = z.object({
  therapistId: z.string().uuid(),
  patientEmail: z.string().email(),
  patientName: z.string().trim().min(1).max(200),
  sessionsPerMonth: z.number().int().min(1).max(31),
});

const deleteSchema = z.object({
  subscriptionId: z.string().trim().min(1),
});

/**
 * POST — Create a subscription checkout session (session pack)
 * DELETE — Cancel an active subscription
 */

export async function POST(req: NextRequest) {
  const route = "/api/subscriptions";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[Subscription] Unauthorized request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request: req,
    schema: postSchema,
    context: { userId: user.id },
  });
  if (!parsed.ok) {
    return parsed.response;
  }
  const body = parsed.data;

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
      route,
      requestId: parsed.requestId,
      therapistId: therapist.id,
      sessions: body.sessionsPerMonth,
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: session.url },
    });
  } catch (error) {
    logger.error("[Subscription] Create error", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "Erro ao criar assinatura" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const route = "/api/subscriptions";
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("[Subscription] Unauthorized cancel request", { route });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request: req,
    schema: deleteSchema,
    context: { userId: user.id },
  });
  if (!parsed.ok) {
    return parsed.response;
  }
  const body = parsed.data;

  try {
    const result = await cancelSubscription(body.subscriptionId);

    logger.info("[Subscription] Cancelled", {
      route,
      requestId: parsed.requestId,
      subscriptionId: body.subscriptionId,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      data: { status: result.status },
    });
  } catch (error) {
    logger.error("[Subscription] Cancel error", {
      route,
      requestId: parsed.requestId,
      userId: user.id,
      error: String(error),
    });
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}
