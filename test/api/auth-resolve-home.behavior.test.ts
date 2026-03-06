import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

function serverClient(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
  };
}

function adminClientForRole(role: "master_admin" | "therapist" | "patient") {
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === "user_roles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role },
                error: null,
              }),
            }),
          }),
          upsert,
        };
      }

      if (table === "patients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "patient-1" },
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe("POST /api/auth/resolve-home", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("returns 401 when unauthenticated", async () => {
    createClientMock.mockResolvedValue(serverClient(null));
    const { POST } = await import("@/app/api/auth/resolve-home/route");

    const res = await POST(
      new Request("http://localhost/api/auth/resolve-home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("resolves patient destination from metadata when service role is unavailable", async () => {
    createClientMock.mockResolvedValue(
      serverClient({
        id: "user-1",
        email: "patient@psique.local",
        user_metadata: { role: "patient" },
      }),
    );

    const { POST } = await import("@/app/api/auth/resolve-home/route");
    const res = await POST(
      new Request("http://localhost/api/auth/resolve-home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next: "/portal/agendar" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("patient");
    expect(body.data.destination).toBe("/portal/agendar");
  });

  it("preserves allowed admin next path for master_admin", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    createClientMock.mockResolvedValue(
      serverClient({
        id: "admin-1",
        email: "admin@psique.local",
        user_metadata: {},
      }),
    );
    createAdminClientMock.mockReturnValue(adminClientForRole("master_admin"));

    const { POST } = await import("@/app/api/auth/resolve-home/route");
    const res = await POST(
      new Request("http://localhost/api/auth/resolve-home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next: "/admin/integrations" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("master_admin");
    expect(body.data.destination).toBe("/admin/integrations");
    expect(body.data.usedNext).toBe(true);
  });

  it("blocks forbidden next path and falls back to role home", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    createClientMock.mockResolvedValue(
      serverClient({
        id: "patient-1",
        email: "patient@psique.local",
        user_metadata: {},
      }),
    );
    createAdminClientMock.mockReturnValue(adminClientForRole("patient"));

    const { POST } = await import("@/app/api/auth/resolve-home/route");
    const res = await POST(
      new Request("http://localhost/api/auth/resolve-home", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next: "/admin" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("patient");
    expect(body.data.destination).toBe("/portal");
    expect(body.data.usedNext).toBe(false);
  });
});
