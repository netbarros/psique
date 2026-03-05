import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type React from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <DashboardShell therapist={therapist} user={user}>
        {children}
      </DashboardShell>
    </div>
  );
}
