import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // 'recovery' or undefined
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }

    const userRole = (data.user?.user_metadata?.role as string | undefined) ?? "therapist";

    // Patient bootstrap: attach auth user to existing patient row by email.
    if (data.user && data.session && userRole === "patient") {
      const admin = createAdminClient();

      const { data: patientByUser } = await admin
        .from("patients")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!patientByUser && data.user.email) {
        const { data: patientByEmail } = await admin
          .from("patients")
          .select("id")
          .eq("email", data.user.email)
          .is("user_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (patientByEmail) {
          await admin
            .from("patients")
            .update({
              user_id: data.user.id,
              name:
                data.user.user_metadata?.name ??
                data.user.user_metadata?.full_name ??
                undefined,
            })
            .eq("id", patientByEmail.id);
        }
      }

      return NextResponse.redirect(`${origin}${next ?? "/portal"}`);
    }

    // Therapist bootstrap.
    if (data.user && data.session) {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("therapists")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existing) {
        const userName: string =
          data.user.user_metadata?.name ??
          data.user.user_metadata?.full_name ??
          data.user.email?.split("@")[0] ??
          "Terapeuta";

        const slug = slugify(userName) + "-" + Math.random().toString(36).slice(2, 6);

        await admin.from("therapists").insert({
          user_id: data.user.id,
          name: userName,
          crp: data.user.user_metadata?.crp ?? "00/00000",
          slug,
        });

        return NextResponse.redirect(`${origin}/dashboard/onboarding`);
      }
    }

    return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
