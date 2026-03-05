import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsTabs from "@/components/dashboard/SettingsTabs";
import PlanSettingsForm from "@/components/dashboard/PlanSettingsForm";

export const metadata: Metadata = { title: "Configurações — Plano" };

export default async function PlanoSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("session_price, session_duration")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Plano e Oferta
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Defina os parâmetros padrão de oferta para sua prática clínica.
        </p>
      </header>

      <SettingsTabs active="plano" />

      <PlanSettingsForm
        initialSessionPrice={Number(therapist.session_price)}
        initialSessionDuration={therapist.session_duration}
      />
    </div>
  );
}
