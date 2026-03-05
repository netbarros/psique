import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const stripeAccountsRetrieveMock = vi.fn();
const stripeAccountsCreateMock = vi.fn();
const stripeAccountsCreateLoginLinkMock = vi.fn();
const stripeAccountLinksCreateMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    accounts: {
      retrieve: stripeAccountsRetrieveMock,
      create: stripeAccountsCreateMock,
      createLoginLink: stripeAccountsCreateLoginLinkMock,
    },
    accountLinks: {
      create: stripeAccountLinksCreateMock,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeAuth(userId: string | null, email = "therapist@example.com") {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId, email } : null },
      error: null,
    }),
  };
}

describe("Settings integrations routes", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    stripeAccountsRetrieveMock.mockReset();
    stripeAccountsCreateMock.mockReset();
    stripeAccountsCreateLoginLinkMock.mockReset();
    stripeAccountLinksCreateMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

    it("returns 400 when OpenRouter key is invalid", async () => {
      const therapistSelect = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "therapist-1" }, error: null }),
      };
      const supabase = {
        auth: makeAuth("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue(therapistSelect),
              update: vi.fn(),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
      );

      const { PATCH } = await import("@/app/api/settings/integrations/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/integrations", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ openRouterKey: "sk-or-v1-invalid" }),
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("INTEGRATION_OPENROUTER_INVALID");
    });

    it("updates integrations on happy path", async () => {
      const therapistSelect = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "therapist-1" }, error: null }),
      };
      const therapistUpdateSingle = vi.fn().mockResolvedValue({
        data: {
          id: "therapist-1",
          ai_model: "openrouter/anthropic/claude-sonnet-4",
          openrouter_key_hash: "sk-or-v1-test",
          telegram_bot_token: "123:abc",
          telegram_bot_username: "psique_bot",
          stripe_account_id: "acct_1234567890",
        },
        error: null,
      });
      const therapistUpdateEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: therapistUpdateSingle,
        }),
      });
      const auditInsert = vi.fn().mockResolvedValue({ error: null });
      const supabase = {
        auth: makeAuth("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue(therapistSelect),
              update: vi.fn().mockReturnValue({
                eq: therapistUpdateEq,
              }),
            };
          }
          if (table === "audit_logs") {
            return { insert: auditInsert };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      stripeAccountsRetrieveMock.mockResolvedValue({ id: "acct_1234567890" });
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(new Response("{}", { status: 200 }))
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: true, result: { username: "psique_bot" } }), {
              status: 200,
            }),
          ),
      );

      const { PATCH } = await import("@/app/api/settings/integrations/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/integrations", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            openRouterKey: "sk-or-v1-test",
            telegramToken: "123:abc",
            stripeAccountId: "acct_1234567890",
            aiModel: "openrouter/anthropic/claude-sonnet-4",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.openRouterConnected).toBe(true);
      expect(body.data.telegramConnected).toBe(true);
      expect(body.data.stripeConnected).toBe(true);
      expect(stripeAccountsRetrieveMock).toHaveBeenCalledWith("acct_1234567890");
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

    it("creates connect account and returns onboarding link", async () => {
      const therapistSelect = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "therapist-1", stripe_account_id: null },
          error: null,
        }),
      };
      const therapistUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const auditInsert = vi.fn().mockResolvedValue({ error: null });

      const supabase = {
        auth: makeAuth("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue(therapistSelect),
              update: therapistUpdate,
            };
          }
          if (table === "audit_logs") {
            return { insert: auditInsert };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      stripeAccountsCreateMock.mockResolvedValue({ id: "acct_new" });
      stripeAccountsRetrieveMock.mockResolvedValue({ id: "acct_new", details_submitted: false });
      stripeAccountLinksCreateMock.mockResolvedValue({ url: "https://stripe.test/onboarding" });

      const { POST } = await import("@/app/api/settings/integrations/stripe/connect/route");
      const res = await POST(
        new Request("http://localhost/api/settings/integrations/stripe/connect", {
          method: "POST",
          headers: { origin: "http://localhost:3000" },
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.mode).toBe("onboarding");
      expect(body.data.accountId).toBe("acct_new");
    });

    it("returns login link when account is already submitted", async () => {
      const therapistSelect = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "therapist-1", stripe_account_id: "acct_existing" },
          error: null,
        }),
      };

      const supabase = {
        auth: makeAuth("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue(therapistSelect),
              update: vi.fn(),
            };
          }
          if (table === "audit_logs") {
            return { insert: vi.fn() };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      stripeAccountsRetrieveMock.mockResolvedValue({ id: "acct_existing", details_submitted: true });
      stripeAccountsCreateLoginLinkMock.mockResolvedValue({ url: "https://stripe.test/dashboard" });

      const { POST } = await import("@/app/api/settings/integrations/stripe/connect/route");
      const res = await POST(
        new Request("http://localhost/api/settings/integrations/stripe/connect", {
          method: "POST",
          headers: { origin: "http://localhost:3000" },
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.mode).toBe("dashboard");
      expect(body.data.accountId).toBe("acct_existing");
      expect(body.data.url).toBe("https://stripe.test/dashboard");
    });
  });
});
