import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const createRefundMock = vi.fn();
const sendEmailMock = vi.fn();
const sendMessageMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  createRefund: createRefundMock,
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: sendMessageMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function authClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  };
}

describe("Appointments actions behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    createRefundMock.mockReset();
    sendEmailMock.mockReset();
    sendMessageMock.mockReset();
  });

  describe("POST /api/appointments/[id]/cancel", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");

      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: "{}",
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );

      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));
      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");

      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: "{bad-json",
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );

      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));
      sendEmailMock.mockResolvedValue(undefined);
      sendMessageMock.mockResolvedValue(undefined);

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "pending",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            payment_status: "pending",
            stripe_payment_id: null,
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
              telegram_chat_id: 123,
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              cancellation_policy_hours: 24,
            },
          },
          error: null,
        }),
      };

      const adminClient = {
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue(appointmentsSelectQuery),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
      createAdminClientMock.mockReturnValue(adminClient);

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");

      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "Conflito de agenda" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );

      expect(res.status).toBe(200);
      expect(createRefundMock).not.toHaveBeenCalled();
    });

    it("returns 400 when appointment already cancelled", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "cancelled",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              cancellation_policy_hours: 24,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue(appointmentsSelectQuery),
        })),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");

      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "x" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );

      expect(res.status).toBe(400);
    });

    it("returns 404 when appointment is not found", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "not found" },
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue(appointmentsSelectQuery),
        })),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");
      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "x" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-404" }) },
      );

      expect(res.status).toBe(404);
    });

    it("returns 403 when user is neither therapist nor patient", async () => {
      createClientMock.mockResolvedValue(authClient("other-user"));

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "pending",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            payment_status: "pending",
            stripe_payment_id: null,
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
              telegram_chat_id: null,
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              cancellation_policy_hours: 24,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue(appointmentsSelectQuery),
        })),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");
      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "x" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(403);
    });

    it("returns 400 when appointment is already completed", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "completed",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            payment_status: "paid",
            stripe_payment_id: "pi_completed",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
              telegram_chat_id: null,
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              cancellation_policy_hours: 24,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue(appointmentsSelectQuery),
        })),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");
      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "x" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(400);
    });

    it("processes refund flow when paid appointment is cancelled within policy", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));
      createRefundMock.mockResolvedValue(undefined);
      sendEmailMock.mockResolvedValue(undefined);
      sendMessageMock.mockResolvedValue(undefined);

      const appointmentsSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-paid",
            status: "pending",
            scheduled_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            payment_status: "paid",
            stripe_payment_id: "pi_paid",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
              telegram_chat_id: 123,
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              cancellation_policy_hours: 24,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue(appointmentsSelectQuery),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");
      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "Cancelamento com reembolso" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-paid" }) },
      );

      expect(res.status).toBe(200);
      expect(createRefundMock).toHaveBeenCalled();
      const json = await res.json();
      expect(json.data.refunded).toBe(true);
    });

    it("returns 500 on unexpected cancellation error", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => {
          throw new Error("db unavailable");
        }),
      });

      const { POST } = await import("@/app/api/appointments/[id]/cancel/route");
      const res = await POST(
        new Request("http://localhost/api/appointments/id/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "x" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(500);
    });
  });

  describe("PUT /api/appointments/[id]/reschedule", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: "{}",
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));
      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: "{bad-json",
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));
      sendEmailMock.mockResolvedValue(undefined);

      const firstSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "pending",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              session_duration: 50,
            },
          },
          error: null,
        }),
      };

      const conflictQuery = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      let selectCalls = 0;
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn(() => {
                selectCalls += 1;
                return selectCalls === 1 ? firstSelectQuery : conflictQuery;
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );
      expect(res.status).toBe(200);
    });

    it("returns 409 on slot conflict", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const firstSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "pending",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              session_duration: 50,
            },
          },
          error: null,
        }),
      };

      const conflictQuery = {
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: [{ id: "conflict" }], error: null }),
      };

      let selectCalls = 0;
      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => {
            selectCalls += 1;
            return selectCalls === 1 ? firstSelectQuery : conflictQuery;
          }),
        })),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) }
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 when appointment is not found", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const firstSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "not found" },
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => firstSelectQuery),
        })),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-404" }) },
      );

      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not owner of appointment", async () => {
      createClientMock.mockResolvedValue(authClient("other-user"));

      const firstSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "pending",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              session_duration: 50,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => firstSelectQuery),
        })),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(403);
    });

    it("returns 400 when appointment status cannot be rescheduled", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      const firstSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "appt-1",
            status: "completed",
            scheduled_at: "2026-03-05T17:00:00.000Z",
            patient: {
              id: "patient-1",
              name: "Paciente",
              email: "paciente@example.com",
              user_id: "patient-user",
            },
            therapist: {
              id: "therapist-1",
              name: "Dra.",
              user_id: "therapist-user",
              session_duration: 50,
            },
          },
          error: null,
        }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => firstSelectQuery),
        })),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(400);
    });

    it("returns 500 when reschedule throws unexpectedly", async () => {
      createClientMock.mockResolvedValue(authClient("therapist-user"));

      createAdminClientMock.mockReturnValue({
        from: vi.fn(() => {
          throw new Error("db unavailable");
        }),
      });

      const { PUT } = await import("@/app/api/appointments/[id]/reschedule/route");
      const res = await PUT(
        new Request("http://localhost/api/appointments/id/reschedule", {
          method: "PUT",
          body: JSON.stringify({ newScheduledAt: "2026-03-06T18:00:00.000Z" }),
        }) as never,
        { params: Promise.resolve({ id: "appt-1" }) },
      );

      expect(res.status).toBe(500);
    });
  });
});
