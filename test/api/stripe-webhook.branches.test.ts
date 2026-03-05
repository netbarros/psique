import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const constructWebhookEventMock = vi.fn();
const createRoomMock = vi.fn();
const createMeetingTokenMock = vi.fn();
const sendBookingConfirmationMock = vi.fn();
const sendMessageMock = vi.fn();
const loggerInfoMock = vi.fn();
const loggerWarnMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  constructWebhookEvent: constructWebhookEventMock,
}));

vi.mock("@/lib/daily", () => ({
  createRoom: createRoomMock,
  createMeetingToken: createMeetingTokenMock,
}));

vi.mock("@/lib/resend", () => ({
  sendBookingConfirmation: sendBookingConfirmationMock,
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: sendMessageMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfoMock,
    warn: loggerWarnMock,
    error: loggerErrorMock,
  },
}));

function lockUpdateChain() {
  const chain: { eq: ReturnType<typeof vi.fn> } = {
    eq: vi.fn(),
  };
  chain.eq.mockReturnValue(chain);
  return chain;
}

function lockReclaimChain(updated: unknown) {
  const chain: {
    eq: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    select: vi.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({ data: updated, error: null }),
  });
  return chain;
}

function lockTable(options: {
  insertError?: unknown;
  lockRow?: unknown;
  reclaimUpdated?: unknown;
  reclaimEnabled?: boolean;
} = {}) {
  let updateCall = 0;
  return {
    insert: vi.fn().mockResolvedValue({ error: options.insertError ?? null }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: options.lockRow ?? null, error: null }),
    }),
    update: vi.fn().mockImplementation(() => {
      updateCall += 1;
      if (options.reclaimEnabled && updateCall === 1) {
        return lockReclaimChain(options.reclaimUpdated ?? null);
      }
      return lockUpdateChain();
    }),
  };
}

describe("POST /api/webhooks/stripe branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    constructWebhookEventMock.mockReset();
    createRoomMock.mockReset();
    createMeetingTokenMock.mockReset();
    sendBookingConfirmationMock.mockReset();
    sendMessageMock.mockReset();
    loggerInfoMock.mockReset();
    loggerWarnMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it("returns 500 when webhook lock insert fails with non-unique error", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-lock-error",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_1", last_payment_error: { message: "declined" } } },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "webhook_event_locks") {
          throw new Error(`Unexpected table ${table}`);
        }
        return lockTable({ insertError: { code: "XX001", message: "db down" } });
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

    expect(res.status).toBe(500);
  });

  it("reclaims a failed lock and processes payment_failed event", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-reclaim",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_2", last_payment_error: { message: "declined" } } },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "webhook_event_locks") {
          throw new Error(`Unexpected table ${table}`);
        }
        return lockTable({
          insertError: { code: "23505" },
          lockRow: { status: "failed" },
          reclaimEnabled: true,
          reclaimUpdated: { event_id: "evt-reclaim" },
        });
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
    expect(json.received).toBe(true);
  });

  it("returns inProgress when failed lock cannot be reclaimed", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-reclaim-miss",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_3", last_payment_error: { message: "declined" } } },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "webhook_event_locks") {
          throw new Error(`Unexpected table ${table}`);
        }
        return lockTable({
          insertError: { code: "23505" },
          lockRow: { status: "failed" },
          reclaimEnabled: true,
          reclaimUpdated: null,
        });
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

  it("returns 200 when checkout payload is invalid for schema", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-invalid-payload",
      type: "checkout.session.completed",
      data: { object: { metadata: { appointmentId: "appointment-1" } } },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "webhook_event_locks") {
          throw new Error(`Unexpected table ${table}`);
        }
        return lockTable();
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

  it("keeps side effects idempotent when appointment was already paid", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-paid-idempotent",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: { appointmentId: "appointment-1" },
          payment_intent: { id: "pi_paid" },
          amount_total: 22000,
          currency: "brl",
        },
      },
    });

    const appointmentsTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "appointment-1",
            therapist_id: "therapist-1",
            patient_id: "patient-1",
            status: "confirmed",
            payment_status: "paid",
            scheduled_at: "2026-03-05T15:00:00.000Z",
            video_room_id: "room-1",
            video_room_url: "https://daily.test/room-1",
            patient: { name: "Paciente", email: "p@example.com", telegram_chat_id: 999 },
            therapist: { name: "Dra" },
          },
          error: null,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    const paymentsTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "payment-existing" }, error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "webhook_event_locks") return lockTable();
        if (table === "appointments") return appointmentsTable;
        if (table === "payments") return paymentsTable;
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
    expect(createRoomMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("returns 500 when payment insert fails with non-unique error", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-payment-error",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          metadata: { appointmentId: "appointment-2" },
          payment_intent: "pi_error",
          amount_total: 18000,
          currency: "brl",
        },
      },
    });

    const appointmentsTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "appointment-2",
            therapist_id: "therapist-2",
            patient_id: "patient-2",
            status: "pending",
            payment_status: "pending",
            scheduled_at: "2026-03-05T16:00:00.000Z",
            video_room_id: "room-2",
            video_room_url: "https://daily.test/room-2",
            patient: { name: "Paciente", email: "p2@example.com", telegram_chat_id: null },
            therapist: { name: "Dra 2" },
          },
          error: null,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    const paymentsTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "XX001", message: "insert failed" },
      }),
    };

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "webhook_event_locks") return lockTable();
        if (table === "appointments") return appointmentsTable;
        if (table === "payments") return paymentsTable;
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

    expect(res.status).toBe(500);
  });

  it("returns 200 for unhandled event types", async () => {
    constructWebhookEventMock.mockReturnValue({
      id: "evt-unhandled",
      type: "customer.created",
      data: { object: { id: "cus_1" } },
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "webhook_event_locks") {
          throw new Error(`Unexpected table ${table}`);
        }
        return lockTable();
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
});
