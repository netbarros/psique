import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";

export const metadata: Metadata = {
  title: { default: "Portal do Paciente", template: "%s — Psique" },
  description: "Seu espaço terapêutico na plataforma Psique.",
};

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  therapist_id: string;
}

interface TherapistInfo {
  name: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "PT";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: patientRls } = await supabase
    .from("patients")
    .select("id, name, email, therapist_id")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as PatientInfo | null;
  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, email, therapist_id")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as PatientInfo | null;
  }

  if (!patient) redirect("/dashboard");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("name")
    .eq("id", patient.therapist_id)
    .single();

  const therapistInfo = therapist as TherapistInfo | null;

  async function signOutAction() {
    "use server";
    const actionClient = await createClient();
    await actionClient.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <div data-theme="patient" className="min-h-screen bg-portal-bg-base text-portal-text-primary">
      <div className="md:flex md:min-h-screen">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-portal-border bg-white md:flex">
          <div className="border-b border-portal-border px-5 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-portal-text-faint">Portal do Paciente</p>
            <h1 className="font-display text-2xl font-semibold text-portal-text-primary">Psique</h1>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            <Link className="rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-primary hover:bg-portal-bg-subtle" href="/portal">
              Início
            </Link>
            <Link className="rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-primary hover:bg-portal-bg-subtle" href="/portal/agendar">
              Agenda
            </Link>
            <Link className="rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-primary hover:bg-portal-bg-subtle" href="/portal/apoio">
              Diário
            </Link>
            <Link className="rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-primary hover:bg-portal-bg-subtle" href="/portal/sessoes">
              Pagamentos
            </Link>
            <Link className="rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-primary hover:bg-portal-bg-subtle" href="/portal/chat">
              Assistente IA
            </Link>
          </nav>

          <div className="border-t border-portal-border px-5 py-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-portal-bg-subtle text-xs font-semibold text-portal-brand">
                {initials(patient.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-portal-text-primary">{patient.name}</p>
                <p className="truncate text-xs text-portal-text-faint">{therapistInfo?.name ?? "Terapeuta"}</p>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-portal-border bg-white px-3 py-2 text-xs font-semibold text-portal-brand transition-colors hover:border-portal-brand/30 hover:bg-portal-bg-subtle"
                type="submit"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Encerrar sessão
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-50 flex items-center justify-between border-b border-portal-border bg-portal-bg-base/85 px-6 py-4 backdrop-blur-md md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-portal-bg-subtle text-portal-brand">
                Ψ
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-portal-text-faint">Portal do Paciente</p>
                <h1 className="font-display text-xl font-semibold text-portal-text-primary">Psique</h1>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-portal-border bg-white text-xs font-semibold text-portal-brand">
              {initials(patient.name)}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 md:pb-10">
            <div className="mx-auto w-full max-w-md px-6 md:max-w-none md:px-10">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-portal-border bg-white/90 px-6 pb-4 pt-2 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link className="flex flex-col items-center gap-1 text-portal-brand" href="/portal">
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span className="text-[10px] font-medium">Início</span>
          </Link>
          <Link className="flex flex-col items-center gap-1 text-portal-text-faint hover:text-portal-text-primary" href="/portal/agendar">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <span className="text-[10px] font-medium">Agenda</span>
          </Link>
          <Link className="flex flex-col items-center gap-1 text-portal-text-faint hover:text-portal-text-primary" href="/portal/apoio">
            <span className="material-symbols-outlined text-[20px]">favorite</span>
            <span className="text-[10px] font-medium">Diário</span>
          </Link>
          <Link className="flex flex-col items-center gap-1 text-portal-text-faint hover:text-portal-text-primary" href="/portal/sessoes">
            <span className="material-symbols-outlined text-[20px]">credit_card</span>
            <span className="text-[10px] font-medium">Pagamentos</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
