import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatBRL, formatDate } from "@/lib/utils";
import { 
  CalendarDays, 
  Clock, 
  CreditCard, 
  Video, 
  Lightbulb,
  Link2 
} from "lucide-react";

export const metadata: Metadata = { title: "Agendar Sessão" };

// Safe CSS animation delays
const stagger = (delay: number = 0.1) => ({
  animationDelay: `${delay}s`,
  animationFillMode: 'backwards' as const,
});

export default async function AgendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patientRls } = await supabase
    .from("patients")
    .select("id, name, therapist_id")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as unknown as { id: string; name: string; therapist_id: string } | null;

  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, therapist_id")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as unknown as { id: string; name: string; therapist_id: string } | null;
  }

  if (!patient) redirect("/dashboard");

  const therapistId = patient.therapist_id;

  // Fetch therapist info
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, session_price, session_duration, slug")
    .eq("id", therapistId)
    .single();

  const t = therapist as unknown as {
    name: string;
    session_price: number;
    session_duration: number;
    slug: string;
  } | null;

  // Fetch weekly availability
  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("therapist_id", therapistId)
    .eq("active", true)
    .order("day_of_week")
    .order("start_time");

  const slots = (availability ?? []) as unknown as Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;

  // Fetch existing appointments to mark unavailable
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 14);

  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("therapist_id", therapistId)
    .in("status", ["pending", "confirmed", "in_progress"])
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", nextWeek.toISOString());

  const booked = (existingAppts ?? []).map(
    (a: unknown) => (a as { scheduled_at: string }).scheduled_at
  );

  const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Group slots by day
  const slotsByDay: Record<number, typeof slots> = {};
  for (const slot of slots) {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = [];
    slotsByDay[slot.day_of_week].push(slot);
  }

  // Generate next 14 days
  const days: Array<{ date: Date; dayOfWeek: number; dateStr: string; fullDate: string }> = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: d,
      dayOfWeek: d.getDay(),
      dateStr: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      fullDate: d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    });
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12 relative z-10">
      
      {/* Header Area */}
      <header className="mb-10 animate-slide-up" style={stagger(0.1)}>
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-light text-[var(--color-text-primary)] tracking-tight">
          Agendar <span className="text-[var(--color-brand)] font-medium">Sessão</span>
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-4 max-w-2xl font-light">
          Escolha o melhor horário para sua próxima sessão
          {t && (
            <>
              <span className="mx-2 opacity-30">|</span>
              com <strong className="font-medium text-[var(--color-text-primary)]">{t.name}</strong>
            </>
          )}
        </p>
      </header>

      {/* Session Info Cards */}
      {t && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <InfoBox 
            label="Duração" 
            value={`${t.session_duration} min`} 
            icon={<Clock size={18} className="text-[var(--color-text-primary)]" />} 
            delay={0.15} 
          />
          <InfoBox 
            label="Investimento" 
            value={formatBRL(Number(t.session_price))} 
            icon={<CreditCard size={18} className="text-[var(--color-brand)]" />} 
            delay={0.2} 
          />
          <InfoBox 
            label="Modalidade" 
            value="Remoto" 
            icon={<Video size={18} className="text-[var(--color-text-primary)]" />} 
            delay={0.25} 
          />
        </div>
      )}

      {/* Main Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Availability Section */}
        <div className="lg:col-span-8 flex flex-col gap-6 animate-slide-up" style={stagger(0.3)}>
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <CalendarDays size={20} className="text-[var(--color-brand)]" />
              <h2 className="text-[20px] font-[family-name:var(--font-display)] font-medium text-[var(--color-text-primary)] tracking-tight">
                Horários Disponíveis da Semana
              </h2>
            </div>
            
            {slots.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-surface-hover)]">
                <CalendarDays size={32} className="text-[var(--color-text-muted)] mb-4 opacity-50" />
                <p className="text-[14px] text-[var(--color-text-secondary)]">
                  Nenhuma disponibilidade configurada pelo profissional.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {days
                  .filter((d) => slotsByDay[d.dayOfWeek])
                  .map((day) => (
                    <div key={day.dateStr} className="relative pl-4 border-l-2 border-[var(--color-border-subtle)] hover:border-[var(--color-brand)] transition-colors group">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-bg-base)] border-2 border-[var(--color-border-subtle)] group-hover:border-[var(--color-brand)] transition-colors" />
                      
                      <div className="mb-4">
                        <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] capitalize">
                          {DAYS[day.dayOfWeek]}, <span className="text-[var(--color-text-muted)] font-normal">{day.dateStr}</span>
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {slotsByDay[day.dayOfWeek].map((slot) => {
                          const times = generateTimeSlots(
                            slot.start_time,
                            slot.end_time,
                            t?.session_duration ?? 50
                          );
                          
                          return times.map((time) => {
                            const slotDate = new Date(day.date);
                            const [h, m] = time.split(":").map(Number);
                            slotDate.setHours(h, m, 0, 0);
                            const isBooked = booked.some(
                              (b) => Math.abs(new Date(b).getTime() - slotDate.getTime()) < 3600000
                            );

                            return (
                              <div
                                key={`${day.dateStr}-${time}`}
                                className={`
                                  relative overflow-hidden px-5 py-2.5 rounded-xl text-[14px] font-[family-name:var(--font-display)] tracking-wider transition-all duration-300
                                  ${isBooked 
                                    ? "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] cursor-not-allowed opacity-50" 
                                    : "bg-gradient-to-br from-[var(--color-surface-hover)] to-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] cursor-pointer hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_15px_rgba(82,183,136,0.1)]"
                                  }
                                `}
                              >
                                {isBooked && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
                                     <div className="w-full h-px bg-[var(--color-text-muted)] rotate-[-15deg] scale-150" />
                                  </div>
                                )}
                                <span className={isBooked ? "line-through" : ""}>{time}</span>
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 animate-slide-up" style={stagger(0.4)}>
          <div className="glass-panel p-6 rounded-2xl border border-[var(--color-brand)]/20 shadow-[0_4px_30px_rgba(82,183,136,0.05)] relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-brand)] blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center border border-[var(--color-brand)]/20">
                <Lightbulb size={18} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-2 uppercase tracking-widest">
                  Como funciona
                </h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  Ao selecionar um horário disponível, o sistema reservará a vaga. Sua sessão será confirmada <strong>automaticamente após a compensação do pagamento</strong>.
                </p>
                {t && (
                  <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                    <p className="text-[13px] text-[var(--color-text-muted)] mb-2">
                       Acesso rápido via link externo:
                    </p>
                    <a
                      href={`/booking/${t.slug}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors focus:outline-none"
                    >
                      <Link2 size={14} /> Página Pública de Agendamento
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Internal standard component
function InfoBox({
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
      className="glass-card p-6 flex flex-col justify-between animate-slide-up hover:border-[var(--color-border-strong)] transition-all duration-300"
      style={stagger(delay)}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold flex items-center gap-2">
           {icon} {label}
        </span>
      </div>
      <div className="font-[family-name:var(--font-display)] text-[26px] font-light text-[var(--color-text-primary)] tracking-tight">
        {value}
      </div>
    </div>
  );
}

function generateTimeSlots(
  start: string,
  end: string,
  durationMin: number
): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;

  while (current + durationMin <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += durationMin;
  }

  return slots;
}
