import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";


export const metadata: Metadata = { title: "Sessões" };

type PatientRecord = {
  id: string;
};

type AppointmentRecord = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  video_room_url: string | null;
};

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

  let patient = patientRls as PatientRecord | null;
  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();
    patient = patientAdmin as PatientRecord | null;
  }
  if (!patient) redirect("/dashboard");

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, video_room_url")
    .eq("patient_id", patient.id)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  const appointments = (appointmentsData ?? []) as AppointmentRecord[];
  const now = new Date();

  const upcoming = appointments
    .filter((item) => {
      const date = new Date(item.scheduled_at);
      return (
        ["pending", "confirmed", "in_progress"].includes(item.status) &&
        date.getTime() >= now.getTime() - 30 * 60 * 1000
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

  const history = appointments
    .filter((item) => !upcoming.some((future) => future.id === item.id))
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-portal-text-primary sm:text-4xl">
          Minhas sessões
        </h1>
        <p className="mt-2 text-sm text-portal-text-secondary">
          Acompanhe próximas consultas e histórico terapêutico em ordem cronológica.
        </p>
      </header>

      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-center gap-2 text-portal-brand">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <h2 className="font-display text-2xl text-portal-text-primary">
              Próximas
            </h2>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState message="Nenhuma sessão agendada no momento." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <SessionCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-portal-text-neutral">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <h2 className="font-display text-2xl text-portal-text-primary">
              Histórico
            </h2>
          </div>

          {history.length === 0 ? (
            <EmptyState message="Seu histórico aparecerá aqui após as primeiras consultas." />
          ) : (
            <div className="space-y-3">
              {history.map((appointment) => (
                <SessionCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SessionCard({ appointment }: { appointment: AppointmentRecord }) {
  const scheduledAt = new Date(appointment.scheduled_at);
  const status = normalizeStatus(appointment.status);
  const statusLabel = statusToLabel(status);
  const dateText = scheduledAt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
  const timeText = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationText = `${appointment.duration_minutes ?? 50} min`;
  const canJoin = ["pending", "confirmed", "in_progress"].includes(appointment.status);
  const isCancelled = status === "cancelada";

  return (
    <article className="rounded-2xl border border-portal-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-portal-text-primary">Sessão terapêutica</h3>
          <p className={`mt-0.5 text-xs text-portal-text-neutral ${isCancelled ? "line-through" : ""}`}>
            {dateText} • {timeText} • {durationText}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClass(status)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-portal-text-faint">ID da sessão: {appointment.id.slice(0, 8)}</span>
        {canJoin ? (
          appointment.video_room_url ? (
            <a
              href={appointment.video_room_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-portal-brand-hover"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              Entrar
            </a>
          ) : (
            <Link
              href="/portal/agendar"
              className="inline-flex items-center rounded-lg border border-portal-brand/30 px-3 py-2 text-xs font-semibold text-portal-brand transition-colors hover:bg-portal-bg-subtle"
            >
              Ver agenda
            </Link>
          )
        ) : null}
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-portal-border-dashed bg-portal-bg-muted px-4 py-5 text-sm text-portal-text-faint">
      {message}
    </div>
  );
}

function normalizeStatus(raw: string): "confirmada" | "concluida" | "cancelada" | "pendente" {
  if (raw === "completed") return "concluida";
  if (raw === "cancelled" || raw === "no_show") return "cancelada";
  if (raw === "confirmed" || raw === "in_progress") return "confirmada";
  return "pendente";
}

function statusToLabel(status: "confirmada" | "concluida" | "cancelada" | "pendente") {
  if (status === "confirmada") return "Confirmada";
  if (status === "concluida") return "Concluída";
  if (status === "cancelada") return "Cancelada";
  return "Pendente";
}

function statusClass(status: "confirmada" | "concluida" | "cancelada" | "pendente") {
  if (status === "confirmada") {
    return "border-portal-brand/20 bg-portal-brand/10 text-portal-brand";
  }
  if (status === "concluida") {
    return "border-portal-border-status bg-portal-bg-status text-portal-text-neutral";
  }
  if (status === "cancelada") {
    return "border-portal-danger/25 bg-portal-danger/10 text-portal-danger";
  }
  return "border-portal-border-status bg-white text-portal-text-neutral";
}
