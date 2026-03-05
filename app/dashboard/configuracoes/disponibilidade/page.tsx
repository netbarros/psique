import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AvailabilityForm } from "@/components/dashboard/AvailabilityForm";

export const metadata: Metadata = {
  title: "Disponibilidade | Configurações",
};

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) redirect("/auth/login");

  type AvailabilityRow = {
    id: string;
    therapist_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_off: boolean;
  };

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("therapist_id", therapist.id)
    .order("day_of_week");

  const availability = (data as unknown) as AvailabilityRow[] | null;

  // Defaults to Seg-Sex 08:00 - 18:00
  const days = Array.from({ length: 7 }, (_, i) => {
    const existing = availability?.find((a) => a.day_of_week === i);
    return {
      index: i,
      label: DAY_LABELS[i],
      active: existing ? !existing.is_off : (i !== 0 && i !== 6),
      start: existing?.start_time?.slice(0, 5) ?? "08:00",
      end: existing?.end_time?.slice(0, 5) ?? "18:00",
    };
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Disponibilidade
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure as regras da sua agenda semanal. Estes horários aparecerão abertos para autoagendamento de pacientes.
        </p>
      </header>

      <AvailabilityForm initialDays={days} therapistId={therapist.id} />
    </div>
  );
}
