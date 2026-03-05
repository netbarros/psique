import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const constructWebhookEventMock = vi.fn();
const sendMessageMock = vi.fn();
const createCheckoutSessionMock = vi.fn();
const stripeRetrieveMock = vi.fn().mockResolvedValue({ status: "expired", url: null });
const createRoomMock = vi.fn();
const createMeetingTokenMock = vi.fn();
const sendBookingConfirmationMock = vi.fn();
const chatWithContextMock = vi.fn().mockResolvedValue("ok");

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  constructWebhookEvent: constructWebhookEventMock,
  createCheckoutSession: createCheckoutSessionMock,
  stripe: {
    checkout: {
      sessions: {
        retrieve: stripeRetrieveMock,
      },
    },
  },
}));

vi.mock("@/lib/daily", () => ({
  createRoom: createRoomMock,
  createMeetingToken: createMeetingTokenMock,
}));

vi.mock("@/lib/resend", () => ({
  sendBookingConfirmation: sendBookingConfirmationMock,
}));

vi.mock("@/lib/openrouter", () => ({
  chatWithContext: chatWithContextMock,
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: sendMessageMock,
  inlineKeyboard: vi.fn().mockReturnValue({ inline_keyboard: [] }),
  answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Telegram and Stripe webhooks behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    constructWebhookEventMock.mockReset();
    sendMessageMock.mockReset();
    createCheckoutSessionMock.mockReset();
    stripeRetrieveMock.mockReset();
    stripeRetrieveMock.mockResolvedValue({ status: "expired", url: null });
    createRoomMock.mockReset();
    createMeetingTokenMock.mockReset();
    sendBookingConfirmationMock.mockReset();
    chatWithContextMock.mockReset();
    chatWithContextMock.mockResolvedValue("ok");
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-secret";
  });

  function telegramHeaders() {
    return {
      "x-telegram-bot-api-secret-token": "telegram-secret",
      "content-type": "application/json",
    };
  }

  function telegramMessageBody(updateId: number, text: string) {
    return {
      update_id: updateId,
      message: {
        message_id: 1,
        from: { id: 123, first_name: "A" },
        chat: { id: 123, type: "private" },
        text,
        date: 1,
      },
    };
  }

  function telegramCallbackBody(updateId: number, data: string) {
    return {
      update_id: updateId,
      callback_query: {
        id: `cq-${updateId}`,
        from: { id: 123, first_name: "A" },
        message: {
          message_id: 1,
          chat: { id: 123, type: "private" },
          date: 1,
        },
        data,
      },
    };
  }

  describe("POST /api/telegram/webhook", () => {
    it("returns 403 with invalid secret token", async () => {
      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: {
            "x-telegram-bot-api-secret-token": "wrong-secret",
          },
          body: JSON.stringify({ update_id: 1 }),
        }) as never
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 for malformed json", async () => {
      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: {
            "x-telegram-bot-api-secret-token": "telegram-secret",
          },
          body: "{bad-json",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 and skips duplicate update_id (idempotency)", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { update_id: 10 }, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: {
            "x-telegram-bot-api-secret-token": "telegram-secret",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            update_id: 10,
            message: {
              message_id: 1,
              from: { id: 123, first_name: "A" },
              chat: { id: 123, type: "private" },
              text: "/ajuda",
              date: 1,
            },
          }),
        }) as never
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it("returns 200 on happy path", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: {
            "x-telegram-bot-api-secret-token": "telegram-secret",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            update_id: 11,
            message: {
              message_id: 1,
              from: { id: 123, first_name: "A" },
              chat: { id: 123, type: "private" },
              text: "/ajuda",
              date: 1,
            },
          }),
        }) as never
      );

      expect(res.status).toBe(200);
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles /start command", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: "patient-1", name: "Paciente A" }, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramMessageBody(12, "/start")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles /sessoes when patient is not linked", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramMessageBody(13, "/sessoes")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles /sessoes with upcoming appointments", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: "patient-1", name: "Paciente A" }, error: null }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                  data: [{ scheduled_at: "2026-03-05T15:00:00.000Z", status: "confirmed", type: "online" }],
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramMessageBody(14, "/sessoes")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles /falar with query", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramMessageBody(15, "/falar Como dormir melhor?")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(chatWithContextMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles callback nps scoring", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "sessions") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramCallbackBody(16, "nps_5_session-1")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it("handles callback book_slot when already paid", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "appointment-1",
                    scheduled_at: "2026-03-05T15:00:00.000Z",
                    payment_status: "paid",
                    price_charged: 220,
                    stripe_session_id: null,
                    patient: { name: "Paciente", email: "paciente@example.com" },
                    therapist: { name: "Dra", slug: "dra", session_price: 220 },
                  },
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramCallbackBody(17, "book_slot_appointment-1")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    });

    it("handles callback book_slot generating checkout link", async () => {
      createCheckoutSessionMock.mockResolvedValue({
        id: "cs_1",
        url: "https://stripe.checkout/cs_1",
      });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "telegram_updates") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "appointment-2",
                    scheduled_at: "2026-03-05T15:00:00.000Z",
                    payment_status: "pending",
                    price_charged: 220,
                    stripe_session_id: null,
                    patient: { name: "Paciente", email: "paciente@example.com" },
                    therapist: { name: "Dra", slug: "dra", session_price: 220 },
                  },
                  error: null,
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/telegram/webhook/route");
      const res = await POST(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: telegramHeaders(),
          body: JSON.stringify(telegramCallbackBody(18, "book_slot_appointment-2")),
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(createCheckoutSessionMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalled();
    });
  });

  describe("POST /api/webhooks/stripe", () => {
    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    });

    it("returns 400 when stripe signature is missing", async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when signature verification fails", async () => {
      constructWebhookEventMock.mockImplementation(() => {
        throw new Error("invalid signature");
      });
      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 and marks duplicate processed event as idempotent", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_1",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_1", last_payment_error: { message: "declined" } } },
      });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: { code: "23505" } }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { status: "processed" }, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.duplicate).toBe(true);
    });

    it("returns 200 when event is already in progress", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_in_progress",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_3", last_payment_error: { message: "declined" } } },
      });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: { code: "23505" } }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { status: "processing" }, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.inProgress).toBe(true);
    });

    it("returns 200 for checkout.completed without appointmentId metadata", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_checkout_missing_metadata",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_1",
            metadata: {},
            payment_intent: "pi_1",
            amount_total: 22000,
            currency: "brl",
          },
        },
      });

      const updateEq2 = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              update: vi.fn().mockReturnValue({ eq: updateEq1 }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never,
      );
      expect(res.status).toBe(200);
    });

    it("returns 200 for checkout.completed when appointment is not found", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_checkout_not_found",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_2",
            metadata: { appointmentId: "appointment-not-found" },
            payment_intent: "pi_2",
            amount_total: 22000,
            currency: "brl",
          },
        },
      });

      const updateEq2 = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              update: vi.fn().mockReturnValue({ eq: updateEq1 }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never,
      );
      expect(res.status).toBe(200);
    });

    it("processes checkout.completed happy path with side effects", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_checkout_happy",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_3",
            metadata: { appointmentId: "appointment-1" },
            payment_intent: "pi_3",
            amount_total: 22000,
            currency: "brl",
          },
        },
      });
      createRoomMock.mockResolvedValue({
        id: "room-1",
        name: "room-name",
        url: "https://daily.co/room-1",
      });
      createMeetingTokenMock.mockResolvedValue("token-1");
      sendBookingConfirmationMock.mockResolvedValue(undefined);
      sendMessageMock.mockResolvedValue(undefined);

      const lockUpdateEq2 = vi.fn().mockResolvedValue({ data: null, error: null });
      const lockUpdateEq1 = vi.fn().mockReturnValue({ eq: lockUpdateEq2 });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              update: vi.fn().mockReturnValue({ eq: lockUpdateEq1 }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "appointment-1",
                    therapist_id: "therapist-1",
                    patient_id: "patient-1",
                    status: "pending",
                    payment_status: "pending",
                    scheduled_at: "2026-03-05T15:00:00.000Z",
                    video_room_id: null,
                    video_room_url: null,
                    patient: { name: "Paciente", email: "paciente@example.com", telegram_chat_id: 123 },
                    therapist: { name: "Dra" },
                  },
                  error: null,
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === "payments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never,
      );
      expect(res.status).toBe(200);
      expect(createRoomMock).toHaveBeenCalled();
      expect(sendBookingConfirmationMock).toHaveBeenCalled();
    });

    it("returns 200 on happy path for payment failure event", async () => {
      constructWebhookEventMock.mockReturnValue({
        id: "evt_2",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_2", last_payment_error: { message: "declined" } } },
      });

      const updateEq2 = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "webhook_event_locks") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
              update: vi.fn().mockReturnValue({ eq: updateEq1 }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": "sig" },
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });
});
