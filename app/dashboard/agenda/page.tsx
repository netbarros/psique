import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agenda" };

async function getAgendaData(therapistId: string) {
  const supabase = await createClient();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [appointmentsResult, availabilityResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, duration_minutes, status, type, payment_status, video_room_url,
        patient:patients(id, name, telegram_chat_id)
      `)
      .eq("therapist_id", therapistId)
      .gte("scheduled_at", startOfWeek.toISOString())
      .lte("scheduled_at", endOfWeek.toISOString())
      .not("status", "in", '("cancelled","no_show")')
      .order("scheduled_at"),

    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time")
      .eq("therapist_id", therapistId),
  ]);

  return {
    appointments: appointmentsResult.data ?? [],
    availability: availabilityResult.data ?? [],
    weekStart: startOfWeek,
    weekEnd: endOfWeek,
  };
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    confirmed: { label: "Confirmado", color: "var(--mint)" },
    pending: { label: "Pendente", color: "var(--gold)" },
    in_progress: { label: "Em andamento", color: "var(--blue)" },
    completed: { label: "Concluído", color: "var(--ivoryDD)" },
  };
  return map[status] ?? { label: status, color: "var(--ivoryDD)" };
}

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  const { appointments, weekStart, weekEnd } = await getAgendaData(therapist.id);

  const weekLabel = `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  // Group by day-of-week (0=Mon, 6=Sun)
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const grouped: Record<number, typeof appointments> = {};
  for (let i = 0; i < 7; i++) grouped[i] = [];
  for (const appt of appointments) {
    const d = new Date(appt.scheduled_at);
    const dow = (d.getDay() + 6) % 7; // convert Sun=0 → 0=Mon
    grouped[dow].push(appt);
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Agenda</h1>
          <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>{weekLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, color: "var(--ivoryD)", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}>← Semana anterior</span>
          <span style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, color: "var(--mint)", background: "var(--g1)", border: "1px solid rgba(82,183,136,.3)", cursor: "pointer" }}>Hoje</span>
          <span style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, color: "var(--ivoryD)", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}>Próxima semana →</span>
        </div>
      </div>

      {/* Weekly grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((day, i) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const isToday = date.toDateString() === new Date().toDateString();
          const dayAppts = grouped[i];

          return (
            <div key={day} style={{
              background: "var(--card)", border: isToday ? "1px solid rgba(82,183,136,.4)" : "1px solid var(--border)",
              borderRadius: 16, minHeight: 220, overflow: "hidden",
            }}>
              {/* Day header */}
              <div style={{
                padding: "10px 12px", borderBottom: "1px solid var(--border)",
                background: isToday ? "rgba(82,183,136,.06)" : "transparent",
              }}>
                <div style={{ fontSize: 11, color: "var(--ivoryDD)", textTransform: "uppercase", letterSpacing: ".08em" }}>{day}</div>
                <div style={{
                  fontFamily: "var(--ff)", fontSize: 22, fontWeight: 300,
                  color: isToday ? "var(--mint)" : "var(--ivory)", lineHeight: 1.2,
                }}>
                  {date.getDate()}
                </div>
              </div>

              {/* Appointments */}
              <div style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
                {dayAppts.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--border2)", textAlign: "center", paddingTop: 16 }}>—</div>
                ) : dayAppts.map((appt) => {
                  const time = new Date(appt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const status = statusBadge(appt.status);
                  const patient = appt.patient as unknown as { name: string } | null;
                  return (
                    <div key={appt.id} style={{
                      background: "var(--bg2)", borderRadius: 10, padding: "8px 10px",
                      borderLeft: `3px solid ${status.color}`,
                    }}>
                      <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>{time}</div>
                      <div style={{ fontSize: 12, color: "var(--ivory)", marginTop: 2, fontWeight: 500 }}>
                        {patient?.name ?? "Paciente"}
                      </div>
                      <div style={{ fontSize: 10, color: status.color, marginTop: 2 }}>{status.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        {[
          { label: "Total esta semana", value: appointments.length },
          { label: "Confirmadas", value: appointments.filter(a => a.status === "confirmed").length },
          { label: "Pendentes", value: appointments.filter(a => a.status === "pending").length },
          { label: "Concluídas", value: appointments.filter(a => a.status === "completed").length },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 28, fontWeight: 200, color: "var(--mint)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
