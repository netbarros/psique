import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("GET/POST /api/patient/mood branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it("returns 401 when auth fails", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "auth error" },
        }),
      },
      from: vi.fn(),
    });

    const { GET } = await import("@/app/api/patient/mood/route");
    const res = await GET(new Request("http://localhost/api/patient/mood"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when mood history query fails", async () => {
    createClientMock.mockResolvedValue({
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
              single: vi.fn().mockResolvedValue({
                data: { id: "patient-1", therapist_id: "therapist-1" },
                error: null,
              }),
            }),
          };
        }
        if (table === "patient_mood_entries") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "query failed" },
              }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { GET } = await import("@/app/api/patient/mood/route");
    const res = await GET(new Request("http://localhost/api/patient/mood?limit=not-a-number"));
    expect(res.status).toBe(500);
  });

  it("returns 200 and defaults limit when query param is invalid", async () => {
    const limitSpy = vi.fn().mockResolvedValue({
      data: [{ id: "m1", mood_score: 7, note: "ok", source: "manual", created_at: "2026-03-05T00:00:00.000Z" }],
      error: null,
    });

    createClientMock.mockResolvedValue({
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
              single: vi.fn().mockResolvedValue({
                data: { id: "patient-1", therapist_id: "therapist-1" },
                error: null,
              }),
            }),
          };
        }
        if (table === "patient_mood_entries") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: limitSpy,
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { GET } = await import("@/app/api/patient/mood/route");
    const res = await GET(new Request("http://localhost/api/patient/mood?limit=abc"));
    expect(res.status).toBe(200);
    expect(limitSpy).toHaveBeenCalledWith(30);
  });

  it("returns 400 for invalid POST payload", async () => {
    createClientMock.mockResolvedValue({
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
              single: vi.fn().mockResolvedValue({
                data: { id: "patient-1", therapist_id: "therapist-1" },
                error: null,
              }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/patient/mood/route");
    const res = await POST(
      new Request("http://localhost/api/patient/mood", {
        method: "POST",
        body: JSON.stringify({ moodScore: 11 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when mood insert fails", async () => {
    createClientMock.mockResolvedValue({
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
              single: vi.fn().mockResolvedValue({
                data: { id: "patient-1", therapist_id: "therapist-1" },
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "patient_mood_entries") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "insert failed" },
                }),
              }),
            }),
          };
        }
        if (table === "audit_logs") {
          return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/patient/mood/route");
    const res = await POST(
      new Request("http://localhost/api/patient/mood", {
        method: "POST",
        body: JSON.stringify({ moodScore: 7, note: "ok" }),
      }),
    );

    expect(res.status).toBe(500);
  });
});
