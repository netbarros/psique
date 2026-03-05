import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMasterAdminContextMock = vi.fn();
const insertAdminAuditEventMock = vi.fn();

vi.mock("@/lib/auth/master-admin", () => ({
  requireMasterAdminContext: requireMasterAdminContextMock,
}));

vi.mock("@/lib/admin/audit", () => ({
  insertAdminAuditEvent: insertAdminAuditEventMock,
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
});
