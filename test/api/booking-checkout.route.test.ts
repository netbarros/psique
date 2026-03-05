import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const createCheckoutSessionMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  createCheckoutSession: createCheckoutSessionMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("POST /api/booking/checkout", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    createCheckoutSessionMock.mockReset();
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/booking/checkout/route");

    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ therapistId: "t1" }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid CPF before database access", async () => {
    const { POST } = await import("@/app/api/booking/checkout/route");

    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        therapistId: "t1",
        scheduledAt: new Date().toISOString(),
        patientName: "Paciente",
        patientEmail: "paciente@example.com",
        patientCpf: "11111111111",
        slug: "test-terapeuta",
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 409 when DB uniqueness detects race condition on appointment", async () => {
    let appointmentsCallCount = 0;

    const therapistQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "therapist-1",
          name: "Dra. Teste",
          session_price: 220,
          session_duration: 50,
        },
        error: null,
      }),
    };

    const patientQuery = {
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "patient-1" },
        error: null,
      }),
    };

    const appointmentsConflictQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const appointmentsInsertQuery = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          }),
        }),
      }),
    };

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(therapistQuery) };
        }

        if (table === "patients") {
          return { select: vi.fn().mockReturnValue(patientQuery) };
        }

        if (table === "appointments") {
          appointmentsCallCount += 1;
          if (appointmentsCallCount === 1) {
            return { select: vi.fn().mockReturnValue(appointmentsConflictQuery) };
          }
          return appointmentsInsertQuery;
        }

        throw new Error(`Unexpected table query: ${table}`);
      }),
    };

    createAdminClientMock.mockReturnValue(adminClient);

    const { POST } = await import("@/app/api/booking/checkout/route");

    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        therapistId: "therapist-1",
        scheduledAt: "2026-03-05T15:00:00.000Z",
        patientName: "Paciente Teste",
        patientEmail: "paciente@example.com",
        slug: "dra-teste",
      }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(409);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when therapist is not found", async () => {
    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "therapists") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
            }),
          };
        }
        throw new Error(`Unexpected table query: ${table}`);
      }),
    };
    createAdminClientMock.mockReturnValue(adminClient);

    const { POST } = await import("@/app/api/booking/checkout/route");
    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        therapistId: "therapist-1",
        scheduledAt: "2026-03-05T15:00:00.000Z",
        patientName: "Paciente Teste",
        patientEmail: "paciente@example.com",
        slug: "dra-teste",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 500 when patient lookup fails", async () => {
    let appointmentsCallCount = 0;
    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "therapists") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "therapist-1",
                  name: "Dra. Teste",
                  session_price: 220,
                  session_duration: 50,
                },
                error: null,
              }),
            }),
          };
        }
        if (table === "appointments") {
          appointmentsCallCount += 1;
          if (appointmentsCallCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "appointment-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "patients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "db error" },
              }),
            }),
          };
        }
        throw new Error(`Unexpected table query: ${table}`);
      }),
    };
    createAdminClientMock.mockReturnValue(adminClient);

    const { POST } = await import("@/app/api/booking/checkout/route");
    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        therapistId: "therapist-1",
        scheduledAt: "2026-03-05T15:00:00.000Z",
        patientName: "Paciente Teste",
        patientEmail: "paciente@example.com",
        slug: "dra-teste",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });

  it("returns 200 on full happy path creating patient and appointment", async () => {
    let appointmentsCallCount = 0;
    let patientsFromCalls = 0;
    createCheckoutSessionMock.mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/cs_test_1",
    });

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "therapists") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "therapist-1",
                  name: "Dra. Teste",
                  session_price: 220,
                  session_duration: 50,
                },
                error: null,
              }),
            }),
          };
        }

        if (table === "appointments") {
          appointmentsCallCount += 1;
          if (appointmentsCallCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "appointment-1" },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "patients") {
          patientsFromCalls += 1;
          if (patientsFromCalls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }

          if (patientsFromCalls === 2) {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "patient-1" },
                    error: null,
                  }),
                }),
              }),
            };
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "patient-1" },
                error: null,
              }),
            }),
          };
        }

        throw new Error(`Unexpected table query: ${table}`);
      }),
    };
    createAdminClientMock.mockReturnValue(adminClient);

    const { POST } = await import("@/app/api/booking/checkout/route");
    const req = new Request("http://localhost/api/booking/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({
        therapistId: "therapist-1",
        scheduledAt: "2026-03-05T15:00:00.000Z",
        patientName: "Paciente Teste",
        patientEmail: "paciente@example.com",
        slug: "dra-teste",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.appointmentId).toBe("appointment-1");
    expect(createCheckoutSessionMock).toHaveBeenCalled();
  });
});
