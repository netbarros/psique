import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const limitMock = vi.fn();
const renderToBufferMock = vi.fn();
const ensureCreditWalletMock = vi.fn();
const getPricebookActionMock = vi.fn();
const consumeCreditsForActionMock = vi.fn();
const getTherapistIdByUserIdMock = vi.fn();

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

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/growth/wallet", () => ({
  ensureCreditWallet: ensureCreditWalletMock,
  getPricebookAction: getPricebookActionMock,
  consumeCreditsForAction: consumeCreditsForActionMock,
  getTherapistIdByUserId: getTherapistIdByUserIdMock,
  WalletError: class WalletError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status = 400) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: renderToBufferMock,
}));

vi.mock("@/lib/pdf/session-report", () => ({
  SessionReportDocument: () => null,
}));

function authClient(userId: string | null, overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId, email: `${userId}@example.com`, user_metadata: {} } : null },
        error: null,
      }),
    },
    ...overrides,
  };
}

function singleRow(row: unknown, error: unknown = null) {
  return {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  };
}

describe("Backend uncovered routes behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    limitMock.mockReset();
    renderToBufferMock.mockReset();
    ensureCreditWalletMock.mockReset();
    getPricebookActionMock.mockReset();
    consumeCreditsForActionMock.mockReset();
    getTherapistIdByUserIdMock.mockReset();

    ensureCreditWalletMock.mockResolvedValue({
      wallet_id: "wallet-1",
      therapist_id: "therapist-1",
      balance_total_credits: 999,
      balance_paid_credits: 999,
      balance_bonus_credits: 0,
      status: "active",
    });
    getPricebookActionMock.mockResolvedValue({
      action_key: "transcription.minute",
      unit_type: "minute",
      unit_cost_credits: 1,
      active: true,
      effective_from: "2026-01-01T00:00:00.000Z",
      effective_to: null,
    });
    consumeCreditsForActionMock.mockResolvedValue({
      id: "usage-1",
      therapist_id: "therapist-1",
      wallet_id: "wallet-1",
      action_key: "transcription.minute",
      units: 1,
      billed_credits: 1,
      ledger_entry_id: "ledger-1",
      correlation_id: "corr-1",
      status: "billed",
      metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
    });
    getTherapistIdByUserIdMock.mockResolvedValue("therapist-1");
  });

  describe("POST /api/ai/transcribe", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { POST } = await import("@/app/api/ai/transcribe/route");
      const res = await POST(
        new Request("http://localhost/api/ai/transcribe", {
          method: "POST",
          body: JSON.stringify({ transcriptText: "texto" }),
        }) as never,
      );
      expect(res.status).toBe(401);
    });

    it("returns 429 when rate limited", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));
      limitMock.mockResolvedValue({ success: false, remaining: 0 });

      const { POST } = await import("@/app/api/ai/transcribe/route");
      const res = await POST(
        new Request("http://localhost/api/ai/transcribe", {
          method: "POST",
          body: JSON.stringify({ transcriptText: "texto" }),
        }) as never,
      );
      expect(res.status).toBe(429);
    });

    it("returns 200 without persistence when sessionId is not provided", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));
      limitMock.mockResolvedValue({ success: true, remaining: 7 });

      const { POST } = await import("@/app/api/ai/transcribe/route");
      const res = await POST(
        new Request("http://localhost/api/ai/transcribe", {
          method: "POST",
          body: JSON.stringify({ transcriptText: "texto livre", source: "manual" }),
        }) as never,
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.persisted).toBe(false);
      expect(body.data.remaining).toBe(7);
    });

    it("returns 200 and persists transcript on happy path", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));
      limitMock.mockResolvedValue({ success: true, remaining: 5 });

      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "session-1", therapist: { user_id: "user-1" } },
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

      const { POST } = await import("@/app/api/ai/transcribe/route");
      const res = await POST(
        new Request("http://localhost/api/ai/transcribe", {
          method: "POST",
          body: JSON.stringify({
            sessionId: "session-1",
            transcriptText: "transcrição",
            source: "upload",
          }),
        }) as never,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.persisted).toBe(true);
    });
  });

  describe("GET /api/audit/events", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { GET } = await import("@/app/api/audit/events/route");
      const res = await GET(new Request("http://localhost/api/audit/events"));
      expect(res.status).toBe(401);
    });

    it("returns 500 when audit query fails", async () => {
      const auditQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: "db fail" } }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "therapists") {
              return { select: vi.fn().mockReturnValue(singleRow({ id: "therapist-1" })) };
            }
            if (table === "audit_logs") {
              return { select: vi.fn().mockReturnValue(auditQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/audit/events/route");
      const res = await GET(new Request("http://localhost/api/audit/events?limit=10"));
      expect(res.status).toBe(500);
    });

    it("returns 200 and maps title on happy path", async () => {
      const auditQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: "event-1",
              action: "create",
              table_name: "patient_journal_entries",
              record_id: "r1",
              created_at: "2026-03-05T00:00:00.000Z",
              ip_address: "127.0.0.1",
              metadata: { source: "portal" },
            },
          ],
          error: null,
        }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "therapists") {
              return { select: vi.fn().mockReturnValue(singleRow({ id: "therapist-1" })) };
            }
            if (table === "audit_logs") {
              return { select: vi.fn().mockReturnValue(auditQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/audit/events/route");
      const res = await GET(new Request("http://localhost/api/audit/events?limit=5"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data[0].title).toBe("Registro de diário");
    });
  });

  describe("POST /api/auth/patient/bootstrap", () => {
    it("returns 400 for non-patient role", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "patient@example.com", user_metadata: { role: "therapist" } } },
            error: null,
          }),
        },
      });
      const { POST } = await import("@/app/api/auth/patient/bootstrap/route");
      const res = await POST();
      expect(res.status).toBe(400);
    });

    it("returns linked false when no matching patient by email", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "patient@example.com", user_metadata: { role: "patient" } } },
            error: null,
          }),
        },
      });
      let patientsFromCalls = 0;
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "user_roles") {
            return {
              upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table !== "patients") throw new Error(`Unexpected table ${table}`);
          patientsFromCalls += 1;
          if (patientsFromCalls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }),
      });

      const { POST } = await import("@/app/api/auth/patient/bootstrap/route");
      const res = await POST();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.linked).toBe(false);
    });

    it("links patient by email and returns success", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "patient@example.com", user_metadata: { role: "patient" } } },
            error: null,
          }),
        },
      });
      let patientsFromCalls = 0;
      createAdminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "user_roles") {
            return {
              upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table !== "patients") throw new Error(`Unexpected table ${table}`);
          patientsFromCalls += 1;
          if (patientsFromCalls === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (patientsFromCalls === 2) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "patient-1" }, error: null }),
              }),
            };
          }
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }),
      });

      const { POST } = await import("@/app/api/auth/patient/bootstrap/route");
      const res = await POST();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.linked).toBe(true);
    });
  });

  describe("GET /api/patient/chat/threads", () => {
    it("returns 403 when patient profile is missing", async () => {
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") return { select: vi.fn().mockReturnValue(singleRow(null)) };
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/chat/threads/route");
      const res = await GET(new Request("http://localhost/api/patient/chat/threads"));
      expect(res.status).toBe(403);
    });

    it("returns 200 on happy path", async () => {
      const threadsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "t1", title: "Thread", last_message_at: null, created_at: "2026-03-05T00:00:00.000Z" }],
          error: null,
        }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1" })) };
            if (table === "patient_chat_threads") return { select: vi.fn().mockReturnValue(threadsQuery) };
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/chat/threads/route");
      const res = await GET(new Request("http://localhost/api/patient/chat/threads?limit=15"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
    });
  });

  describe("GET /api/patient/chat/threads/[id]/messages", () => {
    it("returns 404 when thread does not belong to patient", async () => {
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1" })) };
            if (table === "patient_chat_threads") return { select: vi.fn().mockReturnValue(singleRow(null)) };
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/chat/threads/[id]/messages/route");
      const res = await GET(
        new Request("http://localhost/api/patient/chat/threads/thread-1/messages"),
        { params: Promise.resolve({ id: "thread-1" }) },
      );
      expect(res.status).toBe(404);
    });

    it("returns 200 on happy path", async () => {
      const messagesQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "m1", role: "user", content: "oi", created_at: "2026-03-05T00:00:00.000Z" }],
          error: null,
        }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1" })) };
            if (table === "patient_chat_threads") return { select: vi.fn().mockReturnValue(singleRow({ id: "thread-1" })) };
            if (table === "patient_chat_messages") return { select: vi.fn().mockReturnValue(messagesQuery) };
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/chat/threads/[id]/messages/route");
      const res = await GET(
        new Request("http://localhost/api/patient/chat/threads/thread-1/messages?limit=20"),
        { params: Promise.resolve({ id: "thread-1" }) },
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.messages).toHaveLength(1);
    });
  });

  describe("GET/POST /api/patient/journal", () => {
    it("returns 401 when not linked to a patient", async () => {
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") return { select: vi.fn().mockReturnValue(singleRow(null)) };
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/journal/route");
      const res = await GET(new Request("http://localhost/api/patient/journal"));
      expect(res.status).toBe(401);
    });

    it("returns 200 on GET happy path", async () => {
      const entriesQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "j1", entry_text: "texto", mood_score: 7, created_at: "c1", updated_at: "u1" }],
          error: null,
        }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") {
              return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1", therapist_id: "therapist-1" })) };
            }
            if (table === "patient_journal_entries") {
              return { select: vi.fn().mockReturnValue(entriesQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/journal/route");
      const res = await GET(new Request("http://localhost/api/patient/journal?limit=12"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
    });

    it("returns 200 on POST happy path with mood side-effects", async () => {
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") {
              return {
                select: vi.fn().mockReturnValue(singleRow({ id: "patient-1", therapist_id: "therapist-1", user_id: "user-1" })),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              };
            }
            if (table === "patient_journal_entries") {
              return {
                insert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: "j1",
                        entry_text: "texto",
                        mood_score: 8,
                        created_at: "c1",
                        updated_at: "u1",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            if (table === "patient_mood_entries" || table === "audit_logs") {
              return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { POST } = await import("@/app/api/patient/journal/route");
      const res = await POST(
        new Request("http://localhost/api/patient/journal", {
          method: "POST",
          body: JSON.stringify({ entryText: "texto", moodScore: 8 }),
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("j1");
    });
  });

  describe("GET/POST /api/patient/mood", () => {
    it("returns 200 on GET happy path", async () => {
      const entriesQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "m1", mood_score: 6, note: "ok", source: "manual", created_at: "c1" }],
          error: null,
        }),
      };
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") {
              return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1", therapist_id: "therapist-1" })) };
            }
            if (table === "patient_mood_entries") {
              return { select: vi.fn().mockReturnValue(entriesQuery) };
            }
            throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );
      const { GET } = await import("@/app/api/patient/mood/route");
      const res = await GET(new Request("http://localhost/api/patient/mood"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns 200 on POST happy path", async () => {
      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
            if (table === "patients") {
              return {
                select: vi.fn().mockReturnValue(singleRow({ id: "patient-1", therapist_id: "therapist-1" })),
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
                      data: { id: "m1", mood_score: 8, note: null, source: "manual", created_at: "c1" },
                      error: null,
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
        }),
      );
      const { POST } = await import("@/app/api/patient/mood/route");
      const res = await POST(
        new Request("http://localhost/api/patient/mood", {
          method: "POST",
          body: JSON.stringify({ moodScore: 8 }),
        }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.moodScore).toBe(8);
    });
  });

  describe("GET /api/reports/sessions", () => {
    it("returns 400 when patientId is missing", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));
      const { GET } = await import("@/app/api/reports/sessions/route");
      const res = await GET(new Request("http://localhost/api/reports/sessions") as never);
      expect(res.status).toBe(400);
    });

    it("returns 200 with PDF payload on happy path", async () => {
      renderToBufferMock.mockResolvedValue(Buffer.from("pdf-bytes"));

      const sessionsThenable = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: [
              {
                session_number: 1,
                created_at: "2026-03-05T10:00:00.000Z",
                duration_seconds: 3000,
                mood_before: 5,
                mood_after: 7,
                ai_summary: "ok",
                nps_score: 5,
              },
            ],
            error: null,
          }).then(resolve),
      };

      const paymentsThenable = {
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: [{ amount: 200, paid_at: "2026-03-05T10:00:00.000Z", status: "paid" }],
            error: null,
          }).then(resolve),
      };

      createClientMock.mockResolvedValue(
        authClient("user-1", {
          from: vi.fn((table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(singleRow({ id: "therapist-1", name: "Dra", crp: "123" })) };
        }
        if (table === "patients") {
          return { select: vi.fn().mockReturnValue(singleRow({ id: "patient-1", name: "Pat", email: "p@x.com", cpf: null })) };
        }
        if (table === "sessions") {
          return { select: vi.fn().mockReturnValue(sessionsThenable) };
        }
        if (table === "payments") {
          return { select: vi.fn().mockReturnValue(paymentsThenable) };
        }
        throw new Error(`Unexpected table ${table}`);
          }),
        }),
      );

      const { GET } = await import("@/app/api/reports/sessions/route");
      const res = await GET(
        new Request("http://localhost/api/reports/sessions?patientId=patient-1&from=2026-03-01&to=2026-03-31") as never,
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  describe("PATCH /api/settings/profile", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { PATCH } = await import("@/app/api/settings/profile/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/profile", {
          method: "PATCH",
          body: JSON.stringify({}),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 409 because legacy write endpoint is disabled", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));

      const { PATCH } = await import("@/app/api/settings/profile/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/profile", {
          method: "PATCH",
          body: JSON.stringify({ name: "Dra Nova" }),
        }),
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("LEGACY_ENDPOINT_WRITE_DISABLED");
    });
  });

  describe("PATCH /api/settings/security", () => {
    it("returns 401 when unauthenticated", async () => {
      createClientMock.mockResolvedValue(authClient(null));
      const { PATCH } = await import("@/app/api/settings/security/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/security", {
          method: "PATCH",
          body: JSON.stringify({ blurPatientData: true }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 409 because legacy write endpoint is disabled", async () => {
      createClientMock.mockResolvedValue(authClient("user-1"));

      const { PATCH } = await import("@/app/api/settings/security/route");
      const res = await PATCH(
        new Request("http://localhost/api/settings/security", {
          method: "PATCH",
          body: JSON.stringify({
            encryptRecords: true,
            requireLgpdConsent: true,
            blurPatientData: false,
            cancellationPolicyHours: 48,
          }),
        }),
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("LEGACY_ENDPOINT_WRITE_DISABLED");
    });
  });
});
