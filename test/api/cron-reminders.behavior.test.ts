import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const sendMessageMock = vi.fn();
const sendSessionReminderMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: sendMessageMock,
  buildReminderMessage: vi.fn().mockReturnValue("msg"),
  buildNPSMessage: vi.fn().mockReturnValue("nps"),
  buildNPSKeyboard: vi.fn().mockReturnValue({ inline_keyboard: [] }),
}));

vi.mock("@/lib/resend", () => ({
  sendSessionReminder: sendSessionReminderMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeAppointmentsQuery(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

describe("GET /api/cron/reminders", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    sendMessageMock.mockReset();
    sendSessionReminderMock.mockReset();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("returns 401 when authorization header is invalid", async () => {
    const { GET } = await import("@/app/api/cron/reminders/route");
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        method: "GET",
        headers: { authorization: "Bearer wrong" },
      }) as never
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on happy path with empty queues", async () => {
    let appointmentsSelectCalls = 0;
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "appointments") {
          appointmentsSelectCalls += 1;
          if (appointmentsSelectCalls <= 3) {
            return makeAppointmentsQuery([]);
          }
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const { GET } = await import("@/app/api/cron/reminders/route");
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        method: "GET",
        headers: { authorization: "Bearer cron-secret" },
      }) as never
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.errors).toBe(0);
  });

  it("processes 24h, 1h and NPS queues with updates", async () => {
    let selectCall = 0;
    let updateCall = 0;

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "appointments") {
          throw new Error(`Unexpected table ${table}`);
        }

        return {
          select: vi.fn().mockImplementation(() => {
            selectCall += 1;
            const rows =
              selectCall === 1
                ? [
                    {
                      id: "appt-24h",
                      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      patient: { name: "Paciente 24h", email: "p24@example.com", telegram_chat_id: 1001 },
                      therapist: { name: "Dra 24h" },
                    },
                  ]
                : selectCall === 2
                  ? [
                      {
                        id: "appt-1h",
                        scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                        video_room_url: "https://daily.room/1",
                        patient: { name: "Paciente 1h", email: "p1@example.com", telegram_chat_id: 1002 },
                        therapist: { name: "Dra 1h" },
                      },
                    ]
                  : [
                      {
                        id: "appt-nps",
                        scheduled_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
                        duration_minutes: 50,
                        patient: { name: "Paciente NPS", telegram_chat_id: 1003 },
                        therapist: { name: "Dra NPS" },
                        session: { id: "session-nps", nps_score: null },
                      },
                    ];

            return {
              eq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              lte: vi.fn().mockResolvedValue({ data: rows, error: null }),
            };
          }),
          update: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({
              data: { id: `updated-${++updateCall}` },
              error: null,
            }),
          })),
        };
      }),
    });

    const { GET } = await import("@/app/api/cron/reminders/route");
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        method: "GET",
        headers: { authorization: "Bearer cron-secret", "x-request-id": "req-1" },
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.reminders24h).toBe(1);
    expect(body.reminders1h).toBe(1);
    expect(body.nps).toBe(1);
    expect(body.errors).toBe(0);
    expect(sendMessageMock).toHaveBeenCalled();
    expect(sendSessionReminderMock).toHaveBeenCalled();
  });
});
