import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const renderToBufferMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: renderToBufferMock,
}));

vi.mock("@/lib/pdf/session-report", () => ({
  SessionReportDocument: () => null,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function authClient(userId: string | null, fromImpl?: (table: string) => unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (!fromImpl) throw new Error(`Unexpected table ${table}`);
      return fromImpl(table);
    }),
  };
}

function singleQuery(data: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function thenableQuery(result: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: result, error: null }).then(resolve),
  };
}

describe("GET /api/reports/sessions branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    renderToBufferMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    createClientMock.mockResolvedValue(authClient(null));
    const { GET } = await import("@/app/api/reports/sessions/route");
    const res = await GET(new Request("http://localhost/api/reports/sessions?patientId=p1") as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 when therapist profile is not found", async () => {
    createClientMock.mockResolvedValue(
      authClient("user-1", (table: string) => {
        if (table === "therapists") return { select: vi.fn().mockReturnValue(singleQuery(null)) };
        throw new Error(`Unexpected table ${table}`);
      }),
    );

    const { GET } = await import("@/app/api/reports/sessions/route");
    const res = await GET(new Request("http://localhost/api/reports/sessions?patientId=p1") as never);
    expect(res.status).toBe(403);
  });

  it("returns 404 when patient does not belong to therapist", async () => {
    createClientMock.mockResolvedValue(
      authClient("user-1", (table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(singleQuery({ id: "therapist-1", name: "Dra", crp: "123" })) };
        }
        if (table === "patients") return { select: vi.fn().mockReturnValue(singleQuery(null)) };
        throw new Error(`Unexpected table ${table}`);
      }),
    );

    const { GET } = await import("@/app/api/reports/sessions/route");
    const res = await GET(new Request("http://localhost/api/reports/sessions?patientId=p1") as never);
    expect(res.status).toBe(404);
  });

  it("returns 500 when PDF render fails", async () => {
    renderToBufferMock.mockRejectedValue(new Error("pdf render failed"));

    createClientMock.mockResolvedValue(
      authClient("user-1", (table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(singleQuery({ id: "therapist-1", name: "Dra", crp: "123" })) };
        }
        if (table === "patients")
          return {
            select: vi
              .fn()
              .mockReturnValue(singleQuery({ id: "patient-1", name: "Pat", email: "p@example.com", cpf: null })),
          };
        if (table === "sessions") return thenableQuery([]);
        if (table === "payments") return thenableQuery([]);
        throw new Error(`Unexpected table ${table}`);
      }),
    );

    const { GET } = await import("@/app/api/reports/sessions/route");
    const res = await GET(new Request("http://localhost/api/reports/sessions?patientId=patient-1") as never);
    expect(res.status).toBe(500);
  });

  it("returns 200 with patientId only and no date filters", async () => {
    renderToBufferMock.mockResolvedValue(Buffer.from("pdf"));

    const sessionsQuery = {
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

    const paymentsQuery = thenableQuery([{ amount: 200, paid_at: "2026-03-05T10:00:00.000Z", status: "paid" }]);

    createClientMock.mockResolvedValue(
      authClient("user-1", (table: string) => {
        if (table === "therapists") {
          return { select: vi.fn().mockReturnValue(singleQuery({ id: "therapist-1", name: "Dra", crp: "123" })) };
        }
        if (table === "patients")
          return {
            select: vi
              .fn()
              .mockReturnValue(singleQuery({ id: "patient-1", name: "Pat", email: "p@example.com", cpf: null })),
          };
        if (table === "sessions") return { select: vi.fn().mockReturnValue(sessionsQuery) };
        if (table === "payments") return { select: vi.fn().mockReturnValue(paymentsQuery) };
        throw new Error(`Unexpected table ${table}`);
      }),
    );

    const { GET } = await import("@/app/api/reports/sessions/route");
    const res = await GET(new Request("http://localhost/api/reports/sessions?patientId=patient-1") as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    expect(sessionsQuery.gte).not.toHaveBeenCalled();
    expect(sessionsQuery.lte).not.toHaveBeenCalled();
  });
});
