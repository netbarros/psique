import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMasterAdminContextMock = vi.fn();
const insertAdminAuditEventMock = vi.fn();
const globalFetchMock = vi.fn();
const stripeAccountsRetrieveMock = vi.fn();

vi.mock("@/lib/auth/master-admin", () => ({
  requireMasterAdminContext: requireMasterAdminContextMock,
}));

vi.mock("@/lib/admin/audit", () => ({
  insertAdminAuditEvent: insertAdminAuditEventMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    public accounts = {
      retrieve: stripeAccountsRetrieveMock,
    };
  },
}));

function buildPlanListQuery(rows: unknown[]) {
  const query = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
  };

  return {
    select: vi.fn().mockReturnValue(query),
  };
}

describe("Master admin API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    requireMasterAdminContextMock.mockReset();
    insertAdminAuditEventMock.mockReset();
    globalFetchMock.mockReset();
    stripeAccountsRetrieveMock.mockReset();
    vi.stubGlobal("fetch", globalFetchMock);

    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_CONNECT_CLIENT_ID;
    delete process.env.STRIPE_CLIENT_ID;
    delete process.env.ASAAS_API_KEY;
    delete process.env.ASAAS_ACCESS_TOKEN;
    delete process.env.ASAAS_TOKEN;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_DEFAULT_MODEL;
    delete process.env.DAILY_API_KEY;
    delete process.env.DAILY_API_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_NAME;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("GET /api/admin/plans returns forbidden when role check fails", async () => {
    requireMasterAdminContextMock.mockResolvedValue({
      context: null,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    });

    const { GET } = await import("@/app/api/admin/plans/route");
    const res = await GET(new Request("http://localhost/api/admin/plans"));
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/plans returns mapped revision list", async () => {
    const rows = [
      {
        id: "bdb9732f-f938-4ad7-9f12-1655f5532614",
        document_id: "f13b8f79-a12f-4407-9f7e-b25760304f61",
        version: 2,
        status: "draft",
        payload_json: { name: "Plano Pro" },
        etag: "etag-123",
        published_at: null,
        created_at: "2026-03-05T10:00:00.000Z",
        updated_at: "2026-03-05T10:00:00.000Z",
        plan_documents: { plan_key: "pro", locale: "pt-BR" },
      },
    ];

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "plan_revisions") {
              return buildPlanListQuery(rows);
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { GET } = await import("@/app/api/admin/plans/route");
    const res = await GET(new Request("http://localhost/api/admin/plans?status=draft&locale=pt-BR"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data[0].planKey).toBe("pro");
    expect(json.data[0].locale).toBe("pt-BR");
    expect(json.data[0].status).toBe("draft");
  });

  it("PATCH /api/admin/integrations/:provider upserts integration and emits audit", async () => {
    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "stripe",
                        status: "active",
                        public_config_json: { accountId: "acct_123" },
                        last_validated_at: null,
                        updated_by: "admin-1",
                        created_at: "2026-03-05T10:00:00.000Z",
                        updated_at: "2026-03-05T10:01:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }

            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { PATCH } = await import("@/app/api/admin/integrations/[provider]/route");
    const res = await PATCH(
      new Request("http://localhost/api/admin/integrations/stripe", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "active",
          publicConfig: { accountId: "acct_123" },
        }),
      }),
      { params: Promise.resolve({ provider: "stripe" }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("stripe");
    expect(insertAdminAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/telegram/connect validates token and persists provider", async () => {
    const runtimeToken = "123456789:ABCDEF1234567890ghijklmnopqrst";
    process.env.TELEGRAM_BOT_TOKEN = runtimeToken;
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-webhook-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.psique.com";

    globalFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: 987654321,
            username: "psique_bot",
            first_name: "Psique",
            can_join_groups: true,
            can_read_all_group_messages: false,
            supports_inline_queries: false,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "telegram",
                        status: "active",
                        public_config_json: {
                          loginWidget: {
                            botUsername: "psique_bot",
                            loginDomain: "app.psique.com",
                          },
                        },
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/telegram/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/telegram/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          botToken: runtimeToken,
          loginDomain: "app.psique.com",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("telegram");
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    expect(insertAdminAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/telegram/connect rejects token mismatch with runtime env", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456789:runtime-token-abcdefghijklmnopqrstuvwxyz";

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn(),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/telegram/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/telegram/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          botToken: "123456789:different-token-abcdefghijklmnopqrstuvwxyz",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(globalFetchMock).not.toHaveBeenCalled();
    expect(insertAdminAuditEventMock).not.toHaveBeenCalled();
  });

  it("POST /api/admin/integrations/stripe/connect validates secret and persists provider", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abcdefghijklmnopqrstuvwxyz12345";
    process.env.STRIPE_CONNECT_CLIENT_ID = "ca_1234567890abcdef";

    stripeAccountsRetrieveMock.mockResolvedValue({
      id: "acct_123",
      country: "BR",
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    });

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "stripe",
                        status: "active",
                        public_config_json: {
                          connectedAccount: {
                            accountId: "acct_123",
                          },
                        },
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/stripe/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/stripe/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secretKey: "sk_test_abcdefghijklmnopqrstuvwxyz12345",
          connectClientId: "ca_1234567890abcdef",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("stripe");
    expect(json.data.status).toBe("active");
    expect(stripeAccountsRetrieveMock).toHaveBeenCalledTimes(1);
    expect(insertAdminAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/stripe/connect rejects secret mismatch with runtime env", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_runtimeabcdefghijklmnopqrstuvwxyz123";

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn(),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/stripe/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/stripe/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secretKey: "sk_test_differentabcdefghijklmnopqrstuvwxyz123",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(stripeAccountsRetrieveMock).not.toHaveBeenCalled();
    expect(insertAdminAuditEventMock).not.toHaveBeenCalled();
  });

  it("POST /api/admin/integrations/asaas/connect validates key and persists provider", async () => {
    process.env.ASAAS_API_KEY = "$aact_abcdefghijklmnopqrstuvwxyz123456";

    globalFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "Psique LTDA",
          walletId: "wallet_123",
          email: "financeiro@psique.com",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "asaas",
                        status: "active",
                        public_config_json: {
                          connectedAccount: {
                            walletId: "wallet_123",
                          },
                        },
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/asaas/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/asaas/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: "$aact_abcdefghijklmnopqrstuvwxyz123456",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("asaas");
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    expect(insertAdminAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/asaas/connect rejects key mismatch with runtime env", async () => {
    process.env.ASAAS_API_KEY = "$aact_runtime_abcdefghijklmnopqrstuvwxyz123";

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn(),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/asaas/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/asaas/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: "$aact_different_abcdefghijklmnopqrstuvwxyz123",
        }),
      }),
    );

    expect(res.status).toBe(409);
    expect(globalFetchMock).not.toHaveBeenCalled();
    expect(insertAdminAuditEventMock).not.toHaveBeenCalled();
  });

  it("POST /api/admin/integrations/telegram/connect supports useRuntime without sending token", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123456789:runtime-token-abcdefghijklmnopqrstuvwxyz";
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-webhook-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.psique.com";

    globalFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: 987654321,
            username: "psique_bot",
            first_name: "Psique",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "telegram",
                        status: "active",
                        public_config_json: {},
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/telegram/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/telegram/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          useRuntime: true,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("telegram");
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/stripe/connect supports useRuntime without sending secret", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abcdefghijklmnopqrstuvwxyz12345";
    process.env.STRIPE_CONNECT_CLIENT_ID = "ca_1234567890abcdef";

    stripeAccountsRetrieveMock.mockResolvedValue({
      id: "acct_123",
      country: "BR",
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    });

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "stripe",
                        status: "active",
                        public_config_json: {},
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/stripe/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/stripe/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          useRuntime: true,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("stripe");
    expect(stripeAccountsRetrieveMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/asaas/connect supports useRuntime without sending key", async () => {
    process.env.ASAAS_API_KEY = "$aact_abcdefghijklmnopqrstuvwxyz123456";

    globalFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "Psique LTDA",
          walletId: "wallet_123",
          email: "financeiro@psique.com",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { public_config_json: {} },
                      error: null,
                    }),
                  }),
                }),
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "asaas",
                        status: "active",
                        public_config_json: {},
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/asaas/connect/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/asaas/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          useRuntime: true,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.provider).toBe("asaas");
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
  });

  it("POST /api/admin/integrations/runtime/sync supports dryRun without persisting", async () => {
    process.env.SENTRY_DSN = "https://public@o0.ingest.sentry.io/1";

    const fromMock = vi.fn();
    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: fromMock,
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/runtime/sync/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/runtime/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providers: ["sentry"],
          dryRun: true,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.dryRun).toBe(true);
    expect(json.data.summary.total).toBe(1);
    expect(json.data.items[0].provider).toBe("sentry");
    expect(fromMock).not.toHaveBeenCalled();
    expect(insertAdminAuditEventMock).not.toHaveBeenCalled();
  });

  it("POST /api/admin/integrations/runtime/sync persists and audits providers", async () => {
    process.env.SENTRY_DSN = "https://public@o0.ingest.sentry.io/1";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@o0.ingest.sentry.io/2";

    requireMasterAdminContextMock.mockResolvedValue({
      context: {
        user: { id: "admin-1", email: "admin@psique.local" },
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "platform_integrations") {
              return {
                upsert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        provider: "sentry",
                        status: "active",
                        public_config_json: {
                          provider: "sentry",
                        },
                        last_validated_at: "2026-03-06T01:00:00.000Z",
                        updated_by: "admin-1",
                        created_at: "2026-03-06T01:00:00.000Z",
                        updated_at: "2026-03-06T01:00:00.000Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        },
      },
      response: null,
    });

    const { POST } = await import("@/app/api/admin/integrations/runtime/sync/route");
    const res = await POST(
      new Request("http://localhost/api/admin/integrations/runtime/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providers: ["sentry"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.dryRun).toBe(false);
    expect(json.data.summary.active).toBe(1);
    expect(json.data.integrations).toHaveLength(1);
    expect(json.data.integrations[0].provider).toBe("sentry");
    expect(insertAdminAuditEventMock).toHaveBeenCalledTimes(1);
  });
});
