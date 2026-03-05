import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { JournalQuickEntry } from "@/components/patient/JournalQuickEntry";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

export const metadata: Metadata = { title: "Início" };

interface PatientInfo {
  id: string;
  name: string;
  therapist_id: string;
}

interface TherapistInfo {
  name: string;
  session_duration: number;
}

interface UpcomingAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  video_room_url: string | null;
}

interface LatestSession {
  created_at: string;
  ai_summary: string | null;
}

interface LatestJournal {
  created_at: string;
  entry_text: string;
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayDifferenceFromToday(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(target);
  compare.setHours(0, 0, 0, 0);
  return Math.ceil((compare.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export default async function PatientHomePage() {
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

  let patient = patientRls as PatientInfo | null;
  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, therapist_id")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as PatientInfo | null;
  }

  if (!patient) redirect("/dashboard");

  const [{ data: therapist }, { data: upcoming }, { data: latestSession }, { data: latestJournal }] = await Promise.all([
    supabase
      .from("therapists")
      .select("name, session_duration")
      .eq("id", patient.therapist_id)
      .single(),
    supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, status, video_room_url")
      .eq("patient_id", patient.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("created_at, ai_summary")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("patient_journal_entries")
      .select("created_at, entry_text")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const therapistInfo = therapist as TherapistInfo | null;
  const nextAppointment = upcoming as UpcomingAppointment | null;
  const lastSession = latestSession as LatestSession | null;
  const latestJournalEntry = latestJournal as LatestJournal | null;

  const firstName = patient.name.split(" ")[0];
  const quote =
    '"A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original."';

  const nextDate = nextAppointment ? new Date(nextAppointment.scheduled_at) : null;
  const daysUntil = nextDate ? dayDifferenceFromToday(nextDate) : null;
  const durationMinutes =
    nextAppointment?.duration_minutes ?? therapistInfo?.session_duration ?? 50;
  const entryPreview =
    latestJournalEntry?.entry_text?.trim() ||
    lastSession?.ai_summary?.trim() ||
    "Tive aquele sonho recorrente de novo. Desta vez acordei com uma sensação de leveza e curiosidade sobre o que esse símbolo pode representar.";

  return (
    <div className="space-y-8 py-6 md:py-10">
      <section>
        <h2 className="font-display text-3xl font-medium text-portal-text-primary">
          Bom dia, {firstName}.
        </h2>
        <p className="mt-2 text-base italic text-portal-text-faint">{quote}</p>
      </section>

      <section>
        <EnterpriseCard className="p-0 overflow-hidden" delay={0.1}>
          <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-portal-brand to-sky-400" />

          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-portal-bg-subtle px-3 py-1 text-xs font-medium text-portal-brand">
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                Próxima sessão
              </div>
              <span className="text-sm font-medium text-portal-text-faint">
                {daysUntil === null
                  ? "Sem horário definido"
                  : daysUntil <= 0
                    ? "Hoje"
                    : `Faltam ${daysUntil} dia${daysUntil > 1 ? "s" : ""}`}
              </span>
            </div>

            {nextDate ? (
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-semibold text-portal-text-primary capitalize">
                  {dateLabel(nextDate)}
                </h3>
                <p className="flex items-center gap-1.5 text-sm text-portal-text-faint">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {timeLabel(nextDate)} - {durationMinutes} min
                </p>
                <p className="flex items-center gap-1.5 text-sm text-portal-text-faint">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {therapistInfo?.name ?? "Seu terapeuta"}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-portal-border bg-white p-4 text-sm text-portal-text-faint">
                Você não possui sessões confirmadas no momento.
              </div>
            )}

            {nextAppointment?.video_room_url ? (
              <a
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-portal-brand px-4 py-3.5 text-sm font-medium text-white shadow-md shadow-blue-900/10 transition-colors hover:bg-portal-brand-hover"
                href={nextAppointment.video_room_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="material-symbols-outlined text-[16px]">videocam</span>
                Entrar na sala virtual
              </a>
            ) : (
              <Link
                className="inline-flex w-full items-center justify-center rounded-xl bg-portal-brand px-4 py-3.5 text-sm font-medium text-white shadow-md shadow-blue-900/10 transition-colors hover:bg-portal-brand-hover"
                href="/portal/agendar"
              >
                Ver agenda e horários
              </Link>
            )}
          </div>
        </EnterpriseCard>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-medium text-portal-text-primary">
            Diário de reflexão
          </h3>
          <Link className="text-sm font-medium text-portal-brand hover:underline" href="/portal/apoio">
            Ver todos
          </Link>
        </div>

        <p className="text-sm text-portal-text-faint">
          Um espaço seguro para registrar pensamentos, sonhos e emoções entre as sessões.
        </p>

        <JournalQuickEntry
          initialPreview={entryPreview}
          initialCreatedAt={latestJournalEntry?.created_at ?? null}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 pb-4">
        <EnterpriseCard delay={0.2} interactive className="p-0">
          <Link
            className="flex h-full flex-col items-start gap-3 p-4 text-left"
            href="/portal/apoio"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-portal-brand">
              <span className="material-symbols-outlined text-[16px]">air</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-portal-text-primary">Exercício de respiração</h4>
              <p className="mt-0.5 text-xs text-portal-text-faint">3 minutos</p>
            </div>
          </Link>
        </EnterpriseCard>

        <EnterpriseCard delay={0.3} interactive className="p-0">
          <Link
            className="flex h-full flex-col items-start gap-3 p-4 text-left"
            href="/portal/chat"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-portal-brand">
              <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-portal-text-primary">Assistente IA</h4>
              <p className="mt-0.5 text-xs text-portal-text-faint">Tirar dúvidas</p>
            </div>
          </Link>
        </EnterpriseCard>
      </section>
    </div>
  );
}
