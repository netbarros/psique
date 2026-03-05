import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    crp: z.string().trim().min(3).max(30).optional(),
    bio: z.string().trim().max(5000).optional(),
    sessionPrice: z.number().positive().max(100000).optional(),
    sessionDuration: z.number().int().min(20).max(180).optional(),
    timezone: z.string().trim().min(3).max(120).optional(),
    photoUrl: z.string().trim().url().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) payload.name = parsed.data.name;
  if (parsed.data.crp !== undefined) payload.crp = parsed.data.crp;
  if (parsed.data.bio !== undefined) payload.bio = parsed.data.bio;
  if (parsed.data.sessionPrice !== undefined) payload.session_price = parsed.data.sessionPrice;
  if (parsed.data.sessionDuration !== undefined) payload.session_duration = parsed.data.sessionDuration;
  if (parsed.data.timezone !== undefined) payload.timezone = parsed.data.timezone;
  if (parsed.data.photoUrl !== undefined) payload.photo_url = parsed.data.photoUrl;

  const { data: therapist, error: updateError } = await supabase
    .from("therapists")
    .update(payload)
    .eq("user_id", user.id)
    .select("id, name, crp, bio, slug, session_price, session_duration, timezone, photo_url, updated_at")
    .single();

  if (updateError || !therapist) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    therapist_id: therapist.id,
    user_id: user.id,
    action: "update",
    table_name: "therapists",
    record_id: therapist.id,
    metadata: { updatedFields: Object.keys(payload) },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: therapist.id,
      name: therapist.name,
      crp: therapist.crp,
      bio: therapist.bio,
      slug: therapist.slug,
      sessionPrice: Number(therapist.session_price),
      sessionDuration: therapist.session_duration,
      timezone: therapist.timezone,
      photoUrl: therapist.photo_url,
      updatedAt: therapist.updated_at,
    },
  });
}
