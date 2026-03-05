import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.user_metadata?.role as string | undefined) ?? "patient";
  if (role !== "patient") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminClient();

  await admin
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role: "patient",
      },
      { onConflict: "user_id" },
    );

  const { data: existingPatientByUser } = await admin
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingPatientByUser) {
    return NextResponse.json({ success: true, data: { linked: true } });
  }

  if (!user.email) {
    return NextResponse.json({ success: true, data: { linked: false } });
  }

  const { data: patientByEmail } = await admin
    .from("patients")
    .select("id")
    .eq("email", user.email)
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!patientByEmail) {
    return NextResponse.json({ success: true, data: { linked: false } });
  }

  await admin
    .from("patients")
    .update({
      user_id: user.id,
      name: user.user_metadata?.name ?? user.email.split("@")[0],
    })
    .eq("id", patientByEmail.id);

  return NextResponse.json({ success: true, data: { linked: true } });
}
