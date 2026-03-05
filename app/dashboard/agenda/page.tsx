import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { NewAppointmentSheet } from "@/components/dashboard/NewAppointmentSheet";
import { AgendaHeaderControls } from "@/components/dashboard/AgendaHeaderControls";

export const metadata: Metadata = { title: "Agenda" };

import { AgendaTimeGrid, AgendaAppointment } from "@/components/dashboard/AgendaTimeGrid";



async function getAgendaData(therapistId: string, startDate: Date, endDate: Date) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select(`
      id, scheduled_at, duration_minutes, status, type, video_room_id,
      patient:patients(id, name, telegram_chat_id)
    `)
    .eq("therapist_id", therapistId)
    .gte("scheduled_at", startDate.toISOString())
    .lte("scheduled_at", endDate.toISOString())
    .not("status", "in", '("cancelled","no_show")')
    .order("scheduled_at");

  return {
    appointments: (data ?? []) as AgendaAppointment[],
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};

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

  const viewParam = params.view === "day" ? "day" : "week";
  const dateParam = typeof params.date === "string" ? params.date : null;
  
  const baseDate = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();

  // Calculate borders based on ViewMode
  const startDate = new Date(baseDate);
  const endDate = new Date(baseDate);

  if (viewParam === "week") {
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7)); // start on monday
    endDate.setDate(startDate.getDate() + 6); // end on sunday
  }
  
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const { appointments } = await getAgendaData(therapist.id, startDate, endDate);

  // formatted label for the header
  let headerLabel = "";
  if (viewParam === "week") {
    if (startDate.getMonth() === endDate.getMonth()) {
      headerLabel = `Semana de ${startDate.getDate()} a ${endDate.getDate()} de ${startDate.toLocaleDateString("pt-BR", { month: "long" })}`;
    } else {
      headerLabel = `${startDate.getDate()} de ${startDate.toLocaleDateString("pt-BR", { month: "short" })} - ${endDate.getDate()} de ${endDate.toLocaleDateString("pt-BR", { month: "short" })}`;
    }
  } else {
    headerLabel = startDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }

  const currentDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;

  return (
    <div className="relative mx-auto w-full max-w-full space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Agenda
          </h1>
          <p className="text-sm text-text-muted capitalize">
            {headerLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AgendaHeaderControls currentDateStr={currentDateStr} currentView={viewParam} />
          <NewAppointmentSheet patients={patientOptions} />
        </div>
      </header>

      <section>
        <AgendaTimeGrid appointments={appointments} startDate={startDate} viewMode={viewParam} />
      </section>
    </div>
  );
}
