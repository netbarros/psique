import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatBRL } from "@/lib/utils";
import { PortalScheduleClient } from "@/components/patient/PortalScheduleClient";


export const metadata: Metadata = { title: "Agendar Sessão" };

type PatientRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  therapist_id: string;
};

type TherapistRecord = {
  name: string;
  session_price: number;
  session_duration: number;
  slug: string;
};

type AvailabilitySlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BookedAppointment = {
  scheduled_at: string;
};

type DayGroup = {
  weekLabel: string;
  dateLabel: string;
  fullLabel: string;
  times: Array<{ label: string; iso: string; isBooked: boolean }>;
};

export default async function AgendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: patientRls } = await supabase
    .from("patients")
    .select("id, name, email, phone, therapist_id")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as PatientRecord | null;
  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, email, phone, therapist_id")
      .eq("user_id", user.id)
      .single();
    patient = patientAdmin as PatientRecord | null;
  }
  if (!patient) redirect("/dashboard");

  const { data: therapistData } = await supabase
    .from("therapists")
    .select("name, session_price, session_duration, slug")
    .eq("id", patient.therapist_id)
    .single();
  const therapist = therapistData as TherapistRecord | null;

  const { data: availabilityData } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("therapist_id", patient.therapist_id)
    .eq("is_off", false)
    .order("day_of_week")
    .order("start_time");
  const availability = (availabilityData ?? []) as AvailabilitySlot[];

  const twoWeeksAhead = new Date();
  twoWeeksAhead.setDate(twoWeeksAhead.getDate() + 14);
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("scheduled_at")
    .eq("therapist_id", patient.therapist_id)
    .in("status", ["pending", "confirmed", "in_progress"])
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", twoWeeksAhead.toISOString());

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("blocked_at")
    .eq("therapist_id", patient.therapist_id)
    .gte("blocked_at", new Date().toISOString())
    .lte("blocked_at", twoWeeksAhead.toISOString());

  const bookedEpochs = [
    ...((existingAppointments ?? []) as BookedAppointment[]).map((item) =>
      new Date(item.scheduled_at).getTime()
    ),
    ...((blocks ?? []) as { blocked_at: string }[]).map((b) =>
      new Date(b.blocked_at).getTime()
    )
  ];

  const availabilityByDay = new Map<number, AvailabilitySlot[]>();
  for (const slot of availability) {
    const current = availabilityByDay.get(slot.day_of_week) ?? [];
    current.push(slot);
    availabilityByDay.set(slot.day_of_week, current);
  }

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const fullLabels = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const dayGroups: DayGroup[] = [];

  for (let i = 1; i <= 14; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const daySlots = availabilityByDay.get(date.getDay());
    if (!daySlots?.length) continue;

    const times = daySlots.flatMap((slot) => {
      const generated = generateTimeSlots(
        slot.start_time,
        slot.end_time,
        therapist?.session_duration ?? 50
      );
      return generated.map((timeLabel) => {
        const [hour, minute] = timeLabel.split(":").map(Number);
        const dateTime = new Date(date);
        dateTime.setHours(hour, minute, 0, 0);

        const isBooked = bookedEpochs.some(
          (epoch) => Math.abs(epoch - dateTime.getTime()) < 60 * 1000
        );

        return {
          label: timeLabel,
          iso: dateTime.toISOString(),
          isBooked,
        };
      });
    });

    dayGroups.push({
      weekLabel: dayLabels[date.getDay()] ?? "",
      dateLabel: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
      fullLabel: `${fullLabels[date.getDay()] ?? ""}, ${date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      })}`,
      times,
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
      <header className="mb-8 rounded-3xl border border-portal-border-soft bg-white p-6 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-portal-text-heading sm:text-4xl">
          Agendar Sessão
        </h1>
        <p className="mt-2 text-sm text-portal-text-secondary">
          Escolha data e horário para sua próxima sessão com{" "}
          <span className="font-medium text-portal-text-heading">{therapist?.name ?? "sua terapeuta"}</span>.
        </p>

        {therapist ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoChip
              icon={<span className="material-symbols-outlined text-[16px]">schedule</span>}
              label="Duração"
              value={`${therapist.session_duration} min`}
            />
            <InfoChip
              icon={<span className="material-symbols-outlined text-[16px]">credit_card</span>}
              label="Investimento"
              value={formatBRL(Number(therapist.session_price))}
            />
            <InfoChip
              icon={<span className="material-symbols-outlined text-[16px]">videocam</span>}
              label="Modalidade"
              value="Consulta online"
            />
          </div>
        ) : null}
      </header>

      <PortalScheduleClient
        dayGroups={dayGroups}
        patient={{
          name: patient.name,
          email: patient.email ?? user.email ?? "",
          phone: patient.phone,
        }}
        sessionPrice={Number(therapist?.session_price ?? 0)}
      />
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-portal-border-soft bg-portal-bg-muted p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-portal-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-portal-text-heading">{value}</p>
    </div>
  );
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let current = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const slots: string[] = [];

  while (current + durationMinutes <= end) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    current += durationMinutes;
  }

  return slots;
}
