import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type React from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/auth/access-routing";
import { slugify } from "@/lib/utils";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get therapist profile
  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, crp, slug, onboarding_completed, ai_model, telegram_bot_username, openrouter_key_hash")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    let role = normalizeUserRole(user.user_metadata?.role);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();

      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const dbRole = normalizeUserRole(roleRow?.role);
      if (dbRole) role = dbRole;

      if (role === "therapist") {
        const displayName =
          (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
          (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
          (user.email?.split("@")[0] ?? "Terapeuta");
        const slugBase = slugify(displayName) || "terapeuta";

        await admin.from("therapists").insert({
          user_id: user.id,
          name: displayName,
          crp: "00/00000",
          slug: `${slugBase}-${randomSuffix()}`,
        });

        redirect("/dashboard/onboarding?setup=created");
      }
    }

    if (role === "patient") {
      redirect("/portal?error=patient_role_redirect");
    }

    if (role === "master_admin") {
      redirect("/admin");
    }

    redirect("/dashboard/onboarding?error=therapist_profile_missing");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <DashboardShell therapist={therapist} user={user}>
        {children}
      </DashboardShell>
    </div>
  );
}
