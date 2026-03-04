import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, formatBRL } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

export default async function PatientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, therapist_id, mood_score")
    .eq("user_id", user.id)
    .single();
  if (!patient) redirect("/dashboard");

  const therapistId = (patient as unknown as { therapist_id: string }).therapist_id;
  const patientId = (patient as unknown as { id: string }).id;
  const patientName = (patient as unknown as { name: string }).name;
  const moodScore = (patient as unknown as { mood_score: number | null }).mood_score;

  // Fetch therapist info
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, session_price, session_duration")
    .eq("id", therapistId)
    .single();

  const t = therapist as unknown as {
    name: string;
    session_price: number;
    session_duration: number;
  } | null;

  // Upcoming appointments
  const { data: upcoming } = await supabase
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, type, status, video_room_url")
    .eq("patient_id", patientId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
    .limit(5);

  const appointments = (upcoming ?? []) as unknown as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    video_room_url: string | null;
  }>;

  // Recent sessions
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, session_number, nps_score, mood_before, mood_after, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(3);

  const sessions = (recentSessions ?? []) as unknown as Array<{
    id: string;
    session_number: number;
    nps_score: number | null;
    mood_before: number | null;
    mood_after: number | null;
    created_at: string;
  }>;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 36,
            fontWeight: 200,
            color: "var(--ivory)",
            lineHeight: 1.1,
          }}
        >
          {greeting},{" "}
          <em style={{ color: "var(--mint)" }}>
            {patientName.split(" ")[0]}
          </em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 6 }}>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          {t && (
            <span>
              {" · "}Terapeuta: <span style={{ color: "var(--blue)" }}>{t.name}</span>
            </span>
          )}
        </p>
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Próximas Sessões"
          value={String(appointments.length)}
          color="var(--mint)"
          icon="📅"
        />
        <StatCard
          label="Sessões Realizadas"
          value={String(sessions.length)}
          color="var(--blue)"
          icon="🎙"
        />
        <StatCard
          label="Humor"
          value={
            moodScore !== null && moodScore !== undefined
              ? `${moodScore}/5`
              : "—"
          }
          color="var(--gold)"
          icon="💛"
        />
      </div>

      {/* Upcoming appointments */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ff)",
              fontSize: 22,
              fontWeight: 300,
              color: "var(--ivory)",
            }}
          >
            Próximas Sessões
          </h2>
          <Link
            href="/portal/agendar"
            style={{
              padding: "8px 18px",
              background: "var(--mint)",
              color: "#060E09",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + Agendar
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "28px",
              color: "var(--ivoryDD)",
              fontSize: 14,
            }}
          >
            Nenhuma sessão agendada.{" "}
            <Link
              href="/portal/agendar"
              style={{ color: "var(--mint)", fontWeight: 500 }}
            >
              Agende agora
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {appointments.map((appt) => {
              const date = new Date(appt.scheduled_at);
              const time = date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const day = date.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              });
              const isOnline = appt.type === "online";
              const statusColor =
                appt.status === "confirmed" ? "var(--mint)" : "var(--gold)";

              return (
                <div
                  key={appt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 18px",
                    background: "var(--bg2)",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--ff)",
                      fontSize: 22,
                      fontWeight: 300,
                      color: "var(--gold)",
                      minWidth: 52,
                    }}
                  >
                    {time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--ivory)",
                        fontWeight: 500,
                      }}
                    >
                      {day}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
                      {isOnline ? "🎥 Online" : "🏢 Presencial"} ·{" "}
                      {appt.duration_minutes}min
                      {t && ` · ${formatBRL(Number(t.session_price))}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${statusColor}1A`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                      }}
                    >
                      {appt.status === "confirmed"
                        ? "Confirmado"
                        : "Pendente"}
                    </span>
                    {appt.video_room_url && (
                      <a
                        href={appt.video_room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 14px",
                          background: "var(--mint)",
                          color: "#060E09",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Entrar
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--ff)",
                fontSize: 22,
                fontWeight: 300,
                color: "var(--ivory)",
              }}
            >
              Sessões Recentes
            </h2>
            <Link
              href="/portal/sessoes"
              style={{
                fontSize: 13,
                color: "var(--ivoryDD)",
                textDecoration: "none",
              }}
            >
              Ver todas →
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--bg2)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 35% 35%, rgba(82,183,136,.25), rgba(82,183,136,.08))",
                      border: "1.5px solid rgba(82,183,136,.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--ff)",
                      fontSize: 14,
                      fontWeight: 300,
                      color: "var(--mint)",
                    }}
                  >
                    {s.session_number}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ivory)",
                        fontWeight: 500,
                      }}
                    >
                      Sessão #{s.session_number}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ivoryDD)" }}>
                      {formatDate(s.created_at)}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    fontSize: 12,
                  }}
                >
                  {s.mood_before !== null &&
                    s.mood_before !== undefined &&
                    s.mood_after !== null &&
                    s.mood_after !== undefined && (
                      <span style={{ color: "var(--ivoryDD)" }}>
                        😐 {s.mood_before} → 😊 {s.mood_after}
                      </span>
                    )}
                  {s.nps_score !== null && s.nps_score !== undefined && (
                    <span style={{ color: "var(--gold)" }}>
                      ⭐ {s.nps_score}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {[
          {
            icon: "📅",
            label: "Agendar Sessão",
            desc: "Encontre o melhor horário",
            href: "/portal/agendar",
            color: "var(--mint)",
          },
          {
            icon: "🧠",
            label: "Chat IA",
            desc: "Converse com a IA clínica",
            href: "/portal/chat",
            color: "var(--purple)",
          },
          {
            icon: "💚",
            label: "Espaço de Apoio",
            desc: "Reflexão e bem-estar",
            href: "/portal/apoio",
            color: "var(--gold)",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px 24px",
              textDecoration: "none",
              transition: "all .2s var(--ease-out)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{action.icon}</div>
            <div
              style={{
                fontSize: 14,
                color: action.color,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {action.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
              {action.desc}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "18px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--ivoryDD)",
          marginBottom: 6,
        }}
      >
        <span>{icon}</span> {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 28,
          fontWeight: 200,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
