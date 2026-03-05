import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createSubscriptionCheckoutMock = vi.fn();
const cancelSubscriptionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  createSubscriptionCheckout: createSubscriptionCheckoutMock,
  cancelSubscription: cancelSubscriptionMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function mockSupabaseClient(userId: string | null, overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
      mfa: {
        enroll: vi.fn().mockResolvedValue({
          data: { id: "factor-1", totp: { uri: "otpauth://uri", secret: "SECRET" } },
          error: null,
        }),
        challenge: vi.fn().mockResolvedValue({
          data: { id: "challenge-1" },
          error: null,
        }),
        verify: vi.fn().mockResolvedValue({ error: null }),
        unenroll: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    ...overrides,
  };
}

describe("Auth MFA + subscriptions behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createSubscriptionCheckoutMock.mockReset();
    cancelSubscriptionMock.mockReset();
  });

  describe("MFA routes", () => {
    it("POST /api/auth/mfa/enroll returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient(null));
      const { POST } = await import("@/app/api/auth/mfa/enroll/route");
      const res = await POST();
      expect(res.status).toBe(401);
    });

    it("POST /api/auth/mfa/enroll returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/auth/mfa/enroll/route");
      const res = await POST();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.factorId).toBe("factor-1");
    });

    it("POST /api/auth/mfa/verify returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/auth/mfa/verify/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/verify", {
          method: "POST",
          body: "{bad-json",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/mfa/verify returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/auth/mfa/verify/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ factorId: "factor-1", code: "123456" }),
        }) as never
      );
      expect(res.status).toBe(200);
    });

    it("POST /api/auth/mfa/verify returns 400 when challenge fails", async () => {
      createClientMock.mockResolvedValue(
        mockSupabaseClient("user-1", {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "user-1" } },
              error: null,
            }),
            mfa: {
              challenge: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "challenge error" },
              }),
              verify: vi.fn(),
            },
          },
        }),
      );
      const { POST } = await import("@/app/api/auth/mfa/verify/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ factorId: "factor-1", code: "123456" }),
        }) as never,
      );
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/mfa/verify returns 400 when code is invalid", async () => {
      createClientMock.mockResolvedValue(
        mockSupabaseClient("user-1", {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "user-1" } },
              error: null,
            }),
            mfa: {
              challenge: vi.fn().mockResolvedValue({ data: { id: "challenge-1" }, error: null }),
              verify: vi.fn().mockResolvedValue({ error: { message: "invalid code" } }),
            },
          },
        }),
      );
      const { POST } = await import("@/app/api/auth/mfa/verify/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ factorId: "factor-1", code: "000000" }),
        }) as never,
      );
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/mfa/unenroll returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/auth/mfa/unenroll/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/unenroll", {
          method: "POST",
          body: "{bad-json",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/mfa/unenroll returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/auth/mfa/unenroll/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/unenroll", {
          method: "POST",
          body: JSON.stringify({ factorId: "factor-1" }),
        }) as never
      );
      expect(res.status).toBe(200);
    });

    it("POST /api/auth/mfa/unenroll returns 400 when provider rejects", async () => {
      createClientMock.mockResolvedValue(
        mockSupabaseClient("user-1", {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "user-1" } },
              error: null,
            }),
            mfa: {
              unenroll: vi.fn().mockResolvedValue({ error: { message: "cannot unenroll" } }),
            },
          },
        }),
      );
      const { POST } = await import("@/app/api/auth/mfa/unenroll/route");
      const res = await POST(
        new Request("http://localhost/api/auth/mfa/unenroll", {
          method: "POST",
          body: JSON.stringify({ factorId: "factor-1" }),
        }) as never,
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST/DELETE /api/subscriptions", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient(null));
      const { POST } = await import("@/app/api/subscriptions/route");
      const res = await POST(
        new Request("http://localhost/api/subscriptions", {
          method: "POST",
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid payload", async () => {
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));
      const { POST } = await import("@/app/api/subscriptions/route");
      const res = await POST(
        new Request("http://localhost/api/subscriptions", {
          method: "POST",
          body: "{bad-json",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 on create subscription happy path", async () => {
      createSubscriptionCheckoutMock.mockResolvedValue({ url: "https://stripe.test/checkout" });

      const therapistQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "123e4567-e89b-12d3-a456-426614174001", name: "Dra.", session_price: 200, slug: "dra" },
          error: null,
        }),
      };

      createClientMock.mockResolvedValue(
        mockSupabaseClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "therapists") {
              return { select: vi.fn().mockReturnValue(therapistQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        })
      );

      const { POST } = await import("@/app/api/subscriptions/route");
      const res = await POST(
        new Request("http://localhost/api/subscriptions", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: JSON.stringify({
            therapistId: "123e4567-e89b-12d3-a456-426614174001",
            patientEmail: "paciente@example.com",
            patientName: "Paciente",
            sessionsPerMonth: 4,
          }),
        }) as never
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("returns 404 when therapist does not exist", async () => {
      const therapistQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      createClientMock.mockResolvedValue(
        mockSupabaseClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "therapists") {
              return { select: vi.fn().mockReturnValue(therapistQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );

      const { POST } = await import("@/app/api/subscriptions/route");
      const res = await POST(
        new Request("http://localhost/api/subscriptions", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: JSON.stringify({
            therapistId: "123e4567-e89b-12d3-a456-426614174001",
            patientEmail: "paciente@example.com",
            patientName: "Paciente",
            sessionsPerMonth: 4,
          }),
        }) as never,
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 on cancel subscription happy path", async () => {
      cancelSubscriptionMock.mockResolvedValue({ status: "canceled" });
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));

      const { DELETE } = await import("@/app/api/subscriptions/route");
      const res = await DELETE(
        new Request("http://localhost/api/subscriptions", {
          method: "DELETE",
          body: JSON.stringify({ subscriptionId: "sub_123" }),
        }) as never
      );
      expect(res.status).toBe(200);
    });

    it("returns 500 when cancelSubscription throws", async () => {
      cancelSubscriptionMock.mockRejectedValue(new Error("stripe offline"));
      createClientMock.mockResolvedValue(mockSupabaseClient("user-1"));

      const { DELETE } = await import("@/app/api/subscriptions/route");
      const res = await DELETE(
        new Request("http://localhost/api/subscriptions", {
          method: "DELETE",
          body: JSON.stringify({ subscriptionId: "sub_123" }),
        }) as never,
      );
      expect(res.status).toBe(500);
    });
  });
});
