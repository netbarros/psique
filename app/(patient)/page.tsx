import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, formatBRL } from "@/lib/utils";
import { 
  CalendarDays, 
  BrainCircuit, 
  HeartHandshake, 
  Video, 
  Calendar,
  Activity,
  ArrowRight,
  Sparkles
} from "lucide-react";

export const metadata: Metadata = { title: "Início" };

// Safe CSS animation delays inline
const stagger = (staggerDelay: number = 0.1) => ({
  animationDelay: `${staggerDelay}s`,
  animationFillMode: 'backwards' as const,
});

export default async function PatientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patientRls } = await supabase
    .from("patients")
    .select("id, name, therapist_id, mood_score")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as unknown as {
    id: string;
    name: string;
    therapist_id: string;
    mood_score: number | null;
  } | null;

  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, therapist_id, mood_score")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as unknown as {
      id: string;
      name: string;
      therapist_id: string;
      mood_score: number | null;
    } | null;
  }

  if (!patient) redirect("/dashboard");

  const p = patient;

  // Fetch therapist info
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, session_price, session_duration")
    .eq("id", p.therapist_id)
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
    .eq("patient_id", p.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
    .limit(3);

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
    .eq("patient_id", p.id)
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
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = p.name.split(" ")[0];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-6 md:p-10 lg:p-12 relative z-10">
      
      {/* Header Area */}
      <header className="mb-12 animate-slide-up" style={stagger(0.1)}>
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] tracking-tight">
          {greeting}, <span className="text-[var(--color-brand)] font-light italic">{firstName}</span>
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-4 max-w-2xl font-light">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          {t && (
            <>
              <span className="mx-3 opacity-30">|</span>
              Acompanhamento clinico com <strong className="font-medium text-[var(--color-text-primary)]">{t.name}</strong>
            </>
          )}
        </p>
      </header>

      {/* Asymmetrical Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Content Column (Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Upcoming Sessions Section */}
          <section className="animate-slide-up" style={stagger(0.2)}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] flex items-center gap-3">
                <Calendar className="text-[var(--color-brand)] opacity-80" strokeWidth={1.5} />
                Seu Próximo Encontro
              </h2>
              <Link
                href="/portal/agendar"
                className="text-[13px] font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors flex items-center gap-1"
              >
                Ver agenda <ArrowRight size={14} />
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mb-4">
                  <CalendarDays size={24} className="text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Sua agenda está livre</h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6">
                  Não há sessões marcadas para os próximos dias. Mantenha seu acompanhamento em dia.
                </p>
                <Link
                  href="/portal/agendar"
                  className="px-6 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg-base)] rounded-full text-sm font-semibold hover:bg-[var(--color-text-secondary)] transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Agendar Novo Horário
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {appointments.map((appt, i) => {
                  const date = new Date(appt.scheduled_at);
                  const isOnline = appt.type === "online";
                  const isConfirmed = appt.status === "confirmed";
                  
                  return (
                    <div 
                      key={appt.id}
                      className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-6 group hover:translate-x-1"
                    >
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center min-w-[80px] py-2 border-r border-[var(--color-border-subtle)] pr-6">
                        <span className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-1">
                          {date.toLocaleDateString("pt-BR", { month: "short" })}
                        </span>
                        <span className="text-3xl font-[family-name:var(--font-display)] font-light text-[var(--color-text-primary)]">
                          {date.toLocaleDateString("pt-BR", { day: "2-digit" })}
                        </span>
                      </div>
                      
                      {/* Info Block */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-medium text-[var(--color-text-primary)]">
                            {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                            isConfirmed 
                              ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20" 
                              : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                          }`}>
                            {isConfirmed ? "Confirmado" : "Aguardando Confirmação"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)]">
                          <span className="flex items-center gap-1.5">
                            <Activity size={14} className="opacity-70" />
                            {appt.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            {isOnline ? <Video size={14} className="opacity-70 text-[var(--color-brand)]" /> : <CalendarDays size={14} className="opacity-70" />}
                            {isOnline ? "Videochamada" : "Presencial"}
                          </span>
                        </div>
                      </div>

                      {/* Action Block */}
                      <div className="shrink-0 flex items-center">
                        {appt.video_room_url ? (
                          <a
                            href={appt.video_room_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-2.5 bg-[var(--color-brand)] text-[var(--color-bg-base)] rounded-lg text-[13px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors text-center shadow-[0_0_15px_rgba(82,183,136,0.2)]"
                          >
                            Entrar na Sala
                          </a>
                        ) : (
                          <span className="text-[12px] text-[var(--color-text-muted)] italic px-2">
                            {isOnline ? "Link em breve" : "Endereço da clínica"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent History Section */}
          {sessions.length > 0 && (
            <section className="animate-slide-up" style={stagger(0.3)}>
              <h2 className="text-lg font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] flex items-center gap-3 mb-5 opacity-90">
                Histórico Recente
              </h2>
              <div className="flex flex-col gap-3">
                {sessions.map((s) => (
                  <div key={s.id} className="relative pl-6 py-4 border-l border-[var(--color-border-subtle)] group hover:border-[var(--color-brand)]/50 transition-colors">
                    {/* Timeline Dot */}
                    <div className="absolute top-[26px] -left-[4px] w-2 h-2 rounded-full bg-[var(--color-border-strong)] group-hover:bg-[var(--color-brand)] shadow-[0_0_10px_rgba(82,183,136,0)] group-hover:shadow-[0_0_10px_rgba(82,183,136,0.5)] transition-all duration-300" />
                    
                    <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
                          Sessão Psicanalítica #{s.session_number}
                        </div>
                        <div className="text-[12px] text-[var(--color-text-muted)] mt-1">
                          {formatDate(s.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        {(s.mood_before !== null || s.mood_after !== null) && (
                          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-secondary)]">
                            <span className="opacity-70">Humor:</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {s.mood_before || "-"} <span className="text-[var(--color-brand)] mx-1">→</span> {s.mood_after || "-"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Tracker Widget */}
          <div className="glass-card p-6 flex flex-col gap-4 animate-slide-up" style={stagger(0.4)}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[13px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-1">
                  Mapeamento de Humor
                </h3>
                <div className="text-[32px] font-light font-[family-name:var(--font-display)] text-[var(--color-text-primary)] flex items-baseline gap-2">
                  {p.mood_score ? `${p.mood_score}` : "—"}
                  <span className="text-[16px] text-[var(--color-text-secondary)]">/ 5</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#3d7a5c] flex items-center justify-center shadow-[0_4px_20px_rgba(82,183,136,0.2)]">
                <HeartHandshake size={20} className="text-[var(--color-bg-base)]" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${(p.mood_score || 0) * 20}%` }} 
              />
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col gap-4 animate-slide-up" style={stagger(0.5)}>
            <Link
              href="/portal/chat"
              className="group glass-card p-6 border-transparent bg-gradient-to-br from-[var(--color-surface)] to-transparent hover:border-[var(--color-brand)]/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-brand)] opacity-[0.05] blur-[20px] rounded-full group-hover:opacity-[0.15] transition-opacity duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                    Concierge AI <Sparkles size={14} className="text-[var(--color-brand)] animate-pulse-slow" />
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">Suporte emocional contínuo e inteligente.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center group-hover:bg-[var(--color-brand)] group-hover:border-[var(--color-brand)] transition-colors duration-300">
                  <BrainCircuit size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-bg-base)] transition-colors duration-300" />
                </div>
              </div>
            </Link>

            <Link
              href="/portal/apoio"
              className="group glass-card p-6 hover:border-[var(--color-text-secondary)] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-1">
                    Central de Apoio
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">Diário e técnicas de foco.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center group-hover:bg-[var(--color-text-primary)] transition-colors duration-300">
                  <ArrowRight size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-bg-base)] transition-colors duration-300 transform group-hover:-rotate-45" />
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
