import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("POST /api/webhooks/supabase", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
  });

  it("returns 401 when secret is configured and invalid", async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = "expected-secret";
    const { POST } = await import("@/app/api/webhooks/supabase/route");

    const req = new Request("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "wrong-secret",
      },
      body: JSON.stringify({ type: "UPDATE", table: "appointments", schema: "public" }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when payload is invalid", async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = "";
    const { POST } = await import("@/app/api/webhooks/supabase/route");

    const req = new Request("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ schema: "public" }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 200 on happy path", async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = "";
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "session-1" }, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const req = new Request("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "UPDATE",
        table: "appointments",
        schema: "public",
        record: {
          id: "appointment-1",
          status: "completed",
          therapist_id: "therapist-1",
          patient_id: "patient-1",
        },
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("creates session when appointment is completed and no session exists", async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = "";
    const insertSessionMock = vi.fn().mockResolvedValue({ data: { id: "session-2" }, error: null });
    let sessionsFromCalls = 0;

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "sessions") {
          sessionsFromCalls += 1;
          if (sessionsFromCalls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (sessionsFromCalls === 2) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { session_number: 3 }, error: null }),
              }),
            };
          }
          return {
            insert: insertSessionMock,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const req = new Request("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "UPDATE",
        table: "appointments",
        schema: "public",
        record: {
          id: "appointment-2",
          status: "completed",
          therapist_id: "therapist-1",
          patient_id: "patient-1",
        },
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertSessionMock).toHaveBeenCalled();
  });

  it("returns 500 when handler throws", async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = "";
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockRejectedValue(new Error("boom")),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const req = new Request("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "UPDATE",
        table: "appointments",
        schema: "public",
        record: {
          id: "appointment-3",
          status: "completed",
          therapist_id: "therapist-1",
          patient_id: "patient-1",
        },
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });
});
