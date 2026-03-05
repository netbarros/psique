import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatBRL } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

type AppointmentPatient =
  | { name?: string | null; telegram_chat_id?: string | null }
  | Array<{ name?: string | null; telegram_chat_id?: string | null }>
  | null;

type DashboardAppointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  type: string;
  video_room_id: string | null;
  patient: AppointmentPatient;
};

type DashboardData = {
  mrr: number;
  mrrDelta: number;
  sessionsCount: number;
  sessionsDelta: number;
  activePatients: number;
  npsAvg: number;
  todayAppointments: DashboardAppointment[];
  attendanceRate: number;
  attendanceDelta: number;
};

const numberFormat = new Intl.NumberFormat("pt-BR");

function getPatientName(patient: AppointmentPatient): string {
  if (!patient) return "Paciente";
  if (Array.isArray(patient)) return patient[0]?.name ?? "Paciente";
  return patient.name ?? "Paciente";
}

function formatHourMinute(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getDashboardData(therapistId: string) {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [patientsResult, sessionsThisMonth, sessionsLastMonth, paymentsThisMonth, paymentsLastMonth, upcomingToday] =
    await Promise.all([
      supabase.from("patients").select("id, status, mood_score").eq("therapist_id", therapistId).in("status", ["active", "new"]),
      supabase.from("sessions").select("id, nps_score").eq("therapist_id", therapistId).gte("created_at", startOfMonth),
      supabase.from("sessions").select("id, nps_score").eq("therapist_id", therapistId).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      supabase.from("payments").select("amount").eq("therapist_id", therapistId).eq("status", "paid").gte("created_at", startOfMonth),
      supabase.from("payments").select("amount").eq("therapist_id", therapistId).eq("status", "paid").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      supabase
        .from("appointments")
        .select(`
          id, scheduled_at, duration_minutes, status, type,
          video_room_id,
          patient:patients(name, telegram_chat_id)
        `)
        .eq("therapist_id", therapistId)
        .gte("scheduled_at", startOfToday.toISOString())
        .lte("scheduled_at", endOfToday.toISOString())
        .not("status", "in", '("cancelled","no_show")')
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
  const todayAppointments = (upcomingToday.data ?? []) as DashboardAppointment[];

  /* Session attendance (completed vs scheduled today) */
  const completedToday = todayAppointments.filter((a) => a.status === "completed").length;
  const totalToday = todayAppointments.length;
  const attendanceRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return {
    mrr,
    mrrDelta,
    sessionsCount,
    sessionsDelta: sessionsCountLast > 0 ? sessionsCount - sessionsCountLast : 0,
    activePatients,
    npsAvg: Math.round(npsAvg * 10) / 10,
    todayAppointments,
    attendanceRate,
    attendanceDelta: 0,
  } satisfies DashboardData;
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
  const todayDateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const now = new Date();
  const schedule = kpis.todayAppointments.map((appt) => {
    const startsAt = new Date(appt.scheduled_at);
    const duration = appt.duration_minutes ?? 50;
    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

    const isPast = appt.status === "completed" || now > endsAt;
    const isActive = appt.status === "in_progress" || (!isPast && now >= startsAt && now <= endsAt);
    const phase = isPast ? "past" : isActive ? "active" : "future";

    return {
      id: appt.id,
      roomId: appt.video_room_id,
      patientName: getPatientName(appt.patient),
      status: appt.status,
      type: appt.type,
      startsAt,
      endsAt,
      phase,
    };
  });

  const upNext = schedule.find((slot) => slot.phase !== "past") ?? null;
  const mrrDeltaLabel = `${kpis.mrrDelta >= 0 ? "+" : ""}${Math.round(kpis.mrrDelta)}%`;

  return (
    <div className="flex flex-1 flex-col space-y-6 p-4 pb-20">
      {/* ═══════ Greeting — Stitch S01 ═══════ */}
      <section className="space-y-1">
        <h2 className="font-display text-[32px] font-semibold text-text-primary">
          {greeting}, Dr. {therapist.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-text-muted">
          Visão clínica do dia: {todayDateStr}
        </p>
      </section>

      {/* ═══════ KPI Grid — 2 cols (MRR + NPS) ═══════ */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group min-h-[110px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">MRR</span>
            <span className="material-symbols-outlined text-[16px] text-brand">trending_up</span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold text-text-primary">{formatBRL(kpis.mrr)}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">arrow_upward</span> {mrrDeltaLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group min-h-[110px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">NPS</span>
            <span className="material-symbols-outlined text-[16px] text-gold">star</span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold text-text-primary">{kpis.npsAvg.toFixed(1)}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-text-muted">Média últimos 30 dias</span>
            </div>
          </div>
        </div>

        {/* Session Attendance — full-width */}
        <div className="col-span-2 bg-surface border border-border-subtle rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">Session Attendance</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text-primary">{kpis.attendanceRate}%</span>
              <span className="text-xs text-brand">+{kpis.attendanceDelta}% vs anterior</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-brand/20 border-t-brand">
            <span className="material-symbols-outlined text-brand">check_circle</span>
          </div>
        </div>
      </section>

      {/* ═══════ Up Next Card — Stitch S01 ═══════ */}
      <section 
        className="relative overflow-hidden rounded-2xl border border-brand/30 bg-linear-to-br from-bg-elevated to-surface p-5 shadow-[0_0_15px_rgba(82,183,136,0.05)]"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/5 blur-xl" />
        <div className="relative z-10 mb-4 flex items-start justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Up Next
            </span>
            {upNext ? (
              <>
                <h3 className="font-display text-xl font-semibold leading-tight text-text-primary">{upNext.patientName}</h3>
                <p className="mt-1 flex items-center gap-1 text-[14px] text-text-secondary">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {formatHourMinute(upNext.startsAt.toISOString())} - {formatHourMinute(upNext.endsAt.toISOString())}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-[26px] font-semibold leading-tight text-text-primary">Sem sessões pendentes</h3>
                <p className="mt-1 text-[14px] text-text-secondary">Sua agenda de hoje está concluída.</p>
              </>
            )}
          </div>
          {upNext && (
            <div className="text-right">
              <span className="block text-xs text-text-muted">Sessão #</span>
              <span className="mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">
                {upNext.type === "online" ? "Online" : "Presencial"}
              </span>
            </div>
          )}
        </div>
        <div className="relative z-10 flex gap-3">
          {upNext ? (
            <Link
              href={`/dashboard/consulta/${upNext.roomId ?? upNext.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 px-4 font-semibold text-bg-base shadow-[0_4px_10px_rgba(82,183,136,0.2)] transition-all hover:bg-brand-hover"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
              Entrar na sessão
            </Link>
          ) : (
            <Link
              href="/dashboard/agenda"
              className="flex flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              Abrir agenda
            </Link>
          )}
          <Link
            href="/dashboard/pacientes"
            className="flex items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 py-3 text-text-primary transition-colors hover:bg-border-subtle"
            aria-label="Notas do paciente"
          >
            <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
          </Link>
        </div>
      </section>

      {/* ═══════ Today's Schedule — Stitch S01 ═══════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-semibold text-text-primary">Agenda de Hoje</h3>
          <Link className="text-[13px] font-medium text-brand hover:text-brand-hover transition-colors" href="/dashboard/agenda">
            Ver tudo
          </Link>
        </div>

        <div className="space-y-3">
          {schedule.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 text-sm text-text-secondary">
              Nenhuma sessão registrada para hoje.
            </div>
          ) : (
            schedule.map((slot) => {
              const isPast = slot.phase === "past";
              const isActive = slot.phase === "active";

              return (
                <div key={slot.id} className={`flex gap-4 relative ${isPast ? "opacity-50" : ""}`}>
                  {/* Connector line */}
                  {isActive && (
                    <div className="absolute left-[54px] top-1/2 bottom-0 w-px bg-linear-to-b from-brand/50 to-transparent -z-10" />
                  )}

                  {/* Time column */}
                  <div className="w-12 pt-1 text-right">
                    <span className={`text-xs font-medium ${isActive ? "text-brand" : "text-text-muted"}`}>
                      {formatHourMinute(slot.startsAt.toISOString())}
                    </span>
                  </div>

                  {/* Session card */}
                  <div className={`flex flex-1 items-center justify-between p-3 rounded-xl ${
                    isActive
                      ? "border border-brand/30 bg-surface"
                      : "border border-border-subtle bg-bg-elevated"
                  }`}>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{slot.patientName}</p>
                      <p className={`text-xs ${isActive ? "text-brand" : "text-text-muted"}`}>
                        {isActive ? "Starting now" : isPast ? "Completed" : slot.type === "online" ? "Online" : "Presencial"}
                      </p>
                    </div>

                    {/* Right indicator */}
                    {isPast ? (
                      <span className="material-symbols-outlined text-text-muted">check</span>
                    ) : isActive ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                        <span className="material-symbols-outlined text-[16px] text-brand">videocam</span>
                      </div>
                    ) : slot.status === "new" ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ═══════ AI Clinical Insights — Stitch S01 ═══════ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-gold text-xl">auto_awesome</span>
          <h3 className="font-display text-xl font-semibold text-text-primary">AI Clinical Insights</h3>
        </div>

        <div className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10">
              <span className="material-symbols-outlined text-[16px] text-blue-400">psychology</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Padrão detectado</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                {kpis.activePatients > 0
                  ? `${numberFormat.format(kpis.activePatients)} pacientes ativos com tendência de frequência estável neste ciclo.`
                  : "Ainda não há pacientes ativos suficientes para análise estatística."}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-border-subtle" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10">
              <span className="material-symbols-outlined text-[16px] text-brand">summarize</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {kpis.sessionsCount > 0 ? `${kpis.sessionsCount} resumos prontos` : "Nenhum resumo pendente"}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {kpis.sessionsCount > 0
                  ? "IA gerou notas clínicas das sessões recentes."
                  : "Sem sessões no mês para sumarização automatizada."}
              </p>
              {kpis.sessionsCount > 0 && (
                <div className="mt-2">
                  <Link href="/dashboard/ia" className="text-xs font-medium text-brand hover:underline">
                    Revisar e assinar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
