import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    encryptRecords: z.boolean().optional(),
    requireLgpdConsent: z.boolean().optional(),
    blurPatientData: z.boolean().optional(),
    cancellationPolicyHours: z.number().int().min(1).max(168).optional(),
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

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const settingsPayload: Record<string, unknown> = {};
  if (parsed.data.encryptRecords !== undefined) settingsPayload.encrypt_records = parsed.data.encryptRecords;
  if (parsed.data.requireLgpdConsent !== undefined) settingsPayload.require_lgpd_consent = parsed.data.requireLgpdConsent;
  if (parsed.data.blurPatientData !== undefined) settingsPayload.blur_patient_data = parsed.data.blurPatientData;

  if (Object.keys(settingsPayload).length > 0) {
    await supabase
      .from("therapist_settings")
      .upsert({ therapist_id: therapist.id, ...settingsPayload }, { onConflict: "therapist_id" });
  }

  if (parsed.data.cancellationPolicyHours !== undefined) {
    await supabase
      .from("therapists")
      .update({ cancellation_policy_hours: parsed.data.cancellationPolicyHours })
      .eq("id", therapist.id);
  }

  const [{ data: updatedSettings }, { data: updatedTherapist }] = await Promise.all([
    supabase
      .from("therapist_settings")
      .select("encrypt_records, require_lgpd_consent, blur_patient_data")
      .eq("therapist_id", therapist.id)
      .single(),
    supabase
      .from("therapists")
      .select("cancellation_policy_hours")
      .eq("id", therapist.id)
      .single(),
  ]);

  await supabase.from("audit_logs").insert({
    therapist_id: therapist.id,
    user_id: user.id,
    action: "update",
    table_name: "therapist_settings",
    record_id: therapist.id,
    metadata: {
      updatedFields: Object.keys(parsed.data),
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      encryptRecords: updatedSettings?.encrypt_records ?? true,
      requireLgpdConsent: updatedSettings?.require_lgpd_consent ?? true,
      blurPatientData: updatedSettings?.blur_patient_data ?? false,
      cancellationPolicyHours: updatedTherapist?.cancellation_policy_hours ?? 24,
    },
  });
}
