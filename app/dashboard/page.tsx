import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatBRL } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData(therapistId: string) {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [patientsResult, sessionsThisMonth, sessionsLastMonth, paymentsThisMonth, paymentsLastMonth, upcomingToday] =
    await Promise.all([
      // Active patients
      supabase.from("patients").select("id, status, mood_score").eq("therapist_id", therapistId).in("status", ["active", "new"]),
      // Sessions this month
      supabase.from("sessions").select("id, nps_score").eq("therapist_id", therapistId).gte("created_at", startOfMonth),
      // Sessions last month
      supabase.from("sessions").select("id, nps_score").eq("therapist_id", therapistId).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      // Revenue this month
      supabase.from("payments").select("amount").eq("therapist_id", therapistId).eq("status", "paid").gte("created_at", startOfMonth),
      // Revenue last month
      supabase.from("payments").select("amount").eq("therapist_id", therapistId).eq("status", "paid").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      // Today's appointments
      supabase
        .from("appointments")
        .select(`
          id, scheduled_at, status, type,
          patient:patients(name, telegram_chat_id)
        `)
        .eq("therapist_id", therapistId)
        .gte("scheduled_at", new Date(now.setHours(0, 0, 0, 0)).toISOString())
        .lte("scheduled_at", new Date(now.setHours(23, 59, 59, 999)).toISOString())
        .order("scheduled_at"),
    ]);

  const activePatients = patientsResult.data?.length ?? 0;
  const sessionsCount = sessionsThisMonth.data?.length ?? 0;
  const sessionsCountLast = sessionsLastMonth.data?.length ?? 0;

  const mrr = paymentsThisMonth.data?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const mrrLast = paymentsLastMonth.data?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const mrrDelta = mrrLast > 0 ? ((mrr - mrrLast) / mrrLast) * 100 : 0;

  const npsScores = (sessionsThisMonth.data ?? []).filter((s) => s.nps_score !== null).map((s) => s.nps_score!);
  const npsAvg = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;

  return {
    mrr,
    mrrDelta,
    sessionsCount,
    sessionsDelta: sessionsCountLast > 0 ? sessionsCount - sessionsCountLast : 0,
    activePatients,
    npsAvg: Math.round(npsAvg * 20), // Convert 1-5 → 0-100
    todayAppointments: upcomingToday.data ?? [],
  };
}

function KPICard({
  label, value, delta, sub, color = "var(--mint)",
}: { label: string; value: string; delta?: number; sub?: string; color?: string }) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 28px",
    }}>
      <div style={{ fontSize: 12, color: "var(--ivoryDD)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--ff)", fontSize: 36, fontWeight: 200, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 12, color: isPositive ? "var(--mint)" : "var(--red)" }}>
          {isPositive ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}{sub ?? "%"} vs mês anterior
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (!therapist) redirect("/auth/login");
  if (!therapist.onboarding_completed) redirect("/dashboard/onboarding");

  const kpis = await getDashboardData(therapist.id);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--ff)", fontSize: 38, fontWeight: 200, color: "var(--ivory)", lineHeight: 1.1 }}>
          {greeting}, <em style={{ color: "var(--mint)" }}>{therapist.name.split(" ")[0]}</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 6 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <KPICard label="MRR" value={formatBRL(kpis.mrr)} delta={kpis.mrrDelta} color="var(--gold)" />
        <KPICard label="Sessões" value={String(kpis.sessionsCount)} delta={kpis.sessionsDelta} sub="" color="var(--mint)" />
        <KPICard label="Pacientes Ativos" value={String(kpis.activePatients)} color="var(--blue)" />
        <KPICard label="NPS Médio" value={`${kpis.npsAvg}/100`} color="var(--purple)" />
      </div>

      {/* Today's agenda */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 28px" }}>
        <h2 style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 300, color: "var(--ivory)", marginBottom: 20 }}>
          Agenda de Hoje
        </h2>
        {kpis.todayAppointments.length === 0 ? (
          <p style={{ color: "var(--ivoryDD)", fontSize: 14 }}>Nenhuma sessão agendada para hoje.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {kpis.todayAppointments.map((appt) => {
              const time = new Date(appt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const patient = appt.patient as unknown as { name: string } | null;
              const statusColor =
                appt.status === "confirmed" ? "var(--mint)" :
                appt.status === "in_progress" ? "var(--gold)" : "var(--ivoryDD)";
              return (
                <div key={appt.id} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                  background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)",
                }}>
                  <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 300, color: "var(--gold)", minWidth: 52 }}>{time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}>{patient?.name ?? "Paciente"}</div>
                    <div style={{ fontSize: 12, color: "var(--ivoryDD)" }}>{appt.type === "online" ? "🎥 Online" : "🏢 Presencial"}</div>
                  </div>
                  <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: `${statusColor}1A`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                    {appt.status === "confirmed" ? "Confirmado" : appt.status === "in_progress" ? "Em andamento" : appt.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
