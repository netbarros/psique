import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const limitMock = vi.fn();
const chatWithContextMock = vi.fn();
const generatePatientInsightsMock = vi.fn();
const generateSessionSummaryMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/ratelimit", () => ({
  getAIRatelimiter: () => ({
    limit: limitMock,
  }),
}));

vi.mock("@/lib/openrouter", () => ({
  chatWithContext: chatWithContextMock,
  generatePatientInsights: generatePatientInsightsMock,
  generateSessionSummary: generateSessionSummaryMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeAuthClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  };
}

describe("AI routes behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    limitMock.mockReset();
    chatWithContextMock.mockReset();
    generatePatientInsightsMock.mockReset();
    generateSessionSummaryMock.mockReset();
  });

  describe("POST /api/ai/chat", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(makeAuthClient(null));
      const { POST } = await import("@/app/api/ai/chat/route");
      const req = new Request("http://localhost/api/ai/chat", { method: "POST", body: "{}" });
      const res = await POST(req as never);
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      const supabase = {
        ...makeAuthClient("user-1"),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });

      const { POST } = await import("@/app/api/ai/chat/route");
      const req = new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: "{invalid-json",
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      const therapistQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ai_model: null }, error: null }),
      };
      const patientQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "patient-1", name: "Paciente", therapist_id: "therapist-1" },
          error: null,
        }),
      };
      const supabase = {
        ...makeAuthClient("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") return { select: vi.fn().mockReturnValue(patientQuery) };
          if (table === "therapists") return { select: vi.fn().mockReturnValue(therapistQuery) };
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      chatWithContextMock.mockResolvedValue("ok");

      const { POST } = await import("@/app/api/ai/chat/route");
      const req = new Request("http://localhost/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "oi" }],
        }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.reply).toBe("ok");
      expect(json.data.ai?.provider).toBe("openrouter");
      expect(json.data.ai?.model).toBe("anthropic/claude-3-haiku");
    });

    it("returns 429 when rate limited", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: false });
      const { POST } = await import("@/app/api/ai/chat/route");
      const req = new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(429);
    });

    it("returns explicit configuration error when OpenRouter key is missing", async () => {
      const therapistQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ai_model: null, openrouter_key_hash: null },
          error: null,
        }),
      };
      const patientQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "patient-1", name: "Paciente", therapist_id: "therapist-1" },
          error: null,
        }),
      };
      const supabase = {
        ...makeAuthClient("user-1"),
        from: vi.fn((table: string) => {
          if (table === "patients") return { select: vi.fn().mockReturnValue(patientQuery) };
          if (table === "therapists") return { select: vi.fn().mockReturnValue(therapistQuery) };
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      chatWithContextMock.mockRejectedValueOnce(new Error("[OpenRouter] Missing usable OPENROUTER_API_KEY"));

      const { POST } = await import("@/app/api/ai/chat/route");
      const req = new Request("http://localhost/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("AI_NOT_CONFIGURED");
    });
  });

  describe("POST /api/ai/insights", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(makeAuthClient(null));
      const { POST } = await import("@/app/api/ai/insights/route");
      const req = new Request("http://localhost/api/ai/insights", { method: "POST" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      const { POST } = await import("@/app/api/ai/insights/route");
      const req = new Request("http://localhost/api/ai/insights", {
        method: "POST",
        body: "{bad-json",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      const therapistsQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "therapist-1",
            ai_model: null,
            openrouter_key_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          error: null,
        }),
      };
      const patientsQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              name: "Paciente A",
              tags: [],
              mood_score: 7,
              status: "active",
              sessions: [],
            },
          ],
          error: null,
        }),
      };
      const supabase = {
        ...makeAuthClient("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") return { select: vi.fn().mockReturnValue(therapistsQuery) };
          if (table === "patients") return { select: vi.fn().mockReturnValue(patientsQuery) };
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      generatePatientInsightsMock.mockResolvedValue({
        insights: ["insight"],
        recommendations: [],
        alerts: [],
      });

      const { POST } = await import("@/app/api/ai/insights/route");
      const req = new Request("http://localhost/api/ai/insights", {
        method: "POST",
        body: JSON.stringify({ patientLimit: 10 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.insights).toContain("insight");
      expect(json.data.ai?.provider).toBe("openrouter");
      expect(json.data.ai?.model).toBe("anthropic/claude-3.5-sonnet");
      expect(generatePatientInsightsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "anthropic/claude-3.5-sonnet",
        })
      );
    });

    it("returns 429 when rate limited", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: false });
      const { POST } = await import("@/app/api/ai/insights/route");
      const req = new Request("http://localhost/api/ai/insights", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(429);
    });

    it("returns explicit provider auth error when OpenRouter rejects credentials", async () => {
      const therapistsQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "therapist-1", ai_model: null, openrouter_key_hash: "sk-or-v1-invalid" },
          error: null,
        }),
      };
      const patientsQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ name: "Paciente A", tags: [], mood_score: 5, status: "active", sessions: [] }],
          error: null,
        }),
      };
      const supabase = {
        ...makeAuthClient("user-1"),
        from: vi.fn((table: string) => {
          if (table === "therapists") return { select: vi.fn().mockReturnValue(therapistsQuery) };
          if (table === "patients") return { select: vi.fn().mockReturnValue(patientsQuery) };
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
      createClientMock.mockResolvedValue(supabase);
      limitMock.mockResolvedValue({ success: true });
      generatePatientInsightsMock.mockRejectedValueOnce({
        message: "Invalid API key",
        status: 401,
      });

      const { POST } = await import("@/app/api/ai/insights/route");
      const req = new Request("http://localhost/api/ai/insights", {
        method: "POST",
        body: JSON.stringify({ patientLimit: 5 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("AI_PROVIDER_AUTH");
    });
  });

  describe("POST /api/ai/summarize", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(makeAuthClient(null));
      const { POST } = await import("@/app/api/ai/summarize/route");
      const req = new Request("http://localhost/api/ai/summarize", {
        method: "POST",
        body: "{}",
      });
      const res = await POST(req as never);
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed json", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: true, remaining: 9 });
      const { POST } = await import("@/app/api/ai/summarize/route");
      const req = new Request("http://localhost/api/ai/summarize", {
        method: "POST",
        body: "{bad",
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });

    it("returns 200 on happy path", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: true, remaining: 9 });
      generateSessionSummaryMock.mockResolvedValue({
        summary: "Resumo",
        insights: [],
        nextSteps: [],
        riskFlags: [],
      });

      const sessionsSelectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          patient_id: "patient-1",
          session_number: 1,
          therapist: { user_id: "user-1", ai_model: null },
          patient: { name: "Paciente" },
        },
        error: null,
      });
      const sessionsHistoryQuery = {
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const sessionsUpdateQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "sessions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn().mockReturnValue({
                  single: sessionsSelectSingle,
                  not: sessionsHistoryQuery.not,
                  order: sessionsHistoryQuery.order,
                  limit: sessionsHistoryQuery.limit,
                }),
                not: sessionsHistoryQuery.not,
                order: sessionsHistoryQuery.order,
                limit: sessionsHistoryQuery.limit,
              })),
              update: vi.fn().mockReturnValue(sessionsUpdateQuery),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/ai/summarize/route");
      const req = new Request("http://localhost/api/ai/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: "123e4567-e89b-12d3-a456-426614174000",
          notes: "Notas da sessão",
        }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.summary).toBe("Resumo");
      expect(json.data.ai?.provider).toBe("openrouter");
      expect(json.data.ai?.model).toBe("anthropic/claude-3.5-sonnet");
    });

    it("returns 429 when rate limited", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: false, remaining: 0 });
      const { POST } = await import("@/app/api/ai/summarize/route");
      const req = new Request("http://localhost/api/ai/summarize", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "123e4567-e89b-12d3-a456-426614174000",
          notes: "x",
        }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(429);
    });

    it("returns explicit configuration error when OpenRouter key is missing", async () => {
      createClientMock.mockResolvedValue(makeAuthClient("user-1"));
      limitMock.mockResolvedValue({ success: true, remaining: 9 });
      generateSessionSummaryMock.mockRejectedValueOnce(new Error("[OpenRouter] Missing usable OPENROUTER_API_KEY"));

      const sessionsSelectSingle = vi.fn().mockResolvedValue({
        data: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          patient_id: "patient-1",
          session_number: 1,
          therapist: { user_id: "user-1", ai_model: null, openrouter_key_hash: null },
          patient: { name: "Paciente" },
        },
        error: null,
      });
      const sessionsHistoryQuery = {
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const sessionsUpdateQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "sessions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn().mockReturnValue({
                  single: sessionsSelectSingle,
                  not: sessionsHistoryQuery.not,
                  order: sessionsHistoryQuery.order,
                  limit: sessionsHistoryQuery.limit,
                }),
                not: sessionsHistoryQuery.not,
                order: sessionsHistoryQuery.order,
                limit: sessionsHistoryQuery.limit,
              })),
              update: vi.fn().mockReturnValue(sessionsUpdateQuery),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      });

      const { POST } = await import("@/app/api/ai/summarize/route");
      const req = new Request("http://localhost/api/ai/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: "123e4567-e89b-12d3-a456-426614174000",
          notes: "Notas da sessão",
        }),
      });
      const res = await POST(req as never);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("AI_NOT_CONFIGURED");
    });
  });
});
