import Stripe from "stripe";
import { logger } from "@/lib/logger";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ?? "sk_test_000000000000000000000000";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "test") {
  logger.warn("[Stripe] STRIPE_SECRET_KEY is missing. Stripe calls will fail at runtime.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export async function createCheckoutSession(params: {
  appointmentId: string;
  therapistName: string;
  patientEmail: string;
  patientName: string;
  amount: number; // in BRL cents
  scheduledAt: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  logger.info("[Stripe] Creating checkout session", {
    appointmentId: params.appointmentId,
  });

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.patientEmail,
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: params.amount,
          product_data: {
            name: `Consulta com ${params.therapistName}`,
            description: `Sessão agendada para ${new Date(params.scheduledAt).toLocaleDateString("pt-BR")}`,
            images: [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: params.appointmentId,
      patientName: params.patientName,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  });
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("[PSIQUE] Missing STRIPE_WEBHOOK_SECRET");

  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function createRefund(params: {
  paymentIntentId: string;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<Stripe.Refund> {
  logger.info("[Stripe] Creating refund", {
    paymentIntentId: params.paymentIntentId,
  });

  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    reason: params.reason ?? "requested_by_customer",
  });
}

// ── Subscriptions (Session Packs) ──────────────────────────────────

export async function createSubscriptionCheckout(params: {
  therapistId: string;
  therapistName: string;
  patientEmail: string;
  patientName: string;
  sessionsPerMonth: number;
  pricePerSession: number; // BRL (not cents)
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const totalMonthly = Math.round(params.pricePerSession * params.sessionsPerMonth * 100);

  logger.info("[Stripe] Creating subscription checkout", {
    therapistId: params.therapistId,
    sessions: params.sessionsPerMonth,
  });

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: params.patientEmail,
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: totalMonthly,
          recurring: { interval: "month" },
          product_data: {
            name: `Pacote ${params.sessionsPerMonth}x sessões — ${params.therapistName}`,
            description: `${params.sessionsPerMonth} sessões mensais com ${params.therapistName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      therapistId: params.therapistId,
      patientName: params.patientName,
      sessionsPerMonth: String(params.sessionsPerMonth),
      type: "subscription",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  logger.info("[Stripe] Cancelling subscription", { subscriptionId });

  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

