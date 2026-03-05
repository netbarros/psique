import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

function makeAuth(userId: string | null, email = "therapist@example.com") {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId, email } : null },
      error: null,
    }),
  };
}

describe("Legacy settings/integrations endpoints", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  describe("PATCH /api/settings/integrations", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue({ auth: makeAuth(null) });
      const { PATCH } = await import("@/app/api/settings/integrations/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/integrations", {
          method: "PATCH",
          body: JSON.stringify({ openRouterKey: "sk-or-v1-test" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 409 because legacy write endpoint is disabled", async () => {
      createClientMock.mockResolvedValue({ auth: makeAuth("user-1") });
      const { PATCH } = await import("@/app/api/settings/integrations/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/integrations", {
          method: "PATCH",
          body: JSON.stringify({ openRouterKey: "sk-or-v1-test" }),
        }),
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("LEGACY_ENDPOINT_WRITE_DISABLED");
    });
  });

  describe("POST /api/settings/integrations/stripe/connect", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue({ auth: makeAuth(null) });
      const { POST } = await import("@/app/api/settings/integrations/stripe/connect/route");
      const res = await POST(
        new Request("http://localhost/api/settings/integrations/stripe/connect", {
          method: "POST",
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 409 because legacy write endpoint is disabled", async () => {
      createClientMock.mockResolvedValue({ auth: makeAuth("user-1") });
      const { POST } = await import("@/app/api/settings/integrations/stripe/connect/route");
      const res = await POST(
        new Request("http://localhost/api/settings/integrations/stripe/connect", {
          method: "POST",
        }),
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("LEGACY_ENDPOINT_WRITE_DISABLED");
    });
  });
});
