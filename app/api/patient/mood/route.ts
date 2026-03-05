import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  moodScore: z.number().int().min(1).max(10),
  note: z.string().trim().max(500).optional(),
});

async function getPatientOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, therapist_id")
    .eq("user_id", user.id)
    .single();

  if (!patient) return null;

  return {
    userId: user.id,
    patientId: patient.id,
    therapistId: patient.therapist_id,
  };
}

export async function GET(request: Request) {
  const patient = await getPatientOrNull();
  if (!patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 30;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_mood_entries")
    .select("id, mood_score, note, source, created_at")
    .eq("patient_id", patient.patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load mood history" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((entry) => ({
      id: entry.id,
      moodScore: entry.mood_score,
      note: entry.note,
      source: entry.source,
      createdAt: entry.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const patient = await getPatientOrNull();
  if (!patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const { moodScore, note } = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("patient_mood_entries")
    .insert({
      patient_id: patient.patientId,
      therapist_id: patient.therapistId,
      mood_score: moodScore,
      note: note ?? null,
      source: "manual",
    })
    .select("id, mood_score, note, source, created_at")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }

  await supabase
    .from("patients")
    .update({ mood_score: moodScore * 10 })
    .eq("id", patient.patientId);

  await supabase.from("audit_logs").insert({
    therapist_id: patient.therapistId,
    user_id: patient.userId,
    action: "update",
    table_name: "patients",
    record_id: patient.patientId,
    metadata: { moodScore },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: inserted.id,
      moodScore: inserted.mood_score,
      note: inserted.note,
      source: inserted.source,
      createdAt: inserted.created_at,
    },
  });
}
