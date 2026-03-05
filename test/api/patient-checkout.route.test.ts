import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const createCheckoutSessionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

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

describe("POST /api/patient/appointments/checkout", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    createCheckoutSessionMock.mockReset();
  });

  it("returns 401 when user is not authenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const { POST } = await import("@/app/api/patient/appointments/checkout/route");

    const req = new Request("http://localhost/api/patient/appointments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date().toISOString() }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when payload is invalid", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });

    const { POST } = await import("@/app/api/patient/appointments/checkout/route");

    const req = new Request("http://localhost/api/patient/appointments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scheduledAt: "invalid-date" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when DB uniqueness detects slot race on insert", async () => {
    const patientQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "patient-1",
          therapist_id: "therapist-1",
          name: "Paciente Teste",
          email: "paciente@example.com",
          phone: null,
        },
        error: null,
      }),
    };

    const appointmentInsert = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          }),
        }),
      }),
    };

    const supabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "patients") {
          return { select: vi.fn().mockReturnValue(patientQuery) };
        }

        if (table === "appointments") {
          return appointmentInsert;
        }

        if (table === "audit_logs") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }

        throw new Error(`Unexpected supabase table: ${table}`);
      }),
    };

    const therapistQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "therapist-1",
          name: "Dra. Teste",
          session_price: 220,
          session_duration: 50,
          slug: "dra-teste",
          active: true,
        },
        error: null,
      }),
    };

    const conflictQuery = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(therapistQuery) };
        }

        if (table === "appointments") {
          return { select: vi.fn().mockReturnValue(conflictQuery) };
        }

        throw new Error(`Unexpected admin table: ${table}`);
      }),
    };

    createClientMock.mockResolvedValue(supabaseClient);
    createAdminClientMock.mockReturnValue(adminClient);

    const { POST } = await import("@/app/api/patient/appointments/checkout/route");

    const req = new Request("http://localhost/api/patient/appointments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-03-05T16:00:00.000Z" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(409);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });
});
