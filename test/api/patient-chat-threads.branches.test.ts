import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("Patient chat threads branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it("returns 401 for unauthenticated thread list", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "auth error" },
        }),
      },
      from: vi.fn(),
    });

    const { GET } = await import("@/app/api/patient/chat/threads/route");
    const res = await GET(new Request("http://localhost/api/patient/chat/threads"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when thread list query fails", async () => {
    const limitSpy = vi.fn().mockResolvedValue({ data: null, error: { message: "db fail" } });
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
                data: { id: "patient-1" },
                error: null,
              }),
            }),
          };
        }
        if (table === "patient_chat_threads") {
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

    const { GET } = await import("@/app/api/patient/chat/threads/route");
    const res = await GET(new Request("http://localhost/api/patient/chat/threads?limit=not-a-number"));
    expect(res.status).toBe(500);
    expect(limitSpy).toHaveBeenCalledWith(20);
  });

  it("returns 401 for unauthenticated thread messages", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "auth error" },
        }),
      },
      from: vi.fn(),
    });

    const { GET } = await import("@/app/api/patient/chat/threads/[id]/messages/route");
    const res = await GET(
      new Request("http://localhost/api/patient/chat/threads/thread-1/messages"),
      { params: Promise.resolve({ id: "thread-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 when thread messages query fails", async () => {
    const limitSpy = vi.fn().mockResolvedValue({ data: null, error: { message: "db fail" } });
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
                data: { id: "patient-1" },
                error: null,
              }),
            }),
          };
        }
        if (table === "patient_chat_threads") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "thread-1" },
                error: null,
              }),
            }),
          };
        }
        if (table === "patient_chat_messages") {
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

    const { GET } = await import("@/app/api/patient/chat/threads/[id]/messages/route");
    const res = await GET(
      new Request("http://localhost/api/patient/chat/threads/thread-1/messages?limit=invalid"),
      { params: Promise.resolve({ id: "thread-1" }) },
    );
    expect(res.status).toBe(500);
    expect(limitSpy).toHaveBeenCalledWith(100);
  });
});
