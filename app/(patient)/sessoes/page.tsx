import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDate } from "@/lib/utils";
import { 
  Activity, 
  BrainCircuit, 
  CalendarDays, 
  Clock, 
  Star, 
  TrendingUp,
  Sparkles 
} from "lucide-react";

export const metadata: Metadata = { title: "Histórico de Sessões" };

// Safe CSS animation delays inline
const stagger = (staggerDelay: number = 0.1) => ({
  animationDelay: `${staggerDelay}s`,
  animationFillMode: 'backwards' as const,
});

export default async function SessoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patientRls } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as unknown as { id: string } | null;

  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as unknown as { id: string } | null;
  }

  if (!patient) redirect("/dashboard");

  const patientId = patient.id;

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
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 lg:p-12 relative z-10">
      
      {/* Header */}
      <header className="mb-10 animate-slide-up" style={stagger(0.1)}>
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-light text-[var(--color-text-primary)] tracking-tight">
          Histórico de <span className="text-[var(--color-brand)] font-medium">Sessões</span>
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-4 max-w-2xl font-light">
          {allSessions.length} {allSessions.length === 1 ? "sessão realizada" : "sessões realizadas no total"}
        </p>
      </header>

      {/* KPI Stats */}
      {allSessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <StatBox
            label="Total de Encontros"
            value={String(allSessions.length)}
            icon={<CalendarDays size={18} className="text-[var(--color-text-primary)]" />}
            delay={0.15}
          />
          <StatBox
            label="NPS Médio"
            value={calcAvg(allSessions)}
            icon={<Star size={18} className="text-[var(--color-gold)]" />}
            delay={0.2}
          />
          <StatBox
            label="Melhora de Humor"
            value={calcMoodImprovement(allSessions)}
            icon={<TrendingUp size={18} className="text-[var(--color-brand)]" />}
            delay={0.25}
          />
        </div>
      )}

      {/* Sessions list */}
      {allSessions.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-center animate-slide-up" style={stagger(0.3)}>
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mb-6">
            <BrainCircuit size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
            O Início da sua Jornada
          </h2>
          <p className="text-[15px] text-[var(--color-text-secondary)] max-w-md">
            Suas anotações, histórico de humor e insights aparecerão aqui após sua primeira sessão clínica.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {allSessions.map((s, i) => {
            const dateStr = formatDate(s.created_at);
            const durationMin = s.duration_seconds ? Math.floor(s.duration_seconds / 60) : null;
            const moodImproved = s.mood_after !== null && s.mood_before !== null && s.mood_after > s.mood_before;

            return (
              <div 
                key={s.id} 
                className="glass-card p-6 border-l-[3px] border-l-transparent hover:border-l-[var(--color-brand)] animate-slide-up relative overflow-hidden group"
                style={stagger(0.3 + i * 0.05)}
              >
                {/* Subtle numbering watermark */}
                <span className="absolute -right-4 -bottom-8 text-[120px] font-black font-[family-name:var(--font-display)] opacity-[0.02] text-[var(--color-text-primary)] pointer-events-none select-none">
                  {String(s.session_number).padStart(2, '0')}
                </span>

                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 relative z-10 w-full">
                  
                  {/* Left Block: ID & Time */}
                  <div className="flex items-start gap-5 min-w-[280px]">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-[family-name:var(--font-display)] text-xl text-[var(--color-bg-base)] font-bold bg-gradient-to-br from-[var(--color-brand)] to-[#3d7a5c] shadow-[0_4px_20px_rgba(82,183,136,0.3)] shrink-0">
                      #{s.session_number}
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="text-[16px] text-[var(--color-text-primary)] font-medium font-[family-name:var(--font-display)] tracking-tight">
                        Sessão Psicanalítica
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} className="opacity-70" /> {dateStr}
                        </span>
                        {durationMin && (
                          <span className="flex items-center gap-1.5 border-l border-[var(--color-border-strong)] pl-3">
                            <Clock size={14} className="opacity-70" /> {durationMin} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Block: Mood & NPS metrics */}
                  <div className="flex flex-wrap items-center gap-4 xl:justify-end flex-1">
                    
                    {/* Mood Tracking */}
                    {s.mood_before !== null && s.mood_after !== null && (
                      <div className="flex items-center gap-3 bg-[var(--color-surface-hover)] px-4 py-2 rounded-xl border border-[var(--color-border-subtle)]">
                        <Activity size={16} className="text-[var(--color-text-muted)]" />
                        <div className="flex items-center gap-2 text-[13px] font-medium">
                          <span className="text-[var(--color-text-secondary)] w-5 text-center">{s.mood_before}</span>
                          <span className="text-[var(--color-text-muted)] w-4 text-center">→</span>
                          <span className={`w-5 text-center ${moodImproved ? "text-[var(--color-brand)]" : "text-[var(--color-text-primary)]"}`}>
                            {s.mood_after}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* NPS Score */}
                    {s.nps_score !== null && (
                      <div className="flex items-center gap-1 bg-[var(--color-surface-hover)] px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)]">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            fill={n <= s.nps_score! ? "var(--color-gold)" : "transparent"}
                            className={`${n <= s.nps_score! ? "text-[var(--color-gold)]" : "text-[var(--color-border-strong)]"} transition-colors`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Summary Envelope */}
                {s.ai_summary && (
                  <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] relative z-10">
                    <div className="flex gap-4 p-5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 group-hover:border-[var(--color-border-subtle)] transition-colors">
                      <div className="shrink-0 mt-0.5">
                        <Sparkles size={18} className="text-[var(--color-brand)] opacity-80" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] text-[var(--color-brand)] uppercase tracking-[0.15em] font-semibold mb-2">
                          Insights da IA
                        </div>
                        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] font-light">
                          {s.ai_summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Dedicated StatBox for Sessoes History
function StatBox({
  label,
  value,
  icon,
  delay
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <div 
      className="glass-card p-6 flex flex-col justify-between animate-slide-up"
      style={stagger(delay)}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-[12px] text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">
          {label}
        </span>
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light text-[var(--color-text-primary)] tracking-tight">
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
  return avg > 0 ? `+${avg.toFixed(1)}` : avg.toFixed(1);
}
