import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AgendaAppointmentActions } from "@/components/dashboard/AgendaAppointmentActions";
import { NewAppointmentSheet } from "@/components/dashboard/NewAppointmentSheet";

export const metadata: Metadata = { title: "Agenda" };

type AgendaPatient =
  | { id?: string; name?: string | null; telegram_chat_id?: string | null }
  | Array<{ id?: string; name?: string | null; telegram_chat_id?: string | null }>
  | null;

type AgendaAppointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  type: string;
  video_room_id: string | null;
  patient: AgendaPatient;
};

type DayChip = {
  index: number;
  label: string;
  date: Date;
};

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getPatientName(patient: AgendaPatient): string {
  if (!patient) return "Paciente";
  if (Array.isArray(patient)) return patient[0]?.name ?? "Paciente";
  return patient.name ?? "Paciente";
}

function toMinuteSlot(date: Date): number {
  const total = date.getHours() * 60 + date.getMinutes();
  return Math.floor(total / 30) * 30;
}

function slotLabel(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function getAgendaData(therapistId: string) {
  const supabase = await createClient();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("appointments")
    .select(`
      id, scheduled_at, duration_minutes, status, type, video_room_id,
      patient:patients(id, name, telegram_chat_id)
    `)
    .eq("therapist_id", therapistId)
    .gte("scheduled_at", weekStart.toISOString())
    .lte("scheduled_at", weekEnd.toISOString())
    .not("status", "in", '("cancelled","no_show")')
    .order("scheduled_at");

  return {
    weekStart,
    appointments: (data ?? []) as AgendaAppointment[],
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const selectedDayRaw = Number(Array.isArray(params.day) ? params.day[0] : params.day);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!therapist) redirect("/auth/login");

  const { data: patientsList } = await supabase
    .from("patients")
    .select("id, name")
    .eq("therapist_id", therapist.id)
    .order("name");

  const patientOptions = (patientsList ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const { weekStart, appointments } = await getAgendaData(therapist.id);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const selectedDay = Number.isInteger(selectedDayRaw) && selectedDayRaw >= 0 && selectedDayRaw <= 6
    ? selectedDayRaw
    : todayIndex;

  const dayChips: DayChip[] = DAY_LABELS.map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return { index, label, date };
  });

  const selectedDate = dayChips[selectedDay].date;
  const dayAppointments = appointments.filter((appt) =>
    sameDate(new Date(appt.scheduled_at), selectedDate)
  );

  const appointmentsBySlot = new Map<number, AgendaAppointment[]>();
  dayAppointments.forEach((appt) => {
    const startDate = new Date(appt.scheduled_at);
    const slot = toMinuteSlot(startDate);
    if (slot < 7 * 60 || slot > 22 * 60) return;
    const existing = appointmentsBySlot.get(slot) ?? [];
    existing.push(appt);
    appointmentsBySlot.set(slot, existing);
  });

  const slots: number[] = [];
  for (let minute = 7 * 60; minute <= 22 * 60; minute += 30) {
    slots.push(minute);
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Agenda
          </h1>
          <p className="text-sm text-text-muted capitalize">
            {selectedDate.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
        </div>
        <NewAppointmentSheet patients={patientOptions} />
      </header>

      <section className="grid grid-cols-7 gap-2">
        {dayChips.map((chip) => {
          const active = chip.index === selectedDay;
          return (
            <Link
              key={chip.label}
              href={`/dashboard/agenda?day=${chip.index}`}
              className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                active
                  ? "border-brand/40 bg-brand/15 text-brand"
                  : "border-border-subtle bg-surface text-text-secondary hover:border-border-strong"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider">{chip.label}</div>
              <div className="mt-0.5 font-display text-lg leading-none">
                {chip.date.getDate()}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        {slots.map((slot) => {
          const slotAppointments = appointmentsBySlot.get(slot) ?? [];
          const appointment = slotAppointments[0];

          return (
            <div key={slot} className="flex gap-3">
              <div className="w-14 pt-3 text-right text-xs font-medium text-text-muted">
                {slotLabel(slot)}
              </div>

              <div className="min-h-[68px] flex-1">
                {appointment ? (
                  <div className="relative rounded-xl border border-brand/20 bg-brand/10 p-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {getPatientName(appointment.patient)}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {appointment.type === "online" ? "Teleconsulta" : "Presencial"} •{" "}
                        {appointment.duration_minutes ?? 50} min
                      </p>
                      <AgendaAppointmentActions
                        appointmentId={appointment.id}
                        scheduledAt={appointment.scheduled_at}
                        status={appointment.status}
                        videoRoomId={appointment.video_room_id}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[68px] rounded-xl border border-dashed border-border-subtle opacity-30 transition-opacity hover:opacity-60" />
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
