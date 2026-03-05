import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const sendMessageMock = vi.fn();
const answerCallbackQueryMock = vi.fn();
const inlineKeyboardMock = vi.fn().mockReturnValue({ inline_keyboard: [] });
const createCheckoutSessionMock = vi.fn();
const stripeRetrieveMock = vi.fn();
const chatWithContextMock = vi.fn().mockResolvedValue("resposta");

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: sendMessageMock,
  inlineKeyboard: inlineKeyboardMock,
  answerCallbackQuery: answerCallbackQueryMock,
}));

vi.mock("@/lib/stripe", () => ({
  createCheckoutSession: createCheckoutSessionMock,
  stripe: {
    checkout: {
      sessions: {
        retrieve: stripeRetrieveMock,
      },
    },
  },
}));

vi.mock("@/lib/openrouter", () => ({
  chatWithContext: chatWithContextMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type TableHandler = unknown | (() => unknown) | Array<unknown | (() => unknown)>;

function resolveHandler(handler: TableHandler): unknown {
  if (Array.isArray(handler)) {
    const next = handler.shift();
    if (!next) {
      throw new Error("Missing queued table handler");
    }
    return typeof next === "function" ? (next as () => unknown)() : next;
  }
  return typeof handler === "function" ? (handler as () => unknown)() : handler;
}

function adminClientForTables(handlers: Record<string, TableHandler>) {
  return {
    from: vi.fn((table: string) => {
      const handler = handlers[table];
      if (!handler) {
        throw new Error(`Unexpected table ${table}`);
      }
      return resolveHandler(handler);
    }),
  };
}

function telegramUpdatesTable(existing: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existing, error: null }),
    }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

function patientsByTelegramTable(patient: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: patient, error: null }),
    }),
  };
}

function appointmentsForSessoesTable(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }),
  };
}

function appointmentsForPendingPaymentsTable(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }),
  };
}

function appointmentByIdTable(appointment: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: appointment, error }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
}

function telegramHeaders(extra: Record<string, string> = {}) {
  return {
    "x-telegram-bot-api-secret-token": "telegram-secret",
    "content-type": "application/json",
    ...extra,
  };
}

function messageBody(updateId: number, text: string, withFrom = true) {
  return {
    update_id: updateId,
    message: {
      message_id: 1,
      ...(withFrom ? { from: { id: 123, first_name: "A" } } : {}),
      chat: { id: 123, type: "private" },
      text,
      date: 1,
    },
  };
}

