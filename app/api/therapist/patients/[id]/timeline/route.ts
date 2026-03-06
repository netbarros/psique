import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { getTherapistIdByUserId } from "@/lib/growth/wallet";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  const { id: patientId } = await params;

  try {
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);

    const { data: patient, error: patientError } = await auth.context.supabase
      .from("patients")
      .select("id, name, therapist_id")
      .eq("id", patientId)
      .eq("therapist_id", therapistId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const [sessionsResult, moodResult, checkinsResult] = await Promise.all([
      auth.context.supabase
        .from("sessions")
        .select("id, session_number, started_at, ended_at, mood_before, mood_after, ai_summary")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false })
        .limit(200),
      auth.context.supabase
        .from("patient_mood_entries")
        .select("id, mood_score, note, source, created_at")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false })
        .limit(200),
      auth.context.supabase
        .from("patient_session_checkins")
        .select("id, appointment_id, mood_label, channel, response_note, sent_at, responded_at, status, created_at")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (sessionsResult.error || moodResult.error || checkinsResult.error) {
      return NextResponse.json({ error: "Failed to load patient timeline" }, { status: 500 });
    }

    const timelineItems = [
      ...(sessionsResult.data ?? []).map((session) => ({
        type: "session" as const,
        at: session.started_at ?? session.ended_at ?? new Date().toISOString(),
        data: session,
      })),
      ...(moodResult.data ?? []).map((mood) => ({
        type: "mood" as const,
        at: mood.created_at,
        data: mood,
      })),
      ...(checkinsResult.data ?? []).map((checkin) => ({
        type: "checkin" as const,
        at: checkin.created_at,
        data: checkin,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          name: patient.name,
        },
        timeline: timelineItems,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
