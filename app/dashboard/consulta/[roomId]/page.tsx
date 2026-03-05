import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import ConsultaClient from "@/components/dashboard/ConsultaClient";

export const metadata: Metadata = { title: "Consulta" };

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  // Find appointment by video_room_id
  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      id, patient_id, scheduled_at, duration_minutes, video_room_url, status,
      patient:patients(name)
    `)
    .eq("therapist_id", therapist.id)
    .eq("video_room_id", roomId)
    .single();

  if (!appointment) notFound();

  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("appointment_id", appointment.id)
    .maybeSingle();

  let sessionId = existingSession?.id ?? null;
  if (!sessionId) {
    const { count: sessionCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", appointment.patient_id);

    const nextSessionNumber = (sessionCount ?? 0) + 1;
    const { data: createdSession } = await supabase
      .from("sessions")
      .insert({
        appointment_id: appointment.id,
        therapist_id: therapist.id,
        patient_id: appointment.patient_id,
        session_number: nextSessionNumber,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    sessionId = createdSession?.id ?? null;
  }

  if (!sessionId) notFound();

  const patient = appointment.patient as unknown as { name: string } | null;

  return (
    <ConsultaClient
      roomUrl={appointment.video_room_url ?? ""}
      sessionId={sessionId}
      patientName={patient?.name ?? "Paciente"}
      scheduledAt={appointment.scheduled_at}
      durationMinutes={appointment.duration_minutes}
    />
  );
}
