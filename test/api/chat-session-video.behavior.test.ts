import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const limitMock = vi.fn();
const chatWithContextMock = vi.fn();
const createRoomMock = vi.fn();
const createMeetingTokenMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/ratelimit", () => ({
  getAIRatelimiter: () => ({
    limit: limitMock,
  }),
}));

vi.mock("@/lib/openrouter", () => ({
  chatWithContext: chatWithContextMock,
}));

vi.mock("@/lib/daily", () => ({
  createRoom: createRoomMock,
  createMeetingToken: createMeetingTokenMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function authUser(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  };
}

describe("Patient chat, sessions close and video room behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    limitMock.mockReset();
    chatWithContextMock.mockReset();
    createRoomMock.mockReset();
    createMeetingTokenMock.mockReset();
  });

  describe("POST /api/patient/chat/messages", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authUser(null));
      const { POST } = await import("@/app/api/patient/chat/messages/route");
      const res = await POST(
        new Request("http://localhost/api/patient/chat/messages", {
          method: "POST",
          body: "{}",
        })
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      const supabase = {
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "patient-1", therapist_id: "therapist-1", name: "Paciente" },
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });

      const { POST } = await import("@/app/api/patient/chat/messages/route");
      const res = await POST(
        new Request("http://localhost/api/patient/chat/messages", {
          method: "POST",
          body: "{bad-json",
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      const insertMessagesMock = vi
        .fn()
        .mockResolvedValueOnce({ error: null })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "assistant-1",
                role: "assistant",
                content: "Resposta",
                created_at: "2026-03-05T12:00:00.000Z",
              },
              error: null,
            }),
          }),
        });

      const supabase = {
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "patient-1", therapist_id: "therapist-1", name: "Paciente" },
                  error: null,
                }),
              }),
            };
          }

          if (table === "patient_chat_threads") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi
                  .fn()
                  .mockResolvedValue({ data: { id: "123e4567-e89b-12d3-a456-426614174002" }, error: null }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }

          if (table === "patient_chat_messages") {
            return {
              insert: insertMessagesMock,
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }

          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { ai_model: null, openrouter_key_hash: null },
                  error: null,
                }),
              }),
            };
          }

          throw new Error(`Unexpected table ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      chatWithContextMock.mockResolvedValue("Resposta");

      const { POST } = await import("@/app/api/patient/chat/messages/route");
      const res = await POST(
        new Request("http://localhost/api/patient/chat/messages", {
          method: "POST",
          body: JSON.stringify({
            threadId: "123e4567-e89b-12d3-a456-426614174002",
            content: "Oi",
          }),
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.reply).toBe("Resposta");
    });

    it("returns 429 when rate limited", async () => {
      const supabase = {
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "patient-1", therapist_id: "therapist-1", name: "Paciente" },
                  error: null,
                }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: false });

      const { POST } = await import("@/app/api/patient/chat/messages/route");
      const res = await POST(
        new Request("http://localhost/api/patient/chat/messages", {
          method: "POST",
          body: JSON.stringify({ content: "Oi" }),
        })
      );
      expect(res.status).toBe(429);
    });

    it("returns explicit configuration error when provider is not configured", async () => {
      const insertMessagesMock = vi.fn().mockResolvedValueOnce({ error: null });

      const supabase = {
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "patient-1", therapist_id: "therapist-1", name: "Paciente" },
                  error: null,
                }),
              }),
            };
          }

          if (table === "patient_chat_threads") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi
                  .fn()
                  .mockResolvedValue({ data: { id: "123e4567-e89b-12d3-a456-426614174002" }, error: null }),
              }),
            };
          }

          if (table === "patient_chat_messages") {
            return {
              insert: insertMessagesMock,
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }

          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { ai_model: null, openrouter_key_hash: null },
                  error: null,
                }),
              }),
            };
          }

          throw new Error(`Unexpected table ${table}`);
        }),
      };

      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      chatWithContextMock.mockRejectedValueOnce(new Error("[OpenRouter] Missing usable OPENROUTER_API_KEY"));

      const { POST } = await import("@/app/api/patient/chat/messages/route");
      const res = await POST(
        new Request("http://localhost/api/patient/chat/messages", {
          method: "POST",
          body: JSON.stringify({
            threadId: "123e4567-e89b-12d3-a456-426614174002",
            content: "Oi",
          }),
        })
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe("AI_NOT_CONFIGURED");
    });
  });

  describe("PATCH /api/sessions/[id]/close", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authUser(null));
      const { PATCH } = await import("@/app/api/sessions/[id]/close/route");
      const res = await PATCH(
        new Request("http://localhost/api/sessions/id/close", {
          method: "PATCH",
          body: "{}",
        }),
        { params: Promise.resolve({ id: "session-1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(authUser("user-1"));
      const { PATCH } = await import("@/app/api/sessions/[id]/close/route");
      const res = await PATCH(
        new Request("http://localhost/api/sessions/id/close", {
          method: "PATCH",
          body: "{bad-json",
        }),
        { params: Promise.resolve({ id: "session-1" }) }
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      const updateEqSecond = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateEqFirst = vi.fn().mockReturnValue({ eq: updateEqSecond });

      createClientMock.mockResolvedValue({
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "therapist-1" },
                  error: null,
                }),
              }),
            };
          }
          if (table === "sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "session-1",
                    appointment_id: "appt-1",
                    started_at: "2026-03-05T12:00:00.000Z",
                    therapist_id: "therapist-1",
                  },
                  error: null,
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: updateEqFirst,
              }),
            };
          }
          if (table === "appointments") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { PATCH } = await import("@/app/api/sessions/[id]/close/route");
      const res = await PATCH(
        new Request("http://localhost/api/sessions/id/close", {
          method: "PATCH",
          body: JSON.stringify({
            notes: "Notas",
            moodBefore: 6,
            moodAfter: 7,
            endedAt: "2026-03-05T13:00:00.000Z",
          }),
        }),
        { params: Promise.resolve({ id: "session-1" }) }
      );
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/video/room", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authUser(null));
      const { POST } = await import("@/app/api/video/room/route");
      const res = await POST(
        new Request("http://localhost/api/video/room", {
          method: "POST",
          body: "{}",
        }) as never
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(authUser("user-1"));
      const { POST } = await import("@/app/api/video/room/route");
      const res = await POST(
        new Request("http://localhost/api/video/room", {
          method: "POST",
          body: "{bad-json",
        }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      createRoomMock.mockResolvedValue({ id: "room-1", name: "room-name", url: "https://daily/room-1" });
      createMeetingTokenMock.mockResolvedValue("token-1");

      createClientMock.mockResolvedValue({
        ...authUser("user-1"),
        from: vi.fn((table: string) => {
          if (table === "appointments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "appt-1",
                    scheduled_at: "2026-03-05T15:00:00.000Z",
                    duration_minutes: 50,
                    therapist: { name: "Dra.", user_id: "user-1" },
                  },
                  error: null,
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          throw new Error(`Unexpected table ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/video/room/route");
      const res = await POST(
        new Request("http://localhost/api/video/room", {
          method: "POST",
          body: JSON.stringify({ appointmentId: "123e4567-e89b-12d3-a456-426614174003" }),
        }) as never
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("returns 403 when user is not appointment owner", async () => {
      createClientMock.mockResolvedValue({
        ...authUser("user-1"),
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "appt-1",
                scheduled_at: "2026-03-05T15:00:00.000Z",
                duration_minutes: 50,
                therapist: { name: "Dra.", user_id: "another-user" },
              },
              error: null,
            }),
          }),
        })),
      });

      const { POST } = await import("@/app/api/video/room/route");
      const res = await POST(
        new Request("http://localhost/api/video/room", {
          method: "POST",
          body: JSON.stringify({ appointmentId: "123e4567-e89b-12d3-a456-426614174003" }),
        }) as never
      );
      expect(res.status).toBe(403);
    });
  });
});
