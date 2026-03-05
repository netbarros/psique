import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  entryText: z.string().trim().min(1).max(8000),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
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
    .select("id, therapist_id, user_id")
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
  const parsedLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_journal_entries")
    .select("id, entry_text, mood_score, created_at, updated_at")
    .eq("patient_id", patient.patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load journal" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((entry) => ({
      id: entry.id,
      entryText: entry.entry_text,
      moodScore: entry.mood_score,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
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
  const { entryText, moodScore } = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("patient_journal_entries")
    .insert({
      patient_id: patient.patientId,
      therapist_id: patient.therapistId,
      entry_text: entryText,
      mood_score: moodScore ?? null,
    })
    .select("id, entry_text, mood_score, created_at, updated_at")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "Failed to save journal" }, { status: 500 });
  }

  if (typeof moodScore === "number") {
    await supabase.from("patient_mood_entries").insert({
      patient_id: patient.patientId,
      therapist_id: patient.therapistId,
      mood_score: moodScore,
      source: "journal",
    });

    await supabase
      .from("patients")
      .update({ mood_score: moodScore * 10 })
      .eq("id", patient.patientId);
  }

  await supabase.from("audit_logs").insert({
    therapist_id: patient.therapistId,
    user_id: patient.userId,
    action: "create",
    table_name: "patient_journal_entries",
    record_id: inserted.id,
    metadata: { source: "portal_patient" },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: inserted.id,
      entryText: inserted.entry_text,
      moodScore: inserted.mood_score,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    },
  });
}
