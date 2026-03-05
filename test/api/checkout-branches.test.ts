import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const createClientMock = vi.fn();
const createCheckoutSessionMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
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

function bookingBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    therapistId: "therapist-1",
    scheduledAt: "2026-03-05T15:00:00.000Z",
    patientName: "Paciente Teste",
    patientEmail: "paciente@example.com",
    slug: "dra-teste",
    ...overrides,
  });
}

describe("Checkout routes branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    createClientMock.mockReset();
    createCheckoutSessionMock.mockReset();
  });

  describe("POST /api/booking/checkout", () => {
    it("returns 409 when appointment conflict is detected before insert", async () => {
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({
                  data: [{ id: "occupied-slot" }],
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/booking/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/booking/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: bookingBody(),
        }) as never,
      );

      expect(res.status).toBe(409);
      expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    });

    it("recovers patient id after unique conflict on patient insert", async () => {
      let patientsFromCalls = 0;
      let appointmentsFromCalls = 0;

      createCheckoutSessionMock.mockResolvedValue({
        id: "cs_recovered",
        url: "https://checkout.stripe.test/cs_recovered",
      });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                  },
                  error: null,
                }),
              }),
            };
          }

          if (table === "appointments") {
            appointmentsFromCalls += 1;
            if (appointmentsFromCalls === 1) {
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
                      data: null,
                      error: { code: "23505", message: "duplicate patient" },
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
                  data: { id: "patient-recovered" },
                  error: null,
                }),
              }),
            };
          }

          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/booking/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/booking/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: bookingBody(),
        }) as never,
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(createCheckoutSessionMock).toHaveBeenCalled();
    });

    it("returns 409 when patient unique conflict cannot be recovered", async () => {
      let patientsFromCalls = 0;

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
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
                      data: null,
                      error: { code: "23505", message: "duplicate patient" },
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
                  data: null,
                  error: { message: "still missing" },
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/booking/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/booking/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: bookingBody(),
        }) as never,
      );

      expect(res.status).toBe(409);
    });

    it("returns 500 when checkout provider throws", async () => {
      let appointmentsFromCalls = 0;
      createCheckoutSessionMock.mockRejectedValue(new Error("stripe down"));

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                  },
                  error: null,
                }),
              }),
            };
          }

          if (table === "appointments") {
            appointmentsFromCalls += 1;
            if (appointmentsFromCalls === 1) {
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
                  data: { id: "patient-1" },
                  error: null,
                }),
              }),
            };
          }

          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/booking/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/booking/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: bookingBody(),
        }) as never,
      );

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/patient/appointments/checkout", () => {
    function authedPatientClient(patient: unknown, extraFrom?: Record<string, unknown>) {
      return {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: patient, error: null }),
              }),
            };
          }
          const custom = extraFrom?.[table];
          if (custom) {
            return custom;
          }
          throw new Error(`Unexpected supabase table ${table}`);
        }),
      };
    }

    it("returns 404 when patient profile does not exist", async () => {
      createClientMock.mockResolvedValue(authedPatientClient(null));

      const { POST } = await import("@/app/api/patient/appointments/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/patient/appointments/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduledAt: "2026-03-05T15:00:00.000Z" }),
        }),
      );

      expect(res.status).toBe(404);
    });

    it("returns 404 when therapist is unavailable", async () => {
      createClientMock.mockResolvedValue(
        authedPatientClient({ id: "patient-1", therapist_id: "therapist-1", name: "Pat", email: "p@x.com" }),
      );
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "therapist-1", active: false },
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected admin table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/patient/appointments/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/patient/appointments/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduledAt: "2026-03-05T15:00:00.000Z" }),
        }),
      );

      expect(res.status).toBe(404);
    });

    it("returns 409 when slot conflict exists", async () => {
      createClientMock.mockResolvedValue(
        authedPatientClient({ id: "patient-1", therapist_id: "therapist-1", name: "Pat", email: "p@x.com" }),
      );
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                    slug: "dra",
                    active: true,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [{ id: "busy-slot" }], error: null }),
              }),
            };
          }
          throw new Error(`Unexpected admin table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/patient/appointments/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/patient/appointments/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduledAt: "2026-03-05T15:00:00.000Z" }),
        }),
      );

      expect(res.status).toBe(409);
      expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    });

    it("returns 500 when appointment insert fails with non-unique error", async () => {
      createClientMock.mockResolvedValue(
        authedPatientClient(
          { id: "patient-1", therapist_id: "therapist-1", name: "Pat", email: "p@x.com" },
          {
            appointments: {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: "XX001", message: "insert failed" },
                  }),
                }),
              }),
            },
          },
        ),
      );

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                    slug: "dra",
                    active: true,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          throw new Error(`Unexpected admin table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/patient/appointments/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/patient/appointments/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduledAt: "2026-03-05T15:00:00.000Z" }),
        }),
      );

      expect(res.status).toBe(500);
    });

    it("returns 200 on happy path and records audit log", async () => {
      createCheckoutSessionMock.mockResolvedValue({
        id: "cs_patient",
        url: "https://checkout.stripe.test/cs_patient",
      });

      createClientMock.mockResolvedValue(
        authedPatientClient(
          { id: "patient-1", therapist_id: "therapist-1", name: "Pat", email: "p@x.com" },
          {
            appointments: {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "appointment-1" },
                    error: null,
                  }),
                }),
              }),
            },
            audit_logs: {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            },
          },
        ),
      );

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "therapist-1",
                    name: "Dra",
                    session_price: 220,
                    session_duration: 50,
                    slug: "dra",
                    active: true,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          throw new Error(`Unexpected admin table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/patient/appointments/checkout/route");
      const res = await POST(
        new Request("http://localhost/api/patient/appointments/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: JSON.stringify({ scheduledAt: "2026-03-05T15:00:00.000Z" }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(createCheckoutSessionMock).toHaveBeenCalled();
    });
  });
});
