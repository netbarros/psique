import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Minhas Sessões" };

export default async function SessoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!patient) redirect("/dashboard");

  const patientId = (patient as unknown as { id: string }).id;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, session_number, started_at, ended_at, duration_seconds, mood_before, mood_after, nps_score, ai_summary, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const allSessions = (sessions ?? []) as unknown as Array<{
    id: string;
    session_number: number;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    mood_before: number | null;
    mood_after: number | null;
    nps_score: number | null;
    ai_summary: string | null;
    created_at: string;
  }>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 34,
            fontWeight: 200,
            color: "var(--ivory)",
          }}
        >
          Minhas Sessões
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          {allSessions.length} sessões realizadas
        </p>
      </div>

      {/* Stats */}
      {allSessions.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <MiniStat
            label="Total"
            value={String(allSessions.length)}
            color="var(--mint)"
          />
          <MiniStat
            label="NPS Médio"
            value={calcAvg(allSessions)}
            color="var(--gold)"
          />
          <MiniStat
            label="Melhora Humor"
            value={calcMoodImprovement(allSessions)}
            color="var(--blue)"
          />
        </div>
      )}

      {/* Sessions list */}
      {allSessions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎙</div>
          <div
            style={{
              fontSize: 16,
              color: "var(--ivoryD)",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Nenhuma sessão ainda
          </div>
          <div style={{ fontSize: 13, color: "var(--ivoryDD)" }}>
            Suas sessões aparecerão aqui após a primeira consulta.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {allSessions.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 35% 35%, rgba(82,183,136,.25), rgba(82,183,136,.08))",
                      border: "1.5px solid rgba(82,183,136,.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--ff)",
                      fontSize: 16,
                      fontWeight: 300,
                      color: "var(--mint)",
                    }}
                  >
                    {s.session_number}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "var(--ivory)",
                        fontWeight: 500,
                      }}
                    >
                      Sessão #{s.session_number}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ivoryDD)",
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span>{formatDate(s.created_at)}</span>
                      {s.duration_seconds && (
                        <span>
                          {Math.floor(s.duration_seconds / 60)}min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  {/* Mood */}
                  {s.mood_before !== null &&
                    s.mood_before !== undefined &&
                    s.mood_after !== null &&
                    s.mood_after !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--ivoryDD)" }}>
                          😐 {s.mood_before}
                        </span>
                        <span style={{ color: "var(--ivoryDD)" }}>→</span>
                        <span
                          style={{
                            color:
                              s.mood_after > s.mood_before
                                ? "var(--mint)"
                                : "var(--ivoryDD)",
                          }}
                        >
                          😊 {s.mood_after}
                        </span>
                      </div>
                    )}

                  {/* NPS */}
                  {s.nps_score !== null && s.nps_score !== undefined && (
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          style={{
                            fontSize: 14,
                            opacity: n <= s.nps_score! ? 1 : 0.2,
                          }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Summary (non-private parts) */}
              {s.ai_summary && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--bg2)",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    color: "var(--ivoryD)",
                    lineHeight: 1.6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ivoryDD)",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      marginBottom: 6,
                    }}
                  >
                    Resumo da Sessão
                  </div>
                  {s.ai_summary.length > 200
                    ? s.ai_summary.slice(0, 200) + "..."
                    : s.ai_summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--ivoryDD)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 24,
          fontWeight: 200,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function calcAvg(
  sessions: Array<{ nps_score: number | null }>
): string {
  const scored = sessions.filter(
    (s) => s.nps_score !== null && s.nps_score !== undefined
  );
  if (scored.length === 0) return "—";
  const avg =
    scored.reduce((a, s) => a + (s.nps_score ?? 0), 0) / scored.length;
  return `${avg.toFixed(1)}/5`;
}

function calcMoodImprovement(
  sessions: Array<{
    mood_before: number | null;
    mood_after: number | null;
  }>
): string {
  const withMood = sessions.filter(
    (s) =>
      s.mood_before !== null &&
      s.mood_before !== undefined &&
      s.mood_after !== null &&
      s.mood_after !== undefined
  );
  if (withMood.length === 0) return "—";
  const totalImprovement = withMood.reduce(
    (a, s) => a + ((s.mood_after ?? 0) - (s.mood_before ?? 0)),
    0
  );
  const avg = totalImprovement / withMood.length;
  return avg >= 0 ? `+${avg.toFixed(1)}` : avg.toFixed(1);
}