function callbackBody(updateId: number, data: string) {
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

describe("POST /api/telegram/webhook branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    sendMessageMock.mockReset();
    answerCallbackQueryMock.mockReset();
    inlineKeyboardMock.mockClear();
    createCheckoutSessionMock.mockReset();
    stripeRetrieveMock.mockReset();
    chatWithContextMock.mockReset();
    chatWithContextMock.mockResolvedValue("resposta");
    stripeRetrieveMock.mockResolvedValue({ status: "expired", url: null });
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-secret";
  });

  it("ignores message without sender metadata", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(100, "/ajuda", false)),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("handles /agendar and /cancelar command flows", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: [patientsByTelegramTable(null), patientsByTelegramTable(null)],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const agendar = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(101, "/agendar")),
      }) as never,
    );
    const cancelar = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(102, "/cancelar")),
      }) as never,
    );

    expect(agendar.status).toBe(200);
    expect(cancelar.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("handles /pagar for not linked patient and for no pending sessions", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: [patientsByTelegramTable(null), patientsByTelegramTable({ id: "patient-1", name: "Pat" })],
        appointments: [appointmentsForPendingPaymentsTable([])],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const notLinked = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(103, "/pagar")),
      }) as never,
    );

    const noPending = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(104, "/pagar")),
      }) as never,
    );

    expect(notLinked.status).toBe(200);
    expect(noPending.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("handles /pagar with pending sessions message", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: patientsByTelegramTable({ id: "patient-1", name: "Pat" }),
        appointments: appointmentsForPendingPaymentsTable([
          { id: "appt-1", scheduled_at: "2026-03-05T15:00:00.000Z", price_charged: 220 },
        ]),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(105, "/pagar")),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("handles /falar without query and fallback on AI provider failure", async () => {
    chatWithContextMock.mockRejectedValueOnce(new Error("openrouter down"));
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: [patientsByTelegramTable(null), patientsByTelegramTable(null)],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const withoutQuery = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(106, "/falar")),
      }) as never,
    );

    const providerFailure = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(107, "/falar Como eu durmo melhor?")),
      }) as never,
    );

    expect(withoutQuery.status).toBe(200);
    expect(providerFailure.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("routes free text intent to cancelar handler", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: patientsByTelegramTable(null),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(108, "quero cancelar minha sessão")),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("handles callback book_slot when appointment is missing", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        appointments: appointmentByIdTable(null, { message: "not found" }),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(109, "book_slot_appt-404")),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(answerCallbackQueryMock).toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("handles callback book_slot with missing patient email and invalid amount", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        appointments: [
          appointmentByIdTable({
            id: "appt-no-email",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 220,
            stripe_session_id: null,
            patient: { name: "Paciente", email: null },
            therapist: { name: "Dra", slug: "dra", session_price: 220 },
          }),
          appointmentByIdTable({
            id: "appt-invalid-amount",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 0,
            stripe_session_id: null,
            patient: { name: "Paciente", email: "p@example.com" },
            therapist: { name: "Dra", slug: "dra", session_price: 0 },
          }),
        ],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const noEmail = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(110, "book_slot_appt-no-email")),
      }) as never,
    );

    const invalidAmount = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(111, "book_slot_appt-invalid-amount")),
      }) as never,
    );

    expect(noEmail.status).toBe(200);
    expect(invalidAmount.status).toBe(200);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("reuses existing checkout URL without creating a new checkout", async () => {
    stripeRetrieveMock.mockResolvedValue({
      status: "open",
      url: "https://stripe.test/reusable",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        appointments: appointmentByIdTable({
          id: "appt-reusable",
          scheduled_at: "2026-03-05T15:00:00.000Z",
          payment_status: "pending",
          price_charged: 220,
          stripe_session_id: "cs_existing",
          patient: { name: "Paciente", email: "p@example.com" },
          therapist: { name: "Dra", slug: "dra", session_price: 220 },
        }),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(112, "book_slot_appt-reusable")),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("creates a new checkout when stripe retrieve fails", async () => {
    stripeRetrieveMock.mockRejectedValueOnce(new Error("stripe temporary error"));
    createCheckoutSessionMock.mockResolvedValueOnce({
      id: "cs_new_ok",
      url: "https://stripe.test/cs_new_ok",
    });

    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        appointments: [
          appointmentByIdTable({
            id: "appt-recover-checkout",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 220,
            stripe_session_id: "cs_old",
            patient: { name: "Paciente", email: "p@example.com" },
            therapist: { name: "Dra", slug: "dra", session_price: 220 },
          }),
          appointmentByIdTable({
            id: "appt-recover-checkout",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 220,
            stripe_session_id: "cs_old",
            patient: { name: "Paciente", email: "p@example.com" },
            therapist: { name: "Dra", slug: "dra", session_price: 220 },
          }),
        ],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const recovered = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(113, "book_slot_appt-recover-checkout")),
      }) as never,
    );

    expect(recovered.status).toBe(200);
    expect(createCheckoutSessionMock).toHaveBeenCalledTimes(1);
  });

  it("handles callback checkout generation when provider returns no URL", async () => {
    createCheckoutSessionMock.mockResolvedValueOnce({ id: "cs_new_no_url", url: null });

    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        appointments: [
          appointmentByIdTable({
            id: "appt-no-url",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 220,
            stripe_session_id: null,
            patient: { name: "Paciente", email: "p@example.com" },
            therapist: { name: "Dra", slug: "dra", session_price: 220 },
          }),
          appointmentByIdTable({
            id: "appt-no-url",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            payment_status: "pending",
            price_charged: 220,
            stripe_session_id: null,
            patient: { name: "Paciente", email: "p@example.com" },
            therapist: { name: "Dra", slug: "dra", session_price: 220 },
          }),
        ],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const noUrl = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(114, "book_slot_appt-no-url")),
      }) as never,
    );

    expect(noUrl.status).toBe(200);
    expect(createCheckoutSessionMock).toHaveBeenCalledTimes(1);
  });

  it("returns 200 for callback payload with unsupported callback data", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(callbackBody(115, "noop_callback")),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(answerCallbackQueryMock).toHaveBeenCalled();
  });

  it("processes /sessoes empty and populated queues", async () => {
    createAdminClientMock.mockReturnValue(
      adminClientForTables({
        telegram_updates: () => telegramUpdatesTable(),
        patients: [
          patientsByTelegramTable({ id: "patient-1", name: "Paciente" }),
          patientsByTelegramTable({ id: "patient-1", name: "Paciente" }),
        ],
        appointments: [
          appointmentsForSessoesTable([]),
          appointmentsForSessoesTable([
            { scheduled_at: "2026-03-05T15:00:00.000Z", status: "confirmed", type: "online" },
          ]),
        ],
      }),
    );

    const { POST } = await import("@/app/api/telegram/webhook/route");

    const emptyQueue = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(116, "/sessoes")),
      }) as never,
    );

    const populatedQueue = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: telegramHeaders(),
        body: JSON.stringify(messageBody(117, "/sessoes")),
      }) as never,
    );

    expect(emptyQueue.status).toBe(200);
    expect(populatedQueue.status).toBe(200);
    expect(sendMessageMock).toHaveBeenCalled();
  });
});
