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

describe("GET /api/cron/reminders branch coverage", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    sendMessageMock.mockReset();
    sendSessionReminderMock.mockReset();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("processes rows without telegram/email/sessionId and still updates flags", async () => {
    let selectCall = 0;

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "appointments") throw new Error(`Unexpected table ${table}`);
        return {
          select: vi.fn().mockImplementation(() => {
            selectCall += 1;
            const rows =
              selectCall === 1
                ? [
                    {
                      id: "appt-24h-no-channel",
                      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      patient: { name: "Sem canal", email: null, telegram_chat_id: null },
                      therapist: { name: "Dra" },
                    },
                  ]
                : selectCall === 2
                  ? [
                      {
                        id: "appt-1h-no-channel",
                        scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                        video_room_url: null,
                        patient: { name: "Sem canal", email: null, telegram_chat_id: null },
                        therapist: { name: "Dra" },
                      },
                    ]
                  : [
                      {
                        id: "appt-nps-no-session",
                        scheduled_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
                        duration_minutes: 50,
                        patient: { name: "Sem chat", telegram_chat_id: null },
                        therapist: { name: "Dra" },
                        session: null,
                      },
                    ];
            return {
              eq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              lte: vi.fn().mockResolvedValue({ data: rows, error: null }),
            };
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }),
    });

    const { GET } = await import("@/app/api/cron/reminders/route");
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        method: "GET",
        headers: { authorization: "Bearer cron-secret" },
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.reminders24h).toBe(1);
    expect(body.reminders1h).toBe(1);
    expect(body.nps).toBe(1);
    expect(body.errors).toBe(0);
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(sendSessionReminderMock).not.toHaveBeenCalled();
  });

  it("counts queue errors when delivery throws across 24h, 1h and NPS", async () => {
    sendMessageMock.mockRejectedValue(new Error("telegram down"));
    sendSessionReminderMock.mockRejectedValue(new Error("email down"));

    let selectCall = 0;

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "appointments") throw new Error(`Unexpected table ${table}`);
        return {
          select: vi.fn().mockImplementation(() => {
            selectCall += 1;
            const rows =
              selectCall === 1
                ? [
                    {
                      id: "appt-24h-error",
                      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      patient: { name: "Paciente", email: "p24@example.com", telegram_chat_id: 1001 },
                      therapist: { name: "Dra" },
                    },
                  ]
                : selectCall === 2
                  ? [
                      {
                        id: "appt-1h-error",
                        scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                        video_room_url: "https://daily.test/room",
                        patient: { name: "Paciente", email: "p1@example.com", telegram_chat_id: 1002 },
                        therapist: { name: "Dra" },
                      },
                    ]
                  : [
                      {
                        id: "appt-nps-error",
                        scheduled_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
                        duration_minutes: 50,
                        patient: { name: "Paciente", telegram_chat_id: 1003 },
                        therapist: { name: "Dra" },
                        session: { id: "session-1", nps_score: null },
                      },
                    ];
            return {
              eq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              lte: vi.fn().mockResolvedValue({ data: rows, error: null }),
            };
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }),
    });

    const { GET } = await import("@/app/api/cron/reminders/route");
    const res = await GET(
      new Request("http://localhost/api/cron/reminders", {
        method: "GET",
        headers: { authorization: "Bearer cron-secret", "x-request-id": "req-cron-errors" },
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.reminders24h).toBe(0);
    expect(body.reminders1h).toBe(0);
    expect(body.nps).toBe(0);
    expect(body.errors).toBe(3);
  });
});
